<template>
  <section class="page-grid">
    <div class="page-header">
      <div>
        <p class="eyebrow">Front Desk Flow</p>
        <h2>Stays</h2>
      </div>
      <button class="primary-btn" @click="openNewStayModal">
        + New Check-In
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

              <label class="full">
                Stay Notes
                <input
                  v-model="stayForm.stayNotes"
                  type="text"
                  placeholder="Special requests"
                />
              </label>

              <div class="full">
                <hr />

                <div
                  style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin: 15px 0;
                  "
                >
                  <h3>Additional Guests</h3>

                  <button type="button" class="primary-btn" @click="addGuest">
                    + Add Guest
                  </button>
                </div>

                <div v-if="stayForm.guestList.length === 0" class="empty-state">
                  No additional guests.
                </div>

                <div
                  v-for="(guest, index) in stayForm.guestList"
                  :key="index"
                  class="panel"
                  style="margin-bottom: 20px"
                >
                  <div
                    style="
                      display: flex;
                      justify-content: space-between;
                      align-items: center;
                      margin-bottom: 15px;
                    "
                  >
                    <strong> Guest {{ index + 2 }} </strong>

                    <button
                      type="button"
                      class="pill-btn status-danger"
                      @click="removeGuest(index)"
                    >
                      Remove
                    </button>
                  </div>

                  <div class="form-grid">
                    <label>
                      Full Name
                      <input v-model="guest.fullName" type="text" required />
                    </label>

                    <label>
                      Gender
                      <select v-model="guest.gender">
                        <option>Male</option>

                        <option>Female</option>

                        <option>Other</option>
                      </select>
                    </label>

                    <label>
                      Age
                      <input v-model.number="guest.age" type="number" />
                    </label>

                    <label>
                      Phone Number
                      <input v-model="guest.phoneNumber" type="text" />
                    </label>

                    <label>
                      Citizenship No.
                      <input v-model="guest.citizenshipIdNumber" type="text" />
                    </label>

                    <label>
                      Relation
                      <input
                        v-model="guest.relation"
                        type="text"
                        placeholder="Friend / Wife / Son"
                      />
                    </label>

                    <label class="full">
                      Address
                      <input v-model="guest.address" type="text" />
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="stack">
              <p class="subtle">
                Confirm the stay details before creating the check-in.
              </p>
              <div class="list-card">
                <p>
                  <strong>Primary Guest:</strong> {{ selectedCustomerName }}
                </p>

                <p>
                  <strong>Additional Guests:</strong>
                  {{ stayForm.guestList.length }}
                </p>

                <p>
                  <strong>Total Guests:</strong>
                  {{ stayForm.guestList.length + 1 }}
                </p>

                <p>
                  <strong>Room:</strong>
                  {{ selectedRoomLabel }}
                </p>

                <p>
                  <strong>Check In:</strong>
                  {{ formatDate(stayForm.checkInDate) }}
                </p>

                <p>
                  <strong>Check Out:</strong>
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

  // Total people in room
  guests: 1,

  stayNotes: "",

  // Additional Guests
  guestList: [],
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

  if (diff <= 0) return "Expired";

  const hours = Math.ceil(diff / (1000 * 60 * 60));

  return `${hours} hrs left`;
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
  stayForm.guestList = [];
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
    const payload = {
      ...stayForm,
      employeeId,
      guests: stayForm.guestList.length + 1,
    };
    await api.post("/stays", payload);

    resetForm();
    stayStep.value = 0;
    showModal.value = false;

    ui.pushToast("Stay created successfully");

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

const addGuest = () => {
  stayForm.guestList.push({
    fullName: "",
    gender: "Male",
    age: "",
    phoneNumber: "",
    email: "",
    citizenshipIdNumber: "",
    address: "",
    relation: "",
  });

  stayForm.guests = stayForm.guestList.length + 1;
};

const removeGuest = (index) => {
  stayForm.guestList.splice(index, 1);
  stayForm.guests = stayForm.guestList.length + 1;
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
