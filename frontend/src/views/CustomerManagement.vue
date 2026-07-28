<template>
  <section class="customer-management">
    <div class="layout">
      <article class="card form-card">
        <div class="card-head">
          <h2>
            {{ isEditMode ? "Update Customer" : "New Customer Registration" }}
          </h2>
          <button class="btn btn-outline" type="button" @click="clearForm">
            Clear Form
          </button>
        </div>

        <form class="form-grid" @submit.prevent="submitForm">
          <label class="field-row">
            <span>Full Name</span>
            <input
              v-model="form.fullName"
              :class="{ 'input-error': errors.fullName }"
              type="text"
              placeholder="Guest full name"
            />
            <small v-if="errors.fullName" class="error-text">{{
              errors.fullName
            }}</small>
          </label>

          <label class="field-row">
            <span>Phone Number</span>
            <input
              v-model="form.phoneNumber"
              :class="{ 'input-error': errors.phoneNumber }"
              type="text"
              placeholder="98XXXXXXXX"
            />
            <small v-if="errors.phoneNumber" class="error-text">{{
              errors.phoneNumber
            }}</small>
            <small v-else class="helper-text"
              >Stored as {{ normalizedPhonePreview || "+977" }}</small
            >
          </label>

          <div v-if="phoneMatch.exists" class="duplicate-card full-width">
            <div>
              <strong>Existing customer found</strong>
              <p>
                {{ phoneMatch.customer?.fullName }} ·
                {{ phoneMatch.visitCount }} visits
              </p>
            </div>
            <button
              class="btn btn-outline"
              type="button"
              @click="viewMatchedProfile"
            >
              View Profile
            </button>
          </div>

          <label class="field-row">
            <span>Location</span>
            <input
              v-model="form.location"
              :class="{ 'input-error': errors.location }"
              type="text"
              placeholder="City or area"
            />
            <small v-if="errors.location" class="error-text">{{
              errors.location
            }}</small>
          </label>

          <label class="field-row">
            <span>Nationality</span>
            <input v-model="form.nationality" type="text" />
          </label>

          <label class="field-row">
            <span>Citizenship No.</span>
            <input
              v-model="form.citizenshipIdNumber"
              :class="{ 'input-error': errors.citizenshipIdNumber }"
              type="text"
              placeholder="XX-XX-XX-XXXXX"
            />
            <small v-if="errors.citizenshipIdNumber" class="error-text">{{
              errors.citizenshipIdNumber
            }}</small>
          </label>

          <label class="full-width">
            <span>Notes / Special Requests</span>
            <textarea
              v-model="form.notes"
              rows="3"
              placeholder="allergic to nuts, prefers high floor"
            ></textarea>
          </label>

          <section class="room-assignment-section full-width">
            <label class="toggle-row">
              <input
                v-model="registrationRoomAssignmentEnabled"
                type="checkbox"
              />
              <span>Assign room now</span>
            </label>

            <div
              class="room-assignment-panel"
              :class="{
                'room-assignment-panel--open':
                  registrationRoomAssignmentEnabled,
              }"
            >
              <div class="room-assignment-grid">
                <label>
                  <span>Room Number</span>
                  <select v-model="registrationAssignment.roomNumber">
                    <option value="">Select room</option>
                    <option
                      v-for="room in availableRooms"
                      :key="room._id || room.roomNumber"
                      :value="room.roomNumber"
                    >
                      Room {{ room.roomNumber }} — {{ room.roomType }} ·
                      {{ formatNpr(room.ratePerNight) }}/night
                    </option>
                  </select>
                </label>

                <label>
                  <span>Check-in Date</span>
                  <input
                    v-model="registrationAssignment.checkInDate"
                    type="date"
                  />
                </label>

                <label>
                  <span>Check-out Date</span>
                  <input
                    v-model="registrationAssignment.checkOutDate"
                    type="date"
                  />
                </label>

                <label>
                  <span>Number of Nights</span>
                  <input :value="registrationNights" type="text" readonly />
                </label>

                <label>
                  <span>Estimated Total</span>
                  <input
                    :value="formatNpr(registrationEstimatedTotal)"
                    type="text"
                    readonly
                    class="estimated-total-input"
                  />
                </label>

                <label class="full-width">
                  <span>Special Room Requests</span>
                  <input
                    v-model="registrationAssignment.specialRequests"
                    type="text"
                    placeholder="extra pillows, non-smoking, high floor"
                  />
                </label>

                <div class="full-width guest-list-block">
                  <div class="guest-list-head">
                    <span>Additional Guests</span>
                    <button
                      class="btn btn-outline"
                      type="button"
                      @click="addRegistrationGuest"
                    >
                      + Add Guest
                    </button>
                  </div>
                  <div
                    v-for="(guest, index) in registrationAssignment.guestList"
                    :key="index"
                    class="guest-detail-card"
                  >
                    <div class="guest-detail-head">
                      <strong>Guest {{ index + 2 }}</strong>
                      <button
                        class="btn btn-outline"
                        type="button"
                        @click="
                          registrationAssignment.guestList.splice(index, 1)
                        "
                      >
                        Remove
                      </button>
                    </div>
                    <div class="guest-detail-grid">
                      <label>
                        <span>Full Name</span>
                        <input v-model="guest.fullName" type="text" required />
                      </label>
                      <label>
                        <span>Phone Number</span>
                        <input v-model="guest.phoneNumber" type="text" />
                      </label>
                      <label>
                        <span>Citizenship No.</span>
                        <input
                          v-model="guest.citizenshipIdNumber"
                          type="text"
                          placeholder="XX-XX-XX-XXXXX"
                        />
                      </label>
                      <label>
                        <span>Relation</span>
                        <input
                          v-model="guest.relation"
                          type="text"
                          placeholder="Friend / Wife / Son"
                        />
                      </label>
                      <label class="full-width">
                        <span>Address</span>
                        <input v-model="guest.address" type="text" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div class="form-actions full-width">
            <button
              class="btn btn-primary"
              :disabled="customerStore.isSubmitting"
              type="submit"
            >
              {{
                customerStore.isSubmitting
                  ? "Saving..."
                  : isEditMode
                    ? "Update Customer"
                    : "Register Customer"
              }}
            </button>
          </div>
        </form>
      </article>

      <article class="card search-card">
        <div class="card-head">
          <h2>Customer Search</h2>
        </div>

        <label>
          <span>Search by name or phone</span>
          <input
            v-model="searchInput"
            type="text"
            placeholder="Type name or phone"
          />
        </label>

        <div class="results-wrap">
          <div v-if="customerStore.isSearching" class="empty-state">
            Searching...
          </div>
          <div
            v-else-if="searchInput.trim().length < 2 && !selectedCustomer"
            class="empty-state placeholder"
          >
            <div class="placeholder-icon">⌕</div>
            <p>Search by name or phone to find a guest</p>
          </div>
          <div v-else-if="searchResults.length === 0" class="empty-state">
            No matching guests found.
          </div>

          <button
            v-for="guest in searchResults"
            :key="guest._id"
            class="result-item"
            type="button"
            @click="selectCustomer(guest._id)"
          >
            <span class="avatar">{{ initials(guest.fullName) }}</span>
            <span class="result-main">
              <span class="result-title-row">
                <strong>{{ guest.fullName }}</strong>
                <span
                  :class="roomBadgeClass(guest.currentRoom)"
                  class="room-pill"
                >
                  {{
                    guest.currentRoom?.roomNumber
                      ? `Room ${guest.currentRoom.roomNumber}`
                      : "Not staying"
                  }}
                </span>
              </span>
              <small>{{ guest.phoneNumber }}</small>
            </span>
            <span class="result-side">
              <span
                v-if="Number(guest.visitCount || 0) >= 3"
                class="loyal-badge"
                title="Loyal guest"
                >★ {{ guest.visitCount }}</span
              >
              <span v-else class="visit-badge"
                >{{ guest.visitCount || 0 }} visits</span
              >
              <small>{{ formatShortDate(guest.lastStayDate) }}</small>
            </span>
          </button>
        </div>

        <div v-if="selectedCustomer && showProfileCard" class="profile-card">
          <button
            class="icon-close-btn icon-close-btn--sm profile-card-close-btn"
            type="button"
            aria-label="Hide customer card"
            title="Hide customer card"
            @click="dismissProfileCard"
          >
            ×
          </button>
          <header class="profile-head">
            <span class="avatar avatar-lg">{{
              initials(selectedCustomer.fullName)
            }}</span>
            <div class="profile-head-content">
              <div class="profile-name-row">
                <h3>{{ selectedCustomer.fullName }}</h3>
              </div>
              <p>{{ selectedCustomer.phoneNumber }}</p>
              <p>{{ selectedCustomer.address || "No location" }}</p>
              <p>{{ selectedCustomer.nationality || "Nepali" }}</p>
            </div>
            <span v-if="visitCount >= 3" class="loyal-badge"
              >★ Loyal Guest</span
            >
          </header>

          <section
            v-if="showCurrentStayCard"
            class="current-stay-block"
            :class="{
              'current-stay-block--active': isCurrentlyCheckedIn,
              'current-stay-block--idle': !isCurrentlyCheckedIn,
            }"
          >
            <button
              class="icon-close-btn icon-close-btn--sm current-stay-close-btn"
              type="button"
              aria-label="Hide current stay details"
              title="Hide current stay details"
              @click="dismissCurrentStayCard"
            >
              ×
            </button>
            <div class="current-stay-head">
              <span :class="currentStayBadgeClass" class="stay-badge">
                {{ currentStayBadgeLabel }}
              </span>
              <div class="current-stay-head-actions">
                <button
                  v-if="!isCurrentlyCheckedIn"
                  class="btn btn-gold"
                  type="button"
                  @click="toggleProfileAssignRoom"
                >
                  Assign Room
                </button>
              </div>
            </div>

            <template v-if="isCurrentlyCheckedIn">
              <div class="current-stay-room">
                Room {{ currentStayRoomNumber }}
              </div>
              <div class="current-stay-type">
                {{ currentStayRoomType }} · Floor {{ currentStayFloorNumber }}
              </div>

              <div class="stay-chip-row">
                <span class="stay-chip"
                  >Check-in {{ formatShortDate(currentStayCheckIn) }}</span
                >
                <span class="stay-chip"
                  >Check-out {{ formatShortDate(currentStayCheckOut) }}</span
                >
                <span class="stay-chip"
                  >{{ currentStayNightsRemaining }} nights remaining</span
                >
              </div>

              <div class="current-stay-rate">
                {{ formatNpr(currentStayRatePerNight) }} / night
              </div>

              <div class="payment-status-row">
                <span :class="currentStayPaymentBadgeClass">
                  {{ currentStayPaymentLabel }}
                </span>
                <span class="payment-status-meta">
                  Paid {{ formatNpr(currentStayAmountPaid) }} · Balance
                  {{ formatNpr(currentStayRemainingBalance) }}
                </span>
              </div>

              <p
                v-if="!currentStayCanCheckout"
                class="payment-status-note payment-status-note--warning"
              >
                Full payment is required before checkout.
              </p>

              <div
                v-if="currentStayPaymentStatus !== 'paid'"
                class="payment-action-box"
              >
                <button
                  class="btn btn-gold btn-gold--outline"
                  type="button"
                  @click="
                    paymentPanelOpen ? cancelPaymentPanel() : openPaymentPanel()
                  "
                >
                  {{ paymentPanelOpen ? "Hide Payment" : "Record Payment" }}
                </button>

                <div v-if="paymentPanelOpen" class="payment-entry-panel">
                  <label>
                    <span>Amount paid</span>
                    <input
                      v-model.number="paymentDraftAmount"
                      type="number"
                      min="0"
                      :max="currentStayPaymentMax"
                    />
                  </label>
                  <input
                    :value="paymentDraftAmount"
                    type="range"
                    min="0"
                    :max="currentStayPaymentMax"
                    @input="paymentDraftAmount = Number($event.target.value)"
                  />
                  <div class="payment-quick-actions">
                    <button
                      class="btn btn-outline"
                      type="button"
                      @click="
                        paymentDraftAmount = Math.round(
                          currentStayPaymentMax * 0.5,
                        )
                      "
                    >
                      50%
                    </button>
                    <button
                      class="btn btn-outline"
                      type="button"
                      @click="paymentDraftAmount = currentStayPaymentMax"
                    >
                      Full Balance
                    </button>
                  </div>
                  <div class="payment-entry-actions">
                    <button
                      class="btn btn-gold"
                      type="button"
                      @click="recordCurrentStayPayment"
                    >
                      Save Payment
                    </button>
                    <button
                      class="btn btn-outline"
                      type="button"
                      @click="cancelPaymentPanel"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

              <div class="profile-actions profile-actions--compact">
                <button
                  class="btn btn-outline"
                  type="button"
                  @click="viewCurrentRoom"
                >
                  View Room
                </button>
                <button
                  class="btn btn-danger-outline"
                  type="button"
                  :disabled="!currentStayCanCheckout"
                  :title="
                    currentStayCanCheckout
                      ? 'Check out customer'
                      : 'Full payment is required before checkout'
                  "
                  @click="checkoutCurrentStay"
                >
                  Check Out
                </button>
              </div>
            </template>

            <template v-else>
              <div class="current-stay-room current-stay-room--idle">
                {{ latestStayRoomLabel }}
              </div>
              <div class="current-stay-type current-stay-type--idle">
                {{ latestStaySummary }}
              </div>

              <div
                class="room-assignment-panel room-assignment-panel--inline"
                :class="{
                  'room-assignment-panel--open': profileRoomAssignmentExpanded,
                }"
              >
                <div class="room-assignment-grid room-assignment-grid--inline">
                  <label>
                    <span>Room Number</span>
                    <select v-model="profileAssignment.roomNumber">
                      <option value="">Select room</option>
                      <option
                        v-for="room in availableRooms"
                        :key="room._id || room.roomNumber"
                        :value="room.roomNumber"
                      >
                        Room {{ room.roomNumber }} — {{ room.roomType }} ·
                        {{ formatNpr(room.ratePerNight) }}/night
                      </option>
                    </select>
                  </label>

                  <label>
                    <span>Check-in Date</span>
                    <input
                      v-model="profileAssignment.checkInDate"
                      type="date"
                    />
                  </label>

                  <label>
                    <span>Check-out Date</span>
                    <input
                      v-model="profileAssignment.checkOutDate"
                      type="date"
                    />
                  </label>

                  <div class="full-width guest-list-block">
                    <div class="guest-list-head">
                      <span>Additional Guests</span>
                      <button
                        class="btn btn-outline"
                        type="button"
                        @click="addProfileGuest"
                      >
                        + Add Guest
                      </button>
                    </div>
                    <div
                      v-for="(guest, index) in profileAssignment.guestList"
                      :key="index"
                      class="guest-detail-card"
                    >
                      <div class="guest-detail-head">
                        <strong>Guest {{ index + 2 }}</strong>
                        <button
                          class="btn btn-outline"
                          type="button"
                          @click="profileAssignment.guestList.splice(index, 1)"
                        >
                          Remove
                        </button>
                      </div>
                      <div class="guest-detail-grid">
                        <label>
                          <span>Full Name</span>
                          <input
                            v-model="guest.fullName"
                            type="text"
                            required
                          />
                        </label>
                        <label>
                          <span>Phone Number</span>
                          <input v-model="guest.phoneNumber" type="text" />
                        </label>
                        <label>
                          <span>Citizenship No.</span>
                          <input
                            v-model="guest.citizenshipIdNumber"
                            type="text"
                            placeholder="XX-XX-XX-XXXXX"
                          />
                        </label>
                        <label>
                          <span>Relation</span>
                          <input
                            v-model="guest.relation"
                            type="text"
                            placeholder="Friend / Wife / Son"
                          />
                        </label>
                        <label class="full-width">
                          <span>Address</span>
                          <input v-model="guest.address" type="text" />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div class="inline-assign-actions full-width">
                    <button
                      class="btn btn-gold"
                      type="button"
                      @click="submitProfileAssignment"
                    >
                      Assign Room
                    </button>
                    <button
                      class="btn btn-outline"
                      type="button"
                      @click="profileRoomAssignmentExpanded = false"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </section>

          <div v-else class="current-stay-collapsed">
            <button
              class="link-btn"
              type="button"
              @click="restoreCurrentStayCard"
            >
              Show current stay details
            </button>
          </div>

          <div class="stats-row">
            <div>
              <span>Total Visits</span><strong>{{ visitCount }}</strong>
            </div>
            <div>
              <span>Total Spent</span
              ><strong>{{ formatNpr(totalSpent) }}</strong>
            </div>
            <div>
              <span>First Stay</span
              ><strong>{{ formatShortDate(firstStayDate) }}</strong>
            </div>
            <div>
              <span>Last Stay</span
              ><strong>{{ formatShortDate(lastStayDate) }}</strong>
            </div>
          </div>

          <div class="table-head-inline">
            <h4>Stay History</h4>
            <button
              class="link-btn"
              type="button"
              @click="showAllStays = !showAllStays"
            >
              {{ showAllStays ? "Show last 5" : "View all" }}
            </button>
          </div>

          <div v-if="visibleStays.length === 0" class="empty-state">
            No stays recorded yet.
          </div>
          <div v-else class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Room</th>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Nights</th>
                  <th>Amount (Rs.)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="stay in visibleStays" :key="stay._id">
                  <td>{{ stay.room?.roomNumber || "-" }}</td>
                  <td>{{ formatShortDate(stay.checkInDate) }}</td>
                  <td>{{ formatShortDate(stay.checkOutDate) }}</td>
                  <td>{{ stayNights(stay) }}</td>
                  <td>
                    {{ formatNpr(stay.totalAmount || stay.roomCharges || 0) }}
                  </td>
                  <td>{{ stay.stayStatus }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="profile-actions">
            <button class="btn btn-outline" type="button" @click="editSelected">
              Edit Details
            </button>
            <button class="btn btn-outline" type="button" @click="printProfile">
              Print Profile
            </button>
            <button
              v-if="isAdmin"
              class="btn btn-danger"
              type="button"
              @click="deleteSelected"
            >
              Delete
            </button>
          </div>
        </div>

        <div v-else-if="selectedCustomer" class="profile-collapsed">
          <button class="link-btn" type="button" @click="restoreProfileCard">
            Show customer details
          </button>
        </div>
      </article>
    </div>

    <div
      v-if="toast.show"
      class="local-toast"
      :class="`local-toast--${toast.type}`"
    >
      {{ toast.message }}
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import api from "../services/api";
import { useRouter } from "vue-router";
import NepaliDate from "nepali-date-converter";
import { useAuthStore } from "../stores/auth";
import { useCustomerStore } from "../stores/customer";

const customerStore = useCustomerStore();
const auth = useAuthStore();
const router = useRouter();

const searchInput = ref("");
const searchDebounce = ref(null);
const phoneDebounce = ref(null);
const showAllStays = ref(false);
const editCustomerId = ref("");
const registrationRoomAssignmentEnabled = ref(false);
const profileRoomAssignmentExpanded = ref(false);
const showCurrentStayCard = ref(true);
const showProfileCard = ref(true);
const phoneMatch = ref({
  exists: false,
  customer: null,
  visitCount: 0,
  normalized: "",
});
const showStayModal = ref(false);
const rooms = ref([]);

const toast = reactive({ show: false, message: "", type: "success" });
let toastTimer = null;

const form = reactive({
  fullName: "",
  phoneNumber: "",
  location: "",
  nationality: "Nepali",
  notes: "",
  citizenshipIdNumber: "",
});

const errors = reactive({
  fullName: "",
  phoneNumber: "",
  location: "",
  citizenshipIdNumber: "",
});

const registrationAssignment = reactive({
  roomNumber: "",
  checkInDate: "",
  checkOutDate: "",
  specialRequests: "",
  guestList: [],
});

const profileAssignment = reactive({
  roomNumber: "",
  checkInDate: "",
  checkOutDate: "",
  specialRequests: "",
  guestList: [],
});

const stayForm = reactive({
  roomId: "",
  checkInDate: "",
  checkOutDate: "",
  guests: 1,
  stayNotes: "",
});

const isEditMode = computed(() => Boolean(editCustomerId.value));
const selectedCustomer = computed(() => customerStore.selectedCustomer);
const searchResults = computed(() => customerStore.searchResults);
const currentStay = computed(() => customerStore.currentStay);
const customerStays = computed(() => customerStore.customerStays || []);
const availableRooms = computed(() => customerStore.availableRooms || []);
const visitCount = computed(() =>
  Number(selectedCustomer.value?.visitCount || customerStays.value.length || 0),
);
const totalSpent = computed(
  () =>
    Number(selectedCustomer.value?.totalSpent || 0) ||
    customerStays.value.reduce(
      (sum, stay) => sum + Number(stay.totalAmount || 0),
      0,
    ),
);
const firstStayDate = computed(() => {
  if (!customerStays.value.length) return null;
  return (
    customerStays.value[customerStays.value.length - 1]?.checkInDate || null
  );
});
const lastStayDate = computed(() => {
  if (!customerStays.value.length) return null;
  return (
    customerStays.value[0]?.checkOutDate ||
    customerStays.value[0]?.checkInDate ||
    null
  );
});
const visibleStays = computed(() =>
  showAllStays.value ? customerStays.value : customerStays.value.slice(0, 5),
);
const isAdmin = computed(() => auth.employee?.role === "admin");
const normalizedPhonePreview = computed(() =>
  customerStore.normalizePhone(form.phoneNumber),
);

const todayInput = () => new Date().toISOString().slice(0, 10);
const tomorrowInput = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

const parseDateOnly = (value) => {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
};

const calculateNights = (checkIn, checkOut) => {
  const start = parseDateOnly(checkIn);
  const end = parseDateOnly(checkOut);
  if (!start || !end || end <= start) return 0;
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
};

const roomByNumber = (roomNumber) =>
  availableRooms.value.find((room) => room.roomNumber === roomNumber) || null;

const currentStayRoom = computed(
  () => currentStay.value?.room || selectedCustomer.value?.currentRoom || null,
);
const isCurrentlyCheckedIn = computed(() => Boolean(currentStay.value));
const currentStayPaymentStatus = computed(() =>
  String(
    currentStay.value?.paymentStatus ||
      currentStay.value?.paidStatus ||
      "unpaid",
  ).toLowerCase(),
);
const currentStayAmountPaid = computed(() =>
  Number(currentStay.value?.amountPaid || currentStay.value?.paidAmount || 0),
);
const currentStayRemainingBalance = computed(() =>
  Number(currentStay.value?.remainingBalance || 0),
);
const currentStayPaymentMax = computed(() =>
  Math.max(
    currentStayRemainingBalance.value,
    Number(
      currentStay.value?.totalAmount || currentStayRatePerNight.value || 0,
    ),
  ),
);
const paymentPanelOpen = ref(false);
const paymentDraftAmount = ref(0);
const currentStayPaymentLabel = computed(() => {
  if (currentStayPaymentStatus.value === "paid") return "Paid in Full";
  if (currentStayPaymentStatus.value === "partial") return "Partial Payment";
  return "Unpaid";
});
const currentStayPaymentBadgeClass = computed(() => {
  if (currentStayPaymentStatus.value === "paid")
    return "payment-badge payment-badge--green";
  if (currentStayPaymentStatus.value === "partial")
    return "payment-badge payment-badge--amber";
  return "payment-badge payment-badge--red";
});
const currentStayRoomNumber = computed(
  () => currentStayRoom.value?.roomNumber || "-",
);
const currentStayRoomType = computed(
  () => currentStayRoom.value?.roomType || "Unknown room type",
);
const currentStayFloorNumber = computed(
  () =>
    currentStayRoom.value?.floorNumber || currentStayRoom.value?.floor || "-",
);
const currentStayRatePerNight = computed(() =>
  Number(currentStayRoom.value?.ratePerNight || 0),
);
const currentStayCheckIn = computed(
  () => currentStay.value?.checkInDate || null,
);
const currentStayCheckOut = computed(
  () => currentStay.value?.checkOutDate || null,
);
const currentStayNightsRemaining = computed(() => {
  if (!currentStayCheckOut.value) return 0;
  const checkOut = new Date(currentStayCheckOut.value);
  const now = new Date();
  const nights = Math.ceil((checkOut - now) / (1000 * 60 * 60 * 24));
  return Math.max(0, nights);
});
const currentStayPaymentDue = computed(() =>
  Math.max(
    0,
    Number(currentStay.value?.totalAmount || 0) - currentStayAmountPaid.value,
  ),
);
const currentStayCanCheckout = computed(() => currentStayPaymentDue.value <= 0);
const currentStayReturn = computed(() =>
  Math.max(
    0,
    currentStayAmountPaid.value - Number(currentStay.value?.totalAmount || 0),
  ),
);
const currentStayBadgeLabel = computed(() =>
  isCurrentlyCheckedIn.value
    ? "● Currently Checked In"
    : "○ Not Currently Staying",
);
const currentStayBadgeClass = computed(() =>
  isCurrentlyCheckedIn.value
    ? "stay-badge stay-badge--active"
    : "stay-badge stay-badge--idle",
);
const latestStay = computed(() => customerStays.value[0] || null);
const latestStayRoomLabel = computed(() => {
  if (!latestStay.value?.room?.roomNumber) return "No stay history yet.";
  return `Last stayed in Room ${latestStay.value.room.roomNumber}`;
});
const latestStaySummary = computed(() => {
  if (!latestStay.value) return "No room assigned right now.";
  return `on ${formatShortDate(latestStay.value.checkOutDate || latestStay.value.checkInDate)}`;
});
const registrationSelectedRoom = computed(() =>
  roomByNumber(registrationAssignment.roomNumber),
);
const registrationNights = computed(() =>
  calculateNights(
    registrationAssignment.checkInDate,
    registrationAssignment.checkOutDate,
  ),
);
const registrationEstimatedTotal = computed(() => {
  const roomRate = Number(registrationSelectedRoom.value?.ratePerNight || 0);
  return roomRate * Number(registrationNights.value || 0);
});

const resetStayAssignments = () => {
  const start = todayInput();
  const end = tomorrowInput();
  Object.assign(registrationAssignment, {
    roomNumber: "",
    checkInDate: start,
    checkOutDate: end,
    specialRequests: "",
    guestList: [],
  });
  Object.assign(profileAssignment, {
    roomNumber: "",
    checkInDate: start,
    checkOutDate: end,
    specialRequests: "",
    guestList: [],
  });
};

const addRegistrationGuest = () => {
  if (registrationAssignment.guestList.length >= 4) {
    showToast("Maximum 5 guests per room (1 primary + 4 additional).", "error");
    return;
  }
  registrationAssignment.guestList.push({
    fullName: "",
    phoneNumber: "",
    citizenshipIdNumber: "",
    address: "",
    relation: "",
  });
};

const addProfileGuest = () => {
  if (profileAssignment.guestList.length >= 4) {
    showToast("Maximum 5 guests per room (1 primary + 4 additional).", "error");
    return;
  }
  profileAssignment.guestList.push({
    fullName: "",
    phoneNumber: "",
    citizenshipIdNumber: "",
    address: "",
    relation: "",
  });
};

const showToast = (message, type = "success") => {
  toast.show = true;
  toast.message = message;
  toast.type = type;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.show = false;
  }, 2500);
};

