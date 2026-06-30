import { defineStore } from "pinia";
import axios from "axios";
import { useUiStore } from "./ui";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("hotel_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const useFoodBillingStore = defineStore("foodBilling", {
  state: () => ({
    activeGuests: [],
    selectedGuest: null,
    orderItems: [],
    lastInvoice: null,
    loadingGuests: false,
    submitting: false,
    savingPayment: false,
    paymentStatus: "unpaid",
    amountPaid: 0,
    billingTotal: 0,
  }),
  getters: {
    hasOrder: (state) => state.orderItems.length > 0,
    remainingBalance: (state) =>
      Math.max(
        0,
        Number(state.billingTotal || 0) - Number(state.amountPaid || 0),
      ),
  },
  actions: {
    setBillingTotal(total) {
      this.billingTotal = Number(total || 0);
      if (this.paymentStatus === "paid") {
        this.amountPaid = this.billingTotal;
      }
    },

    setPaymentStatus(status) {
      const nextStatus = String(status || "unpaid").toLowerCase();
      this.paymentStatus = nextStatus;
      if (nextStatus === "paid") {
        this.amountPaid = this.billingTotal;
      } else if (nextStatus === "unpaid") {
        this.amountPaid = 0;
      }
    },

    setAmountPaid(amount) {
      const normalized = Math.max(Number(amount || 0), 0);
      this.amountPaid = normalized;
      if (normalized <= 0) {
        this.paymentStatus = "unpaid";
      } else if (normalized >= Number(this.billingTotal || 0)) {
        this.paymentStatus = "paid";
      } else {
        this.paymentStatus = "partial";
      }
    },

    resetPayment() {
      this.paymentStatus = "unpaid";
      this.amountPaid = 0;
      this.billingTotal = 0;
    },

    applyStayPayment(stay, fallbackGuest = null) {
      const stayPaymentStatus = String(
        stay?.paymentStatus ||
          stay?.paidStatus ||
          fallbackGuest?.paymentStatus ||
          fallbackGuest?.paidStatus ||
          "unpaid",
      ).toLowerCase();
      const stayAmountPaid = Number(
        stay?.amountPaid ||
          stay?.paidAmount ||
          fallbackGuest?.amountPaid ||
          fallbackGuest?.paidAmount ||
          0,
      );
      const stayRemainingBalance = Number(
        stay?.remainingBalance || fallbackGuest?.remainingBalance || 0,
      );

      this.selectedGuest = {
        ...(fallbackGuest || {}),
        ...(stay || {}),
        stayId: stay?._id || fallbackGuest?.stayId || stay?.stayId || null,
        paymentStatus: stayPaymentStatus,
        paidStatus:
          stay?.paidStatus ||
          fallbackGuest?.paidStatus ||
          (stayPaymentStatus === "paid"
            ? "Paid"
            : stayPaymentStatus === "partial"
              ? "Partial"
              : "Unpaid"),
        amountPaid: stayAmountPaid,
        remainingBalance: stayRemainingBalance,
      };
      this.paymentStatus = stayPaymentStatus;
      this.amountPaid = stayAmountPaid;
      return this.selectedGuest;
    },

    async refreshSelectedGuest() {
      if (!this.selectedGuest?.stayId) return null;
      await this.loadSelectedGuestByStayId(this.selectedGuest.stayId);
      await this.loadExistingExpenses(this.selectedGuest.stayId);
      return this.selectedGuest;
    },

    getMenuLine(item) {
      return (
        this.orderItems.find(
          (line) =>
            line.sourceId === item.id ||
            (line.menuItem === item.name &&
              Number(line.unitPrice) === Number(item.price)),
        ) || null
      );
    },

    async loadSelectedGuestByStayId(stayId) {
      if (!stayId) return null;
      const { data } = await api.get(`/stays/${stayId}`);
      const stay = data.stay || null;
      if (!stay) return null;
      const fallbackGuest =
        this.activeGuests.find((guest) => guest.stayId === stayId) || null;
      return this.applyStayPayment(stay, fallbackGuest);
    },

    async fetchActiveGuests() {
      const ui = useUiStore();
      this.loadingGuests = true;
      try {
        const { data } = await api.get("/stays/active");
        this.activeGuests = Array.isArray(data) ? data : data.guests || [];

        if (this.selectedGuest?.stayId) {
          const refreshedGuest = this.activeGuests.find(
            (guest) => guest.stayId === this.selectedGuest.stayId,
          );
          if (refreshedGuest) {
            await this.loadSelectedGuestByStayId(refreshedGuest.stayId);
          } else {
            this.selectedGuest = null;
            this.resetPayment();
          }
        }
      } catch (error) {
        ui.pushToast(
          error.response?.data?.message || "Failed to load active guests",
          "error",
        );
      } finally {
        this.loadingGuests = false;
      }
    },

    selectGuest(guest) {
      this.selectedGuest = guest || null;
      this.lastInvoice = null;
      this.billingTotal = 0;
      this.clearOrder();
      // Load existing expenses for the stay so past food charges are visible
      if (this.selectedGuest && this.selectedGuest.stayId) {
        this.loadSelectedGuestByStayId(this.selectedGuest.stayId).catch(
          () => {},
        );
        this.loadExistingExpenses(this.selectedGuest.stayId).catch(() => {});
      }
    },

    async savePayment() {
      const ui = useUiStore();
      if (!this.selectedGuest?.stayId) return false;

      this.savingPayment = true;
      try {
        const normalizedAmount = Math.max(Number(this.amountPaid || 0), 0);
        const paymentStatus =
          normalizedAmount <= 0
            ? "unpaid"
            : normalizedAmount >= Number(this.billingTotal || 0)
              ? "paid"
              : "partial";

        const { data } = await api.patch(
          `/stays/${this.selectedGuest.stayId}/payment`,
          {
            amountPaid: normalizedAmount,
            paymentStatus,
            totalAmount: this.billingTotal,
            paymentMethod: "Cash",
          },
        );

        const updatedStay = data.stay || null;
        if (updatedStay) {
          this.selectedGuest = {
            ...this.selectedGuest,
            paymentStatus: updatedStay.paymentStatus || paymentStatus,
            paidStatus:
              updatedStay.paidStatus ||
              (paymentStatus === "paid"
                ? "Paid"
                : paymentStatus === "partial"
                  ? "Partial"
                  : "Unpaid"),
            amountPaid: Number(
              updatedStay.amountPaid || updatedStay.paidAmount || 0,
            ),
            remainingBalance: Number(updatedStay.remainingBalance || 0),
          };

          this.activeGuests = this.activeGuests.map((guest) =>
            guest.stayId === this.selectedGuest.stayId
              ? {
                  ...guest,
                  paymentStatus: updatedStay.paymentStatus || paymentStatus,
                  paidStatus:
                    updatedStay.paidStatus ||
                    (paymentStatus === "paid"
                      ? "Paid"
                      : paymentStatus === "partial"
                        ? "Partial"
                        : "Unpaid"),
                  amountPaid: Number(
                    updatedStay.amountPaid || updatedStay.paidAmount || 0,
                  ),
                  remainingBalance: Number(updatedStay.remainingBalance || 0),
                }
              : guest,
          );
        }

        ui.pushToast("Payment saved successfully");
        return true;
      } catch (error) {
        ui.pushToast(
          error.response?.data?.message || "Failed to save payment",
          "error",
        );
        return false;
      } finally {
        this.savingPayment = false;
      }
    },

    async addItem(item) {
      const existing = this.getMenuLine(item);
      if (existing) {
        return this.changeQty(existing.id, 1);
      }

      const ui = useUiStore();
      try {
        await api.post("/expenses", {
          stayId: this.selectedGuest.stayId,
          customerId: this.selectedGuest.customerId,
          roomId: this.selectedGuest.roomId,
          expenseType: this.mapExpenseType(item.category),
          description: item.name,
          quantity: 1,
          price: item.price,
        });
        await this.refreshSelectedGuest();
        ui.pushToast(`${item.name} added to bill`);
      } catch (error) {
        ui.pushToast(
          error.response?.data?.message || "Failed to add item",
          "error",
        );
      }
    },

    async removeItem(itemId) {
      const existing = this.orderItems.find((line) => line.id === itemId);
      if (!existing) return;

      if (existing.existing && existing.expenseId) {
        const ui = useUiStore();
        try {
          await api.delete(`/expenses/${existing.expenseId}`);
          this.orderItems = this.orderItems.filter(
            (line) => line.id !== itemId,
          );
          await this.refreshSelectedGuest();
          ui.pushToast("Item removed from saved bill");
        } catch (error) {
          ui.pushToast(
            error.response?.data?.message || "Failed to remove item",
            "error",
          );
        }
        return;
      }

      this.orderItems = this.orderItems.filter((line) => line.id !== itemId);
    },

    async changeQty(itemId, delta) {
      const existing = this.orderItems.find((line) => line.id === itemId);
      if (!existing) return;

      const nextQty = existing.qty + delta;
      if (nextQty <= 0) {
        await this.removeItem(itemId);
        return;
      }

      if (existing.existing && existing.expenseId) {
        const ui = useUiStore();
        try {
          await api.patch(`/expenses/${existing.expenseId}`, {
            quantity: nextQty,
          });
          await this.refreshSelectedGuest();
        } catch (error) {
          ui.pushToast(
            error.response?.data?.message || "Failed to update item",
            "error",
          );
        }
        return;
      }

      existing.qty = nextQty;
    },

    clearOrder() {
      this.orderItems = [];
    },

    mapExpenseType(category) {
      if (category === "Drinks") return "Drinks";
      if (category === "Extras") return "Other";
      return "Food";
    },

    async submitOrder() {
      const ui = useUiStore();
      if (!this.selectedGuest) return false;

      this.submitting = true;
      try {
        // Only post new items (not already existing expenses)
        const newLines = this.orderItems.filter((line) => !line.existing);
        if (newLines.length > 0) {
          await Promise.all(
            newLines.map((line) =>
              api.post("/expenses", {
                stayId: this.selectedGuest.stayId,
                customerId: this.selectedGuest.customerId,
                roomId: this.selectedGuest.roomId,
                expenseType: this.mapExpenseType(line.category),
                description: line.menuItem,
                quantity: line.qty,
                price: line.unitPrice,
              }),
            ),
          );
        }

        const invoiceResponse = await api.post("/billing/generate", {
          stayId: this.selectedGuest.stayId,
          paymentStatus: this.paymentStatus,
          amountPaid: this.amountPaid,
          remainingBalance: this.remainingBalance,
          totalAmount: this.billingTotal,
          paidStatus:
            this.paymentStatus === "paid"
              ? "Paid"
              : this.paymentStatus === "partial"
                ? "Partial"
                : "Unpaid",
          paymentMethod: "Cash",
        });

        this.lastInvoice = invoiceResponse.data.invoice || null;

        ui.pushToast(
          `Bill charged successfully. Total: Rs. ${Number(
            this.lastInvoice?.totalAmount || 0,
          ).toLocaleString("en-IN")}`,
        );
        // Refresh order list from server to include newly created expenses
        if (this.selectedGuest && this.selectedGuest.stayId) {
          await this.loadExistingExpenses(this.selectedGuest.stayId);
        } else {
          this.clearOrder();
        }
        return true;
      } catch (error) {
        ui.pushToast(
          error.response?.data?.message || "Failed to charge order to room",
          "error",
        );
        return false;
      } finally {
        this.submitting = false;
      }
    },

    async loadExistingExpenses(stayId) {
      const ui = useUiStore();
      try {
        const { data } = await api.get("/expenses", { params: { stayId } });
        const expenses = data.expenses || [];
        // Map expenses into orderItems format and mark as existing
        this.orderItems = expenses.map((ex) => ({
          id: `existing-${ex._id}`,
          expenseId: ex._id,
          sourceId: ex.description || ex.expenseType || ex._id,
          menuItem: ex.description || ex.expenseType || "Charge",
          category:
            ex.expenseType === "Drinks"
              ? "Drinks"
              : ex.expenseType === "Other"
                ? "Extras"
                : "Food",
          unitPrice: Number(ex.price || ex.total || 0),
          qty: Number(ex.quantity || 1),
          existing: true,
        }));
      } catch (error) {
        ui.pushToast(
          error.response?.data?.message || "Unable to load existing charges",
          "error",
        );
      }
    },
  },
});
