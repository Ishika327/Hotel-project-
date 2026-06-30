<template>
  <header class="topbar">
    <button class="icon-btn mobile-only" @click="$emit('toggle-sidebar')">
      ☰
    </button>
    <div>
      <h1>Hotel Aashirbad and guest house</h1>
    </div>

    <div class="topbar__actions">
      <button class="pill-btn pill-btn--ghost" @click="logout">Logout</button>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();
const router = useRouter();

const logout = async () => {
  await auth.logout();
  router.push("/login");
};
</script>