const initials = (name) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return "G";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

const formatNpr = (value) =>
  `Rs. ${Number(value || 0).toLocaleString("ne-NP")}`;

const formatShortDate = (value) => {
  if (!value) return "-";
  const adDate = new Date(value);
  if (Number.isNaN(adDate.getTime())) return "-";
  try {
    return new NepaliDate(adDate).format("DD MMMM YYYY", "en");
  } catch {
    return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(
      adDate,
    );
  }
};

const stayNights = (stay) => {
  const inDate = new Date(stay.checkInDate);
  const outDate = new Date(stay.checkOutDate);
  if (Number.isNaN(inDate.getTime()) || Number.isNaN(outDate.getTime()))
    return "-";
  const diff = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff);
};

const roomBadgeClass = (room) =>
  room?.roomNumber
    ? "room-pill room-pill--active"
    : "room-pill room-pill--idle";

const ensureRegistrationDates = () => {
  if (!registrationAssignment.checkInDate) {
    registrationAssignment.checkInDate = todayInput();
  }
  if (!registrationAssignment.checkOutDate) {
    registrationAssignment.checkOutDate = tomorrowInput();
  }
};

const ensureProfileDates = () => {
  if (!profileAssignment.checkInDate) {
    profileAssignment.checkInDate = todayInput();
  }
  if (!profileAssignment.checkOutDate) {
    profileAssignment.checkOutDate = tomorrowInput();
  }
};

