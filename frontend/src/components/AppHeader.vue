<template>
  <header class="app-header">
    <div class="app-header__left">
      <button
        class="icon-btn mobile-only"
        type="button"
        @click="$emit('toggle-sidebar')"
      >
        ☰
      </button>
      <div>
        <p class="eyebrow app-header__crumb">{{ breadcrumb }}</p>
        <h1>{{ title }}</h1>
      </div>
    </div>

    <div class="app-header__meta">
      <div class="clock-chip">{{ clockText }}</div>
      <button
        class="pill-btn pill-btn--ghost"
        type="button"
        @click="ui.toggleTheme()"
      >
        {{ ui.theme === "dark" ? "Light Mode" : "Dark Mode" }}
      </button>
      <details class="user-menu">
        <summary class="pill-btn user-menu__trigger">
          <span class="user-menu__avatar">{{ userInitials }}</span>
          <span>{{ userName }}</span>
        </summary>
        <div class="user-menu__panel">
          <p class="subtle">{{ userRole }}</p>
          <RouterLink
            class="pill-btn pill-btn--ghost user-menu__link"
            to="/account-settings"
          >
            Account Settings
          </RouterLink>
          <RouterLink
            class="pill-btn pill-btn--ghost user-menu__link"
            to="/profile-settings"
          >
            My Account
          </RouterLink>
          <button class="pill-btn" type="button" @click="logout">Logout</button>
        </div>
      </details>
    </div>
  </header>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useUiStore } from "../stores/ui";

defineEmits(["toggle-sidebar"]);

const auth = useAuthStore();
const ui = useUiStore();
const route = useRoute();
const router = useRouter();
const now = ref(new Date());

const titles = {
  dashboard: "Dashboard",
  customers: "Customers",
  rooms: "Rooms",
  stays: "Stays",
  invoices: "Invoices",
  reports: "Reports",
  AccountSettings: "Account Settings",
  ProfileSettings: "Profile Settings",
  "food-billing": "Food Billing",
};

const title = computed(() => titles[route.name] || "Hotel Portal");
const breadcrumb = computed(() => ["Hotel Admin", title.value].join(" / "));
const clockText = computed(() =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(now.value),
);
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

let timerId;

const logout = async () => {
  await auth.logout();
  router.push("/login");
};

onMounted(() => {
  timerId = window.setInterval(() => {
    now.value = new Date();
  }, 30000);
});

onBeforeUnmount(() => {
  window.clearInterval(timerId);
});
</script>
