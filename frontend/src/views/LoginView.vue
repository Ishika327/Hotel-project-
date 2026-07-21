<template>
  <section class="login-page">
    <!-- Left Side -->
    <div class="login-left">
      <div class="overlay"></div>

      <div class="hotel-content">
        <span class="badge"> HOTEL MANAGEMENT SYSTEM </span>

        <h1>Hotel Aashirbad and Guest House</h1>

        <p class="hotel-desc">
          Manage reservations, room availability, guest records, billing, staff
          activities and daily hotel operations from one secure platform.
        </p>

        <div class="features">
          <div class="feature-card">
            <div class="feature-icon">🛏️</div>

            <div>
              <h4>Room Management</h4>
              <p>Track room availability and housekeeping.</p>
            </div>
          </div>

          <div class="feature-card">
            <div class="feature-icon">🛎️</div>

            <div>
              <h4>Guest Check-In & Check-Out</h4>
              <p>Fast and secure guest management.</p>
            </div>
          </div>

          <div class="feature-card">
            <div class="feature-icon">💳</div>

            <div>
              <h4>Billing & Payments</h4>
              <p>Generate invoices and payment history.</p>
            </div>
          </div>

          <div class="feature-card">
            <div class="feature-icon">📊</div>

            <div>
              <h4>Business Reports</h4>
              <p>Daily revenue, occupancy and analytics.</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Right Side -->

    <div class="login-right">
      <div class="login-card">
        <div class="logo-circle">🏨</div>

        <div class="logo">
          <h2>Welcome Back</h2>

          <p>Login to access your hotel dashboard.</p>
        </div>

        <form class="form" @submit.prevent="submit">
          <div class="input-group">
            <label>Email Address</label>

            <input
              id="login-email"
              v-model.trim="form.email"
              type="email"
              placeholder="Enter your email"
              autocomplete="email"
              :disabled="loading"
              @input="clearError"
            />
          </div>

          <div class="input-group">
            <label>Password</label>

            <div class="password-box">
              <input
                id="login-password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Enter your password"
                autocomplete="current-password"
                :disabled="loading"
                @input="clearError"
              />

              <button
                type="button"
                class="eye-btn"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? "🙈" : "👁" }}
              </button>
            </div>
          </div>

          <div class="options">
            <label class="remember">
              <input type="checkbox" />

              Remember Me
            </label>

            <a href="#"> Forgot Password? </a>
          </div>

          <p v-if="errorMessage" class="error">
            {{ errorMessage }}
          </p>

          <button class="login-btn" :disabled="loading || !isFormValid">
            <LoadingSpinner v-if="loading" label="Signing in..." />

            <span v-else> Login to Dashboard → </span>
          </button>
        </form>

        <div class="copyright">
          © 2026 Hotel Aashirbad • All Rights Reserved
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import { useAuthStore } from "../stores/auth";
import { useUiStore } from "../stores/ui";

const auth = useAuthStore();
const ui = useUiStore();
const router = useRouter();

const form = reactive({ email: "", password: "" });
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref("");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isFormValid = computed(
  () =>
    emailPattern.test(form.email) && form.password.length > 0 && !loading.value,
);

const clearError = () => {
  if (errorMessage.value) errorMessage.value = "";
};

const submit = async () => {
  if (!emailPattern.test(form.email)) {
    errorMessage.value = "Enter a valid email address.";
    return;
  }
  if (!form.password) {
    errorMessage.value = "Enter your password.";
    return;
  }

  loading.value = true;
  errorMessage.value = "";

  try {
    await auth.login({ email: form.email, password: form.password });
    ui.pushToast("Logged in successfully");
    router.push("/");
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message ||
      "Invalid email or password. Please try again.";
  } finally {
    loading.value = false;
  }
};
</script>
<style scoped>
* {
  box-sizing: border-box;
}

.login-page {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: grid;
  grid-template-columns: 58% 42%;
  background: #f5f7fb;
}

/* LEFT */

.login-left {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;

  background:
    linear-gradient(rgba(10, 20, 40, 0.72), rgba(10, 20, 40, 0.82)),
    url("https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1800&q=80");

  background-size: cover;
  background-position: center;
}

.overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, rgba(0, 0, 0, 0.15), rgba(0, 0, 0, 0.35));
}

.hotel-content {
  position: relative;
  z-index: 2;
  max-width: 560px;
}

.badge {
  display: inline-block;
  padding: 8px 18px;
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(12px);
  color: #fff;
  font-size: 13px;
  letter-spacing: 2px;
  margin-bottom: 25px;
}

.hotel-content h1 {
  color: #fff;
  font-size: 58px;
  font-weight: 700;
  margin: 0;
}