const validateRoomAssignment = (assignment) => {
  if (!assignment.roomNumber) {
    return "Please select a room.";
  }
  const nights = calculateNights(
    assignment.checkInDate,
    assignment.checkOutDate,
  );
  if (!nights) {
    return "Check-out must be after check-in.";
  }
  return "";
};

const validateForm = () => {
  errors.fullName = "";
  errors.phoneNumber = "";
  errors.location = "";
  errors.citizenshipIdNumber = "";

  const normalized = customerStore.normalizePhone(form.phoneNumber);
  const digits = normalized.replace(/^\+977/, "");

  if (!form.fullName.trim() || form.fullName.trim().length < 2) {
    errors.fullName = "Full name must be at least 2 characters.";
  }

  if (digits.length !== 10) {
    errors.phoneNumber = "Enter a valid Nepali phone number.";
  }

  return (
    !errors.fullName &&
    !errors.phoneNumber &&
    !errors.location &&
    !errors.citizenshipIdNumber
  );
};

const clearForm = () => {
  Object.assign(form, {
    fullName: "",
    phoneNumber: "",
    location: "",
    nationality: "Nepali",
    notes: "",
    citizenshipIdNumber: "",
  });
  registrationRoomAssignmentEnabled.value = false;
  resetStayAssignments();
  editCustomerId.value = "";
  phoneMatch.value = {
    exists: false,
    customer: null,
    visitCount: 0,
    normalized: "",
  };
};

