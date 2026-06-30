<template>
  <section class="page-grid">
    <div class="page-header">
      <div>
        <p class="eyebrow">Room Inventory</p>
        <h2>Rooms</h2>
      </div>
      <button class="pill-btn" type="button" @click="openCreateModal">
        Add Room
      </button>
    </div>

    <div class="panel">
      <div class="room-filterbar">
        <input
          v-model="filters.search"
          class="table-search"
          type="search"
          placeholder="Search room number or type"
        />
        <select v-model="filters.status">
          <option value="all">All Statuses</option>
          <option value="Available">Available</option>
          <option value="Occupied">Occupied</option>
          <option value="Maintenance">Maintenance</option>
          <option value="Cleaning">Cleaning</option>
        </select>
        <select v-model="filters.type">
          <option value="all">All Types</option>
          <option value="Single">Single</option>
          <option value="Double">Double</option>
          <option value="Deluxe">Deluxe</option>
          <option value="Suite">Suite</option>
        </select>
        <select v-model="filters.floor">
          <option value="all">All Floors</option>
          <option v-for="floor in floors" :key="floor" :value="String(floor)">
            Floor {{ floor }}
          </option>
        </select>
      </div>

      <div v-if="filteredRooms.length" class="room-grid">
        <RoomCard
          v-for="room in filteredRooms"
          :key="room._id"
          :room="room"
          :price-label="formatCurrency(room.pricePerNight)"
        >
          <template #footer>
            <div class="action-row">
              <button class="pill-btn" type="button" @click="editRoom(room)">
                Edit
              </button>
              <button
                class="pill-btn pill-btn--ghost"
                type="button"
                @click="requestDelete(room)"
              >
                Delete
              </button>
            </div>
          </template>
        </RoomCard>
      </div>

      <div v-else class="empty-state">
        No rooms found - add your first room.
      </div>
    </div>

    <button
      class="floating-action-btn primary-btn"
      type="button"
      @click="openCreateModal"
    >
      + Add Room
    </button>

    <BaseModal
      v-if="showModal"
      :title="editingRoom ? 'Edit Room' : 'Add Room'"
      @close="showModal = false"
    >
      <form class="stack" @submit.prevent="saveRoom">
        <label
          ><span>Room Number</span
          ><input v-model="roomForm.roomNumber" required
        /></label>
        <label>
          <span>Room Type</span>
          <select v-model="roomForm.roomType" required>
            <option>Single</option>
            <option>Double</option>
            <option>Deluxe</option>
            <option>Suite</option>
          </select>
        </label>
        <label
          ><span>Price Per Night</span
          ><input
            v-model.number="roomForm.pricePerNight"
            type="number"
            required
        /></label>
        <label>
          <span>Status</span>
          <select v-model="roomForm.status">
            <option>Available</option>
            <option>Occupied</option>
            <option>Cleaning</option>
          </select>
        </label>
        <button class="primary-btn" type="submit">Save Room</button>
      </form>
    </BaseModal>

    <ConfirmModal
      v-if="pendingDeleteRoom"
      title="Delete room"
      confirm-label="Delete Room"
      message="This will remove the room from the inventory. Continue?"
      @cancel="pendingDeleteRoom = null"
      @confirm="removeRoom(pendingDeleteRoom._id)"
    />
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute } from "vue-router";
import api from "../services/api";
import BaseModal from "../components/BaseModal.vue";
import ConfirmModal from "../components/ConfirmModal.vue";
import RoomCard from "../components/RoomCard.vue";
import { useUiStore } from "../stores/ui";
import { formatCurrency } from "../utils/format";

const ui = useUiStore();
const route = useRoute();
const rooms = ref([]);
const showModal = ref(false);
const editingRoom = ref(null);
const pendingDeleteRoom = ref(null);
const filters = reactive({
  type: "all",
  status: "all",
  floor: "all",
  search: "",
});
const roomForm = reactive({
  roomNumber: "",
  roomType: "Single",
  pricePerNight: 0,
  status: "Available",
});

const loadRooms = async () => {
  const { data } = await api.get("/rooms");
  rooms.value = data.rooms || [];
};

const filteredRooms = computed(() =>
  rooms.value.filter((room) => {
    const search = filters.search.trim().toLowerCase();
    const typeMatches =
      filters.type === "all" || room.roomType === filters.type;
    const statusMatches =
      filters.status === "all" || room.status === filters.status;
    const floorValue = String(room.floor || room.floorNumber || "");
    const floorMatches =
      filters.floor === "all" || floorValue === filters.floor;
    const targetRoomNumber = String(
      route.query.roomNumber || route.query.room || "",
    ).trim();
    const roomMatches =
      !targetRoomNumber || String(room.roomNumber) === targetRoomNumber;
    const searchMatches =
      !search ||
      String(room.roomNumber).toLowerCase().includes(search) ||
      String(room.roomType || "")
        .toLowerCase()
        .includes(search);
    return (
      typeMatches &&
      statusMatches &&
      floorMatches &&
      roomMatches &&
      searchMatches
    );
  }),
);

const floors = computed(() =>
  [
    ...new Set(
      rooms.value.map((room) => room.floor || room.floorNumber).filter(Boolean),
    ),
  ].sort((a, b) => Number(a) - Number(b)),
);

const openCreateModal = () => {
  editingRoom.value = null;
  Object.assign(roomForm, {
    roomNumber: "",
    roomType: "Single",
    pricePerNight: 0,
    status: "Available",
  });
  showModal.value = true;
};

const editRoom = (room) => {
  editingRoom.value = room;
  Object.assign(roomForm, room);
  showModal.value = true;
};

const requestDelete = (room) => {
  pendingDeleteRoom.value = room;
};

const saveRoom = async () => {
  try {
    if (editingRoom.value) {
      await api.patch(`/rooms/${editingRoom.value._id}`, roomForm);
      ui.pushToast("Room updated");
    } else {
      await api.post("/rooms", roomForm);
      ui.pushToast("Room created");
    }
    showModal.value = false;
    editingRoom.value = null;
    Object.assign(roomForm, {
      roomNumber: "",
      roomType: "Single",
      pricePerNight: 0,
      status: "Available",
    });
    await loadRooms();
  } catch (error) {
    ui.pushToast(error.response?.data?.message || "Save failed", "error");
  }
};

const removeRoom = async (id) => {
  await api.delete(`/rooms/${id}`);
  ui.pushToast("Room deleted");
  pendingDeleteRoom.value = null;
  await loadRooms();
};

onMounted(loadRooms);
</script>
