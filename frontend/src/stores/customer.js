import { defineStore } from "pinia";
import api from "../services/api";

const normalizePhone = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("977")) return `+${digits}`;
  if (digits.startsWith("0")) return `+977${digits.slice(1)}`;
  return `+977${digits}`;
};

const normalizeRoom = (room) => {
  if (!room) return null;
  return {
    ...room,
    roomNumber: room.roomNumber || null,
    roomType: room.roomType || null,
    ratePerNight: Number(room.ratePerNight || room.pricePerNight || 0),
    floorNumber: room.floorNumber || room.floor || null,
  };
};

const normalizeSearchText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const scoreCustomerMatch = (customer, query) => {
  const normalizedQuery = normalizeSearchText(query);
  const normalizedName = normalizeSearchText(customer?.fullName);
  const normalizedPhone = normalizeSearchText(customer?.phoneNumber);

  if (!normalizedQuery) return 0;
  if (normalizedName === normalizedQuery || normalizedPhone === normalizedQuery)
    return 0;
  if (normalizedName.startsWith(normalizedQuery)) return 1;
  if (normalizedPhone.startsWith(normalizedQuery)) return 2;
  if (normalizedName.includes(normalizedQuery)) return 3;
  if (normalizedPhone.includes(normalizedQuery)) return 4;

  const tokens = normalizedQuery.split(" ").filter(Boolean);
  if (
    tokens.length &&
    tokens.every((token) => normalizedName.includes(token))
  ) {
    return 5;
  }

  return 6;
};

const buildSummary = (customer, history, currentRoom = null) => {
  const stays = history?.stays || [];
  const invoices = history?.invoices || [];

  const visitCount = stays.length;
  const lastStayDate = stays[0]?.checkOutDate || stays[0]?.checkInDate || null;
  const firstStayDate = stays[stays.length - 1]?.checkInDate || null;
  const totalSpentFromInvoices = invoices.reduce(
    (sum, invoice) => sum + Number(invoice.totalAmount || 0),
    0,
  );

  return {
    ...customer,
    currentRoom: normalizeRoom(currentRoom),
    visitCount,
    lastStayDate,
    firstStayDate,
    totalSpent:
      Number(customer?.totalSpent || 0) > 0
        ? Number(customer.totalSpent)
        : totalSpentFromInvoices,
  };
};