const buildPayload = () => {
  const normalizedPhone = customerStore.normalizePhone(form.phoneNumber);
  return {
    fullName: form.fullName.trim(),
    phoneNumber: normalizedPhone,
    address: form.location.trim() || undefined,
    notes: form.notes.trim() || undefined,
    nationality: form.nationality.trim() || "Nepali",
    citizenshipIdNumber: form.citizenshipIdNumber.trim() || undefined,
  };
};

const selectCustomer = async (id) => {
  try {
    await customerStore.fetchCustomerById(id);
    await customerStore.fetchCustomerStays(id);
    showProfileCard.value = true;
    showCurrentStayCard.value = true;
    profileRoomAssignmentExpanded.value = false;
    showAllStays.value = false;
  } catch (error) {
    showToast(
      error.response?.data?.message || "Unable to load customer profile",
      "error",
    );
  }
};

const submitForm = async () => {
  if (!validateForm()) return;

  if (registrationRoomAssignmentEnabled.value) {
    const roomError = validateRoomAssignment(registrationAssignment);
    if (roomError) {
      showToast(roomError, "error");
      return;
    }
  }

  try {
    const payload = buildPayload();
    let customer;
    if (isEditMode.value) {
      customer = await customerStore.updateCustomer(
        editCustomerId.value,
        payload,
      );
      showToast("Customer updated successfully", "success");
    } else {
      customer = await customerStore.createCustomer(payload);
    }

    if (registrationRoomAssignmentEnabled.value) {
      const room = registrationSelectedRoom.value;
      await customerStore.assignRoom(customer._id, {
        roomNumber: registrationAssignment.roomNumber,
        checkIn: registrationAssignment.checkInDate,
        checkOut: registrationAssignment.checkOutDate,
        specialRequests: registrationAssignment.specialRequests,
        guestList: registrationAssignment.guestList.filter((g) =>
          g.fullName?.trim(),
        ),
      });
      showToast(
        `Customer registered and checked into Room ${room?.roomNumber || registrationAssignment.roomNumber}`,
        "success",
      );
    } else if (!isEditMode.value) {
      showToast("Customer registered successfully", "success");
    }

    clearForm();
    if (customer?._id) {
      await selectCustomer(customer._id);
    }
  } catch (error) {
    showToast(
      error.response?.data?.message || "Failed to save customer",
      "error",
    );
  }
};

