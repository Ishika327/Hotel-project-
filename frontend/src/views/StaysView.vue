<template>
  <section class="page-grid">
    <div class="page-header">
      <div>
        <p class="eyebrow">Front Desk Flow</p>
        <h2>Stays</h2>
      </div>
      <button class="pill-btn" type="button" @click="openNewStayModal">
        New Check-In
      </button>
    </div>

    <article class="panel">
      <div class="room-filterbar">
        <input
          v-model="filters.query"
          class="table-search"
          placeholder="Search guest, room, or stay note"
          type="search"
        />
        <select v-model="filters.status">
          <option value="all">All</option>
          <option value="CheckedIn">Checked In</option>
          <option value="CheckedOut">Checked Out</option>
          <option value="Reserved">Reserved</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      <div v-if="filteredStays.length" class="room-grid">
        <article
          v-for="stay in filteredStays"
          :key="stay._id"
          class="room-card stay-card"
        >
          <div class="room-card__top">
            <div>
              <p class="room-card__number">
                {{ stay.customer?.fullName || "Unknown" }}
              </p>
              <div class="room-card__meta">
                <span class="room-type-pill"
                  >Room {{ stay.room?.roomNumber || "-" }}</span
                >
                <span class="floor-pill">{{
                  stay.room?.roomType || "Standard"
                }}</span>
              </div>
            </div>
            <StatusBadge
              :label="stay.stayStatus"
              :variant="statusTone(stay.stayStatus)"
            />
          </div>

          <div class="stay-timer">
            <p class="subtle">Check-out</p>
            <strong>{{ countdownLabel(stay.checkOutDate) }}</strong>
          </div>

          <div class="stay-meta-grid">
            <span>Check-in {{ formatDate(stay.checkInDate) }}</span>
            <span>{{ stay.guests }} guest(s)</span>
            <span>{{
              formatCurrency(stay.totalAmount || stay.roomCharges)
            }}</span>
          </div>

          <div class="action-row">
            <button
              v-if="stay.stayStatus === 'CheckedIn'"
              class="pill-btn status-danger"
              type="button"
              @click="checkout(stay._id)"
            >
              Check Out
            </button>
            <button
              class="pill-btn pill-btn--ghost"
              type="button"
              @click="viewInvoice(stay)"
            >
              View Invoice
            </button>
          </div>
        </article>
      </div>

      <div v-else class="empty-state">No stays found.</div>
    </article>

    <BaseModal v-if="showModal" title="New Check-In" @close="showModal = false">
      <StepperForm v-model="stayStep" :steps="staySteps">
        <template #default="{ step }">
          <form class="stack" @submit.prevent="createStay">
            <div v-if="step === 0" class="form-grid">
              <label class="full">
                Customer
                <select v-model="stayForm.customerId" required>
                  <option value="">Select customer</option>
                  <option
                    v-for="customer in customers"
                    :key="customer._id"
                    :value="customer._id"
                  >
                    {{ customer.fullName }} - {{ customer.phoneNumber }}
                  </option>
                </select>
              </label>
            </div>

            <div v-else-if="step === 1" class="form-grid">
              <label class="full">
                Available Room
                <select v-model="stayForm.roomId" required>
                  <option value="">Select room</option>
                  <option
                    v-for="room in availableRooms"
                    :key="room._id"
                    :value="room._id"
                  >
                    Room {{ room.roomNumber }} - {{ room.roomType }}
                  </option>
                </select>
              </label>
            </div>

            <div v-else-if="step === 2" class="form-grid">
              <label>
                Check-in
                <input
                  v-model="stayForm.checkInDate"
                  type="datetime-local"
                  required
                />
              </label>
              <label>
                Check-out
                <input
                  v-model="stayForm.checkOutDate"
                  type="datetime-local"
                  required
                />
              </label>
              <label>
                Guests
                <input
                  v-model.number="stayForm.guests"
                  type="number"
                  min="1"
                  required
                />
              </label>
              <label>
                Notes
                <input
                  v-model="stayForm.stayNotes"
                  type="text"
                  placeholder="Special requests"
                />
              </label>
            </div>

            <div v-else class="stack">
              <p class="subtle">
                Confirm the stay details before creating the check-in.
              </p>
              <div class="list-card">
                <p><strong>Customer</strong> {{ selectedCustomerName }}</p>
                <p><strong>Room</strong> {{ selectedRoomLabel }}</p>
                <p>
                  <strong>Dates</strong>
                  {{ formatDate(stayForm.checkInDate) }} -
                  {{ formatDate(stayForm.checkOutDate) }}
                </p>
              </div>
            </div>

            <div class="action-row">
              <button
                v-if="step > 0"
                class="pill-btn pill-btn--ghost"
                type="button"
                @click="stayStep -= 1"
              >
                Back
              </button>
              <button
                v-if="step < staySteps.length - 1"
                class="primary-btn"
                type="button"
                @click="stayStep += 1"
              >
                Next
              </button>
              <button v-else class="primary-btn" type="submit">
                Create Stay
              </button>
            </div>
          </form>
        </template>
      </StepperForm>
    </BaseModal>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import api from "../services/api";