.hotel-desc {
  margin: 22px 0 40px;
  color: rgba(255, 255, 255, 0.88);
  line-height: 1.8;
  font-size: 18px;
}

.features {
  display: grid;
  gap: 16px;
}

.feature-card {
  display: flex;
  align-items: center;
  gap: 18px;
  padding: 18px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.feature-icon {
  width: 58px;
  height: 58px;
  border-radius: 15px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.15);
  font-size: 26px;
}

.feature-card h4 {
  margin: 0 0 6px;
  color: #fff;
  font-size: 18px;
}

.feature-card p {
  margin: 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 14px;
}

/* RIGHT */

.login-right {
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f6f8fb;
  padding: 35px;
}

.login-card {
  width: 100%;
  max-width: 430px;
  background: #fff;
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
}

.logo-circle {
  width: 76px;
  height: 76px;
  margin: auto;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 34px;
  background: linear-gradient(135deg, #c9a84c, #efd47b);
}

.logo {
  text-align: center;
  margin-top: 25px;
}

.logo h2 {
  margin: 0;
  color: #1b2940;
  font-size: 32px;
}

.logo p {
  margin-top: 10px;
  color: #777;
}

.form {
  margin-top: 35px;
  display: grid;
  gap: 20px;
}

.input-group {
  display: grid;
  gap: 8px;
}

.input-group label {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.input-group input {
  width: 100%;
  height: 54px;
  padding: 0 16px;
  border-radius: 14px;
  border: 1px solid #d8dfe8;
  outline: none;
  transition: 0.25s;
  font-size: 15px;
}

.input-group input:focus {
  border-color: #c9a84c;
  box-shadow: 0 0 0 4px rgba(201, 168, 76, 0.18);
}

.password-box {
  display: flex;
  align-items: center;
}

.password-box input {
  flex: 1;
  border-radius: 14px 0 0 14px;
  border-right: none;
}

.eye-btn {
  width: 58px;
  height: 54px;
  border: 1px solid #d8dfe8;
  border-left: none;
  background: #f8f9fb;
  border-radius: 0 14px 14px 0;
  cursor: pointer;
  font-size: 18px;
  transition: 0.25s;
}

.eye-btn:hover {
  background: #eef2f6;
}

.options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
}

.remember {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #555;
}

.remember input {
  width: 16px;
  height: 16px;
  accent-color: #c9a84c;
}

.options a {
  color: #b88d1d;
  text-decoration: none;
  font-weight: 600;
}

.options a:hover {
  text-decoration: underline;
}

.error {
  color: #dc3545;
  font-size: 14px;
}

.login-btn {
  width: 100%;
  height: 56px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #c9a84c, #e8ca73);
  color: #222;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.3s;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 16px 32px rgba(201, 168, 76, 0.35);
}

.login-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.copyright {
  margin-top: 24px;
  padding-top: 18px;
  border-top: 1px solid #ececec;
  text-align: center;
  color: #999;
  font-size: 13px;
}
/* -------------------- */
/* ANIMATIONS */
/* -------------------- */

.login-card {
  animation: slideIn 0.8s ease;
}

.feature-card {
  animation: fadeUp 0.8s ease;
}

.feature-card:nth-child(2) {
  animation-delay: 0.15s;
}

.feature-card:nth-child(3) {
  animation-delay: 0.3s;
}

.feature-card:nth-child(4) {
  animation-delay: 0.45s;
}

.feature-card:hover {
  transform: translateY(-3px);
  transition: 0.3s;
  background: rgba(255, 255, 255, 0.16);
}

.login-btn:active {
  transform: scale(0.98);
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(50px);
  }

  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* -------------------- */
/* RESPONSIVE */
/* -------------------- */

@media (max-width: 1200px) {
  .login-page {
    grid-template-columns: 55% 45%;
  }

  .hotel-content h1 {
    font-size: 48px;
  }

  .hotel-desc {
    font-size: 16px;
  }

  .feature-card {
    padding: 16px;
  }
}

@media (max-width: 992px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-left {
    display: none;
  }

  .login-right {
    padding: 30px;
  }

  .login-card {
    max-width: 500px;
  }
}

@media (max-width: 576px) {
  .login-right {
    padding: 18px;
  }

  .login-card {
    padding: 28px 22px;
    border-radius: 18px;
  }

  .logo-circle {
    width: 68px;
    height: 68px;
    font-size: 30px;
  }

  .logo h2 {
    font-size: 28px;
  }

  .options {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .feature-card {
    gap: 12px;
  }

  .feature-icon {
    width: 48px;
    height: 48px;
    font-size: 22px;
  }
}

/* -------------------- */
/* REMOVE PAGE SCROLL */
/* -------------------- */

:global(html),
:global(body),
:global(#app) {
  height: 100%;
  overflow: hidden;
  margin: 0;
}
</style>