const viewMatchedProfile = async () => {
  if (!phoneMatch.value.customer?._id) return;
  await selectCustomer(phoneMatch.value.customer._id);
};

const dismissCurrentStayCard = () => {
  showCurrentStayCard.value = false;
};

const restoreCurrentStayCard = () => {
  showCurrentStayCard.value = true;
};

const dismissProfileCard = () => {
  showProfileCard.value = false;
};

const restoreProfileCard = () => {
  showProfileCard.value = true;
};

const toggleProfileAssignRoom = () => {
  profileRoomAssignmentExpanded.value = !profileRoomAssignmentExpanded.value;
  if (profileRoomAssignmentExpanded.value) {
    ensureProfileDates();
  }
};

const submitProfileAssignment = async () => {
  if (!selectedCustomer.value?._id) return;
  const roomError = validateRoomAssignment(profileAssignment);
  if (roomError) {
    showToast(roomError, "error");
    return;
  }

  try {
    const room = roomByNumber(profileAssignment.roomNumber);
    await customerStore.assignRoom(selectedCustomer.value._id, {
      roomNumber: profileAssignment.roomNumber,
      checkIn: profileAssignment.checkInDate,
      checkOut: profileAssignment.checkOutDate,
      specialRequests: profileAssignment.specialRequests,
      guestList: profileAssignment.guestList.filter((g) => g.fullName?.trim()),
    });
    profileRoomAssignmentExpanded.value = false;
    showToast(
      `Room ${room?.roomNumber || profileAssignment.roomNumber} assigned successfully`,
      "success",
    );
    await selectCustomer(selectedCustomer.value._id);
  } catch (error) {
    showToast(
      error.response?.data?.message || "Unable to assign room",
      "error",
    );
  }
};