import BaseModal from "../components/BaseModal.vue";
import StepperForm from "../components/StepperForm.vue";
import StatusBadge from "../components/StatusBadge.vue";
import { useAuthStore } from "../stores/auth";
import { useUiStore } from "../stores/ui";
import { formatCurrency, formatDate } from "../utils/format";

const auth = useAuthStore();
const ui = useUiStore();
const router = useRouter();

const stays = ref([]);
const rooms = ref([]);
const customers = ref([]);
const showModal = ref(false);
const stayStep = ref(0);
const filters = reactive({ query: "", status: "all" });
const staySteps = [
  "Find or create customer",
  "Select room",
  "Dates and extras",
  "Confirm",
];

const stayForm = reactive({
  customerId: "",
  roomId: "",
  checkInDate: "",
  checkOutDate: "",
  guests: 1,
  stayNotes: "",
});

const availableRooms = computed(() =>
  rooms.value.filter((room) => room.status === "Available"),
);

const filteredStays = computed(() => {
  const query = filters.query.trim().toLowerCase();
  return stays.value.filter((stay) => {
    const statusMatches =
      filters.status === "all" || stay.stayStatus === filters.status;
    if (!statusMatches) return false;
    if (!query) return true;

    const haystack = [
      stay.customer?.fullName,
      stay.room?.roomNumber,
      stay.stayNotes,
      stay.stayStatus,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
});

const statusTone = (status) => {
  if (status === "CheckedIn") return "green";
  if (status === "CheckedOut") return "blue";
  if (status === "Reserved") return "amber";
  return "red";
};

const countdownLabel = (value) => {
  const target = new Date(value);
  if (Number.isNaN(target.getTime())) return "-";
  const diff = target.getTime() - Date.now();
  const hours = Math.max(0, Math.ceil(diff / (1000 * 60 * 60)));
  return hours > 0 ? `${hours}h left` : "Due now";
};

const canCheckoutStay = (stay) => {
  const totalAmount = Number(stay?.totalAmount || stay?.roomCharges || 0);
  const amountPaid = Number(stay?.amountPaid || stay?.paidAmount || 0);
  return totalAmount - amountPaid <= 0;
};

const toLocalDateTimeInput = (date) => {
  const tzOffset = new Date().getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
};

const resetForm = () => {
  const now = new Date();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  stayForm.customerId = "";
  stayForm.roomId = "";
  stayForm.checkInDate = toLocalDateTimeInput(now);
  stayForm.checkOutDate = toLocalDateTimeInput(tomorrow);
  stayForm.guests = 1;
  stayForm.stayNotes = "";
};

const loadData = async () => {
  try {
    const [stayRes, roomRes, customerRes] = await Promise.all([
      api.get("/stays"),
      api.get("/rooms"),
      api.get("/customers/search", { params: { q: "" } }),
    ]);

    stays.value = stayRes.data.stays || [];
    rooms.value = roomRes.data.rooms || [];
    customers.value = customerRes.data.customers || [];
  } catch (error) {
    ui.pushToast(
      error.response?.data?.message || "Unable to load stays",
      "error",
    );
  }
};

const createStay = async () => {
  const employeeId = auth.employee?.id || auth.employee?._id;
  if (!employeeId) {
    ui.pushToast("Employee session missing. Please log in again.", "error");
    return;
  }

  try {
    await api.post("/stays", {
      ...stayForm,
      employeeId,
    });
    ui.pushToast("Stay created");
    showModal.value = false;
    await loadData();
  } catch (error) {
    ui.pushToast(
      error.response?.data?.message || "Unable to create stay",
      "error",
    );
  }
};

const checkout = async (stayId) => {
  const stay = stays.value.find((entry) => entry._id === stayId);
  if (stay) {
    const totalAmount = Number(stay.totalAmount || stay.roomCharges || 0);
    const amountPaid = Number(stay.amountPaid || stay.paidAmount || 0);
    if (amountPaid > totalAmount) {
      ui.pushToast("plz collect your money", "error");
      return;
    }

    if (!canCheckoutStay(stay)) {
      ui.pushToast(
        "Payment due. Full payment is required before checkout.",
        "error",
      );
      return;
    }
  }

  try {
    await api.patch(`/stays/${stayId}/checkout`);
    ui.pushToast("Guest checked out");
    await loadData();
  } catch (error) {
    ui.pushToast(
      error.response?.data?.message || "Unable to check out stay",
      "error",
    );
  }
};

const openNewStayModal = () => {
  resetForm();
  stayStep.value = 0;
  showModal.value = true;
};

const selectedCustomerName = computed(
  () =>
    customers.value.find((customer) => customer._id === stayForm.customerId)
      ?.fullName || "Select a customer",
);

const selectedRoomLabel = computed(() => {
  const room = availableRooms.value.find(
    (entry) => entry._id === stayForm.roomId,
  );
  return room ? `Room ${room.roomNumber} - ${room.roomType}` : "Select a room";
});

const viewInvoice = (stay) => {
  router.push({ name: "invoices", query: { stayId: stay._id } });
};

onMounted(async () => {
  resetForm();
  await loadData();
});
</script>
