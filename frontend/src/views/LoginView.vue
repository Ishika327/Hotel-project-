<template>
  <section class="login-screen">
    <div class="login-card">
      <div class="login-hero">
        <div class="login-logo">H</div>
        <div>
          <p class="eyebrow">Hotel Aashirbad and guest house</p>
          <h1>Staff Portal</h1>
          <p class="subtle">
            Access dashboards for rooms, stays, invoices, reports, and team
            operations.
          </p>
        </div>
      </div>

      <form class="stack" @submit.prevent="submit">
        <label>
          Email
          <input
            v-model="form.email"
            type="email"
            placeholder="admin@hotel.local"
            required
          />
        </label>
        <label>
          Password
          <input
            v-model="form.password"
            type="password"
            placeholder="Your password"
            required
          />
        </label>

        <button class="primary-btn" :disabled="auth.loading" type="submit">
          {{ auth.loading ? "Signing in..." : "Sign In" }}
        </button>
      </form>

      <div class="login-hint">Demo admin: admin@hotel.local / Hotel@12345</div>
    </div>
  </section>
</template>

<script setup>
import { reactive } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/auth";
import { useUiStore } from "../stores/ui";

const auth = useAuthStore();
const ui = useUiStore();
const router = useRouter();

const form = reactive({ email: "admin@hotel.local", password: "Hotel@12345" });

const submit = async () => {
  try {
    await auth.login(form);
    ui.pushToast("Logged in successfully");
    router.push("/");
  } catch (error) {
    ui.pushToast(error.response?.data?.message || "Login failed", "error");
  }
};
</script>