const checkoutCurrentStay = async () => {
  if (!currentStay.value?._id) return;
  if (currentStayReturn.value > 0) {
    showToast("plz collect your money", "error");
    return;
  }
  try {
    await customerStore.checkoutCustomer(currentStay.value._id);
    showToast("Customer checked out successfully", "success");
    if (selectedCustomer.value?._id) {
      await selectCustomer(selectedCustomer.value._id);
    }
  } catch (error) {
    showToast(
      error.response?.data?.message || "Unable to check out customer",
      "error",
    );
  }
};

const openPaymentPanel = () => {
  paymentDraftAmount.value =
    currentStayRemainingBalance.value || currentStayPaymentDue.value;
  paymentPanelOpen.value = true;
};

const cancelPaymentPanel = () => {
  paymentPanelOpen.value = false;
};

const recordCurrentStayPayment = async () => {
  if (!currentStay.value?._id) return;
  const amount = Math.min(
    Math.max(Number(paymentDraftAmount.value || 0), 0),
    currentStayPaymentMax.value || Number(currentStay.value?.totalAmount || 0),
  );

  try {
    await customerStore.recordPayment(currentStay.value._id, amount);
    paymentPanelOpen.value = false;
    showToast("Payment recorded successfully", "success");
    if (selectedCustomer.value?._id) {
      await selectCustomer(selectedCustomer.value._id);
    }
  } catch (error) {
    showToast(
      error.response?.data?.message || "Unable to record payment",
      "error",
    );
  }
};

const viewCurrentRoom = () => {
  if (!currentStay.value?.room?.roomNumber) return;
  router.push({
    name: "rooms",
    query: { roomNumber: currentStay.value.room.roomNumber },
  });
};

const selectedRoomForProfile = computed(() =>
  roomByNumber(profileAssignment.roomNumber),
);

const editSelected = () => {
  if (!selectedCustomer.value) return;
  editCustomerId.value = selectedCustomer.value._id;
  Object.assign(form, {
    fullName: selectedCustomer.value.fullName || "",
    phoneNumber: selectedCustomer.value.phoneNumber || "",
    location: selectedCustomer.value.address || "",
    nationality: selectedCustomer.value.nationality || "Nepali",
    notes: selectedCustomer.value.notes || "",
    citizenshipIdNumber: selectedCustomer.value.citizenshipIdNumber || "",
  });
};

const printProfile = () => {
  window.print();
};

const deleteSelected = async () => {
  if (!selectedCustomer.value?._id) return;
  const confirmed = window.confirm("Delete this customer?");
  if (!confirmed) return;

  try {
    await customerStore.deleteCustomer(selectedCustomer.value._id);
    showToast("Customer deleted", "success");
  } catch (error) {
    showToast(
      error.response?.data?.message || "Unable to delete customer",
      "error",
    );
  }
};

const toLocalDateTimeInput = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const openStayModal = async () => {
  if (!selectedCustomer.value?._id) return;
  const now = new Date();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);

  Object.assign(stayForm, {
    roomId: "",
    checkInDate: toLocalDateTimeInput(now),
    checkOutDate: toLocalDateTimeInput(tomorrow),
    guests: 1,
    stayNotes: "",
  });

  try {
    const { data } = await api.get("/rooms");
    rooms.value = data.rooms || [];
    showStayModal.value = true;
  } catch (error) {
    showToast(error.response?.data?.message || "Unable to load rooms", "error");
  }
};

