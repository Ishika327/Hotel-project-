<template>
  <aside :class="['app-sidebar', { 'app-sidebar--open': open }]">
    <div>
      <div class="app-sidebar__brand">
        <div class="brand-mark brand-mark--hotel">H</div>
        <div>
          <strong>Hotel Aashirbad</strong>
          <p>Staff Portal</p>
        </div>
        <button
          class="icon-btn mobile-only"
          type="button"
          @click="$emit('close')"
        >
          ✕
        </button>
      </div>

      <nav class="app-sidebar__nav">
        <RouterLink to="/" @click="$emit('close')">Dashboard</RouterLink>
        <RouterLink to="/rooms" @click="$emit('close')">Rooms</RouterLink>
        <RouterLink to="/customers" @click="$emit('close')"
          >Customers</RouterLink
        >
        <RouterLink to="/stays" @click="$emit('close')">Stays</RouterLink>
        <RouterLink to="/invoices" @click="$emit('close')">Invoices</RouterLink>
        <RouterLink to="/reports" @click="$emit('close')">Reports</RouterLink>
        <RouterLink to="/food-billing" @click="$emit('close')"
          >Food Billing</RouterLink
        >
      </nav>
    </div>

    <div class="app-sidebar__footer">
      <div class="app-sidebar__user">
        <span class="user-menu__avatar">{{ userInitials }}</span>
        <div>
          <strong>{{ userName }}</strong>
          <p>{{ userRole }}</p>
        </div>
      </div>
      <RouterLink
        class="pill-btn app-sidebar__account-link"
        to="/profile-settings"
        @click="$emit('close')"
      >
        My Account
      </RouterLink>
    </div>
  </aside>

  <div
    v-if="open"
    class="sidebar-backdrop mobile-only"
    @click="$emit('close')"
  ></div>
</template>

<script setup>
import { computed } from "vue";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();

defineProps({ open: { type: Boolean, default: false } });
defineEmits(["close"]);

const userName = computed(
  () => auth.employee?.fullName || auth.employee?.name || "User",
);
const userRole = computed(() => auth.employee?.role || "Staff member");
const userInitials = computed(
  () =>
    userName.value
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U",
);
</script>