export const useCustomerStore = defineStore("customer", {
  state: () => ({
    searchQuery: "",
    searchResults: [],
    selectedCustomer: null,
    customerStays: [],
    availableRooms: [],
    currentStay: null,
    isSearching: false,
    isSubmitting: false,
    assigningRoom: false,
  }),
  actions: {
    async fetchAvailableRooms() {
      const { data } = await api.get("/rooms/available");
      this.availableRooms = (data.rooms || []).map((room) =>
        normalizeRoom(room),
      );
      return this.availableRooms;
    },

    async searchCustomers(query) {
      this.searchQuery = query;
      const trimmed = String(query || "").trim();
      if (trimmed.length < 2) {
        this.searchResults = [];
        return [];
      }

      this.isSearching = true;
      try {
        const { data } = await api.get("/customers/search", {
          params: { q: trimmed },
        });
        const base = (data.customers || [])
          .slice()
          .sort((a, b) => {
            const scoreDiff =
              scoreCustomerMatch(a, trimmed) - scoreCustomerMatch(b, trimmed);
            if (scoreDiff !== 0) return scoreDiff;

            const nameDiff = String(a.fullName || "").localeCompare(
              String(b.fullName || ""),
            );
            if (nameDiff !== 0) return nameDiff;

            return String(a.phoneNumber || "").localeCompare(
              String(b.phoneNumber || ""),
            );
          })
          .slice(0, 8);

        const enriched = await Promise.all(
          base.map(async (customer) => {
            try {
              const profile = await api.get(`/customers/${customer._id}`);
              return buildSummary(
                profile.data.customer,
                profile.data.history,
                customer.currentRoom,
              );
            } catch {
              return {
                ...customer,
                currentRoom: normalizeRoom(customer.currentRoom),
                visitCount: 0,
                lastStayDate: null,
                firstStayDate: null,
                totalSpent: Number(customer.totalSpent || 0),
              };
            }
          }),
        );

        this.searchResults = enriched;
        return enriched;
      } finally {
        this.isSearching = false;
      }
    },

    async fetchCustomerById(id) {
      const { data } = await api.get(`/customers/${id}`);
      await this.fetchCurrentStay(id);
      this.selectedCustomer = buildSummary(
        data.customer,
        data.history,
        this.currentStay?.room || null,
      );
      this.customerStays = (data.history?.stays || []).sort(
        (a, b) => new Date(b.checkInDate) - new Date(a.checkInDate),
      );
      return this.selectedCustomer;
    },

    async fetchCurrentStay(customerId) {
      const { data } = await api.get("/stays/active", {
        params: { customerId },
      });
      this.currentStay = data.stay || null;
      if (this.selectedCustomer?._id === customerId) {
        this.selectedCustomer = {
          ...this.selectedCustomer,
          currentRoom: normalizeRoom(this.currentStay?.room || null),
        };
      }
      return this.currentStay;
    },

    async fetchCustomerStays(id) {
      try {
        const { data } = await api.get(`/customers/${id}/stays`);
        this.customerStays = data.stays || [];
      } catch {
        const { data } = await api.get(`/customers/${id}`);
        this.customerStays = (data.history?.stays || []).sort(
          (a, b) => new Date(b.checkInDate) - new Date(a.checkInDate),
        );
      }
      return this.customerStays;
    },

    async assignRoom(customerId, stayData) {
      this.assigningRoom = true;
      try {
        const payload = {
          customerId,
          roomNumber: stayData.roomNumber,
          checkIn: stayData.checkIn,
          checkOut: stayData.checkOut,
          specialRequests: stayData.specialRequests,
        };

        const { data } = await api.post("/stays", payload);
        this.currentStay = data.stay || null;

        if (this.selectedCustomer?._id === customerId) {
          this.selectedCustomer = {
            ...this.selectedCustomer,
            currentRoom: normalizeRoom(this.currentStay?.room || null),
          };
          await this.fetchCustomerStays(customerId);
        }

        await this.fetchAvailableRooms();
        return data.stay;
      } finally {
        this.assigningRoom = false;
      }
    },

    async checkoutCustomer(stayId) {
      const { data } = await api.patch(`/stays/${stayId}/checkout`);
      this.currentStay = null;
      if (this.selectedCustomer) {
        this.selectedCustomer = {
          ...this.selectedCustomer,
          currentRoom: null,
        };
        await this.fetchCustomerStays(this.selectedCustomer._id);
      }
      await this.fetchAvailableRooms();
      return data.stay;
    },

    async recordPayment(stayId, amountPaid, paymentMethod = "Cash") {
      const { data } = await api.patch(`/stays/${stayId}/payment`, {
        amountPaid,
        paymentMethod,
      });
      this.currentStay = data.stay || this.currentStay;
      if (this.selectedCustomer?.currentRoom && this.currentStay?.room) {
        this.selectedCustomer = {
          ...this.selectedCustomer,
          currentRoom: normalizeRoom(this.currentStay.room),
        };
      }
      return data.stay;
    },

    async createCustomer(payload) {
      this.isSubmitting = true;
      try {
        const { data } = await api.post("/customers", payload);
        if (data.customer?._id) {
          await this.fetchCustomerById(data.customer._id);
        }
        return data.customer;
      } finally {
        this.isSubmitting = false;
      }
    },

    async updateCustomer(id, payload) {
      this.isSubmitting = true;
      try {
        let response;
        try {
          response = await api.put(`/customers/${id}`, payload);
        } catch {
          response = await api.patch(`/customers/${id}`, payload);
        }

        if (response.data.customer?._id) {
          await this.fetchCustomerById(response.data.customer._id);
        }
        return response.data.customer;
      } finally {
        this.isSubmitting = false;
      }
    },

    async checkPhoneExists(phone) {
      const normalized = normalizePhone(phone);
      const digits = normalized.replace(/^\+977/, "");
      if (digits.length < 10) {
        return { exists: false, customer: null, visitCount: 0, normalized };
      }

      try {
        const { data } = await api.get("/customers/check-phone", {
          params: { phone: digits },
        });

        if (!data.customer) {
          return { exists: false, customer: null, visitCount: 0, normalized };
        }

        return {
          exists: true,
          customer: data.customer,
          visitCount: Number(
            data.visitCount || data.history?.stays?.length || 0,
          ),
          normalized,
        };
      } catch {
        const { data } = await api.get(`/customers/phone/${digits}`);
        return {
          exists: Boolean(data.customer),
          customer: data.customer || null,
          visitCount: Number(data.history?.stays?.length || 0),
          normalized,
        };
      }
    },

    async deleteCustomer(id) {
      await api.delete(`/customers/${id}`);
      if (this.selectedCustomer?._id === id) {
        this.selectedCustomer = null;
        this.customerStays = [];
      }
      this.searchResults = this.searchResults.filter((item) => item._id !== id);
    },

    normalizePhone,
  },
});