const createStayForCustomer = async () => {
  if (!selectedCustomer.value?._id) return;
  const employeeId = auth.employee?.id || auth.employee?._id;
  if (!employeeId) {
    showToast("Session expired. Please log in again.", "error");
    return;
  }

  try {
    await api.post("/stays", {
      customerId: selectedCustomer.value._id,
      roomId: stayForm.roomId,
      employeeId,
      checkInDate: stayForm.checkInDate,
      checkOutDate: stayForm.checkOutDate,
      guests: stayForm.guests,
      stayNotes: stayForm.stayNotes,
    });

    showStayModal.value = false;
    showToast("Stay created successfully", "success");
    await selectCustomer(selectedCustomer.value._id);
  } catch (error) {
    showToast(
      error.response?.data?.message || "Unable to create stay",
      "error",
    );
  }
};

watch(searchInput, (value) => {
  if (searchDebounce.value) clearTimeout(searchDebounce.value);
  searchDebounce.value = setTimeout(() => {
    customerStore.searchCustomers(value);
  }, 400);
});

watch(
  () => form.phoneNumber,
  (value) => {
    if (phoneDebounce.value) clearTimeout(phoneDebounce.value);

    phoneDebounce.value = setTimeout(async () => {
      const normalized = customerStore.normalizePhone(value);
      const digits = normalized.replace(/^\+977/, "");
      if (digits.length < 10) {
        phoneMatch.value = {
          exists: false,
          customer: null,
          visitCount: 0,
          normalized,
        };
        return;
      }

      try {
        const result = await customerStore.checkPhoneExists(value);
        if (
          isEditMode.value &&
          result.customer?._id &&
          result.customer._id === editCustomerId.value
        ) {
          phoneMatch.value = {
            exists: false,
            customer: null,
            visitCount: 0,
            normalized,
          };
          return;
        }
        phoneMatch.value = result;
      } catch {
        phoneMatch.value = {
          exists: false,
          customer: null,
          visitCount: 0,
          normalized,
        };
      }
    }, 500);
  },
);

onMounted(() => {
  customerStore.searchResults = [];
  customerStore.fetchAvailableRooms().catch(() => {});
  resetStayAssignments();
});

watch(
  currentStay,
  (stay) => {
    paymentPanelOpen.value = false;
    paymentDraftAmount.value = Number(
      stay?.remainingBalance || stay?.totalAmount || 0,
    );
  },
  { immediate: true },
);

onUnmounted(() => {
  if (searchDebounce.value) clearTimeout(searchDebounce.value);
  if (phoneDebounce.value) clearTimeout(phoneDebounce.value);
  if (toastTimer) clearTimeout(toastTimer);
});
</script>

<style scoped>
.customer-management {
  background: #fafaf7;
  min-height: 100%;
  border-radius: 12px;
}

.layout {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 14px;
}

.card {
  background: #fff;
  border: 1px solid #e8e6e0;
  border-radius: 12px;
  padding: 14px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
}

h2,
h3,
h4 {
  font-family: "DM Serif Display", Georgia, serif;
  margin: 0;
  color: #1a1814;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: start;
}

.field-row {
  align-self: start;
}

.full-width {
  grid-column: 1 / -1;
}

label {
  display: grid;
  gap: 6px;
  font-family: "DM Sans", "Segoe UI", sans-serif;
  color: #2f2b22;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #e8e6e0;
  border-radius: 8px;
  background: #fff;
  font-family: "DM Sans", "Segoe UI", sans-serif;
  font-size: 0.95rem;
  color: #1a1814;
}

input,
select {
  height: 38px;
  padding: 0 10px;
}

textarea {
  padding: 8px 10px;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #c9a84c;
  box-shadow: 0 0 0 3px rgba(201, 168, 76, 0.15);
}

.input-error {
  border-color: #8b2020;
}

.error-text {
  color: #8b2020;
  font-size: 12px;
}

.helper-text {
  color: #716b5b;
  font-size: 12px;
}

.room-assignment-section {
  margin-top: 4px;
  border-top: 1px solid #ede8da;
  padding-top: 10px;
}

.toggle-row {
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 8px;
  display: grid;
  font-weight: 600;
}

.toggle-row input {
  width: 16px;
  height: 16px;
  margin: 0;
}

.room-assignment-panel {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
  transition:
    opacity 0.25s ease,
    margin-top 0.25s ease;
}

.room-assignment-panel--open {
  max-height: none;
  overflow: visible;
  opacity: 1;
  margin-top: 12px;
}

.room-assignment-panel--inline {
  margin-top: 0;
}

.room-assignment-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 12px;
  border: 1px solid #e8e6e0;
  border-radius: 12px;
  background: #fafaf7;
}

.room-assignment-grid--inline {
  background: #fff;
}

.estimated-total-input {
  color: #8b6914;
  font-family: "DM Serif Display", Georgia, serif;
  font-size: 1.1rem;
}

.guest-list-block {
  border-top: 1px solid #ede8da;
  padding-top: 10px;
  margin-top: 4px;
}

.guest-list-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  font-weight: 600;
}

.guest-detail-card {
  border: 1px solid #e8e6e0;
  border-radius: 10px;
  padding: 10px;
  margin-bottom: 10px;
  background: #fff;
}

.guest-detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.guest-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.current-stay-block {
  position: relative;
  margin-top: 12px;
  border-radius: 12px;
  padding: 16px;
  padding-top: 20px;
  padding-right: 56px;
}

.current-stay-block--active {
  background: #ebf5ee;
  border: 1px solid #c4dfcc;
}

.current-stay-block--idle {
  background: #f2f1ed;
  border: 1px solid #e8e6e0;
}

.current-stay-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.current-stay-head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  min-width: 0;
}

.icon-close-btn {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  border: 1px solid #e8e6e0;
  background: #fff;
  color: #5d5a52;
  cursor: pointer;
  font-size: 1.05rem;
  line-height: 1;
  display: inline-grid;
  place-items: center;
  flex: none;
}

.icon-close-btn:hover {
  background: #f7f4ec;
  color: #1a1814;
}

.current-stay-close-btn {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
}

.icon-close-btn--sm {
  width: 28px;
  height: 28px;
  font-size: 0.95rem;
}

.stay-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 12px;
}

.stay-badge--active {
  background: #ebf5ee;
  color: #1a5c3a;
}

.stay-badge--idle {
  background: #f2f1ed;
  color: #6b6860;
}

.current-stay-room {
  font-family: "DM Serif Display", Georgia, serif;
  font-size: 22px;
  color: #1a1814;
}

.current-stay-room--idle {
  font-size: 18px;
}

.current-stay-type {
  color: #5e5a50;
  margin-top: 4px;
}

.current-stay-type--idle {
  margin-bottom: 12px;
}

.stay-chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}

.stay-chip {
  background: #fff;
  border: 1px solid #e8e6e0;
  border-radius: 20px;
  color: #6b6860;
  font-size: 12px;
  padding: 4px 12px;
}

.current-stay-rate {
  color: #8b6914;
  font-family: "DM Serif Display", Georgia, serif;
  font-size: 18px;
  font-weight: 500;
}

.payment-status-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 10px;
  margin-top: 12px;
}

.payment-status-meta {
  color: #6f6a58;
  font-size: 12px;
}

.payment-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
}

.payment-badge--green {
  background: #ebf5ee;
  color: #1a5c3a;
}

.payment-badge--amber {
  background: #fdf1d9;
  color: #8b6914;
}

.payment-badge--red {
  background: #fbecec;
  color: #8b2020;
}

.payment-action-box {
  margin-top: 12px;
  display: grid;
  gap: 10px;
}

.payment-entry-panel {
  border: 1px solid #e8e6e0;
  border-radius: 10px;
  background: #fff;
  padding: 12px;
  display: grid;
  gap: 10px;
}

.payment-entry-panel label {
  display: grid;
  gap: 6px;
}

.payment-entry-panel span {
  font-size: 12px;
  color: #6f6a58;
}

.payment-entry-panel input[type="number"],
.payment-entry-panel input[type="number"],
.payment-entry-panel input[type="range"] {
  width: 100%;
}

.payment-entry-panel input[type="number"] {
  background: #ffffff;
  color: #12213f;
  border: 1px solid #e6e0d6;
  padding: 10px 12px;
  border-radius: 8px;
}

.payment-entry-panel input[type="number"]:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(201, 168, 76, 0.08);
  border-color: rgba(201, 168, 76, 0.6);
}

.payment-quick-actions,
.payment-entry-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn-gold--outline {
  background: #fff;
  border: 1px solid #c9a84c;
  color: #8b6914;
}

.btn-gold--outline:hover {
  background: #fdf3e0;
}

.profile-actions--compact {
  margin-top: 12px;
}

.btn-danger-outline {
  background: #fff;
  border: 1px solid #8b2020;
  color: #8b2020;
}

.btn-danger-outline:hover {
  background: #fbecec;
}

.inline-assign-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.result-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.room-pill {
  display: inline-flex;
  align-items: center;
  border-radius: 20px;
  font-size: 12px;
  padding: 3px 10px;
  white-space: nowrap;
}

.room-pill--active {
  background: #ebf5ee;
  color: #1a5c3a;
}

.room-pill--idle {
  background: #f2f1ed;
  color: #a09d96;
}

.duplicate-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  border: 1px solid #f2dfbe;
  background: #fdf3e0;
  color: #7a4f00;
  border-radius: 8px;
  padding: 10px;
}

.duplicate-card p {
  margin: 4px 0 0;
}

.btn {
  border-radius: 8px;
  border: none;
  padding: 8px 12px;
  cursor: pointer;
  font-family: "DM Sans", "Segoe UI", sans-serif;
}

.btn-primary {
  background: #1a1814;
  color: #fff;
}

.btn-outline {
  background: #fff;
  border: 1px solid #e8e6e0;
  color: #1a1814;
}

.btn-gold {
  background: #c9a84c;
  color: #1a1814;
}

.btn-danger {
  background: #fff2f2;
  color: #8b2020;
  border: 1px solid #e0bebe;
}

.results-wrap {
  margin-top: 12px;
  display: grid;
  gap: 8px;
}

.result-item {
  border: 1px solid #e8e6e0;
  border-radius: 10px;
  background: #fff;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 8px;
  cursor: pointer;
}

.result-main {
  display: grid;
  gap: 2px;
}

.result-main small,
.result-side small {
  color: #6a6558;
}

.result-side {
  display: grid;
  justify-items: end;
  gap: 4px;
}

.result-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.result-title-row strong {
  color: #1a1814;
  font-size: 1.02rem;
  font-weight: 700;
  line-height: 1.15;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: #f5e9c8;
  color: #8b6914;
  font-weight: 700;
}

.avatar-lg {
  width: 48px;
  height: 48px;
}

.visit-badge {
  font-size: 12px;
  color: #5f5b4f;
}

.loyal-badge {
  background: #f5e9c8;
  color: #8b6914;
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 700;
}

.profile-card {
  position: relative;
  margin-top: 12px;
  border: 1px solid #e8e6e0;
  border-radius: 10px;
  padding: 14px 14px 12px;
}

.profile-head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 12px;
  align-items: start;
}

.profile-head-content {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.profile-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.profile-name-row h3 {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-head p {
  margin: 0;
  color: #565141;
}

.profile-card-close-btn {
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 2;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin: 12px 0;
}

.stats-row > div {
  border: 1px solid #e8e6e0;
  border-radius: 8px;
  padding: 8px;
  display: grid;
  gap: 3px;
}

.stats-row span {
  font-size: 12px;
  color: #746f5e;
}

.table-head-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 10px 0;
}

.link-btn {
  border: none;
  background: transparent;
  color: #8b6914;
  cursor: pointer;
  font-weight: 600;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  border-bottom: 1px solid #eeeae0;
  text-align: left;
  padding: 8px 6px;
  white-space: nowrap;
}

th {
  font-size: 12px;
  color: #6f6a5b;
}

.profile-actions {
  margin-top: 10px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.empty-state {
  border: 1px dashed #e8e6e0;
  border-radius: 10px;
  padding: 16px;
  text-align: center;
  color: #6f6a5b;
}

.placeholder-icon {
  width: 52px;
  height: 52px;
  margin: 0 auto 8px;
  border-radius: 50%;
  background: #f5e9c8;
  color: #8b6914;
  display: grid;
  place-items: center;
  font-size: 1.4rem;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.stay-form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.local-toast {
  position: fixed;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  background: #1a1814;
  color: #fff;
  border-radius: 20px;
  padding: 10px 18px;
  z-index: 120;
}

.local-toast--error {
  background: #8b2020;
}

@media (max-width: 1000px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .form-grid,
  .stay-form,
  .stats-row,
  .guest-detail-grid {
    grid-template-columns: 1fr;
  }

  .profile-head {
    grid-template-columns: 1fr;
  }

  .profile-name-row h3 {
    white-space: normal;
  }

  .current-stay-block {
    padding-right: 16px;
  }

  .current-stay-close-btn {
    top: 10px;
    right: 10px;
  }
}
</style>
