<template>
  <div class="settings-page">
    <!-- CHANGE EMAIL CARD -->
    <div class="card">
      <h3>Change Email</h3>
      <input v-model="newEmail" type="email" placeholder="Enter new email" />
      <p class="error" v-if="emailError">{{ emailError }}</p>
      <p class="success" v-if="emailSuccess">{{ emailSuccess }}</p>
      <button @click="changeEmail" :disabled="emailLoading">
        {{ emailLoading ? "Saving..." : "Update Email" }}
      </button>
    </div>

    <!-- CHANGE PASSWORD CARD -->
    <div class="card">
      <h3>Change Password</h3>
      <input
        v-model="currentPassword"
        type="password"
        placeholder="Current password"
      />
      <input
        v-model="newPassword"
        type="password"
        placeholder="New password (min 8 chars)"
      />
      <input
        v-model="confirmPassword"
        type="password"
        placeholder="Confirm new password"
      />
      <p class="error" v-if="passwordError">{{ passwordError }}</p>
      <p class="success" v-if="passwordSuccess">{{ passwordSuccess }}</p>
      <button @click="changePassword" :disabled="passwordLoading">
        {{ passwordLoading ? "Saving..." : "Update Password" }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import axios from "axios";
import { useAuthStore } from "../stores/auth";

const auth = useAuthStore();

const newEmail = ref(auth.employee?.email || "");
const emailError = ref("");
const emailSuccess = ref("");
const emailLoading = ref(false);

const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const passwordError = ref("");
const passwordSuccess = ref("");
const passwordLoading = ref(false);

const authHeaders = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem("hotel_token") || ""}`,
  },
});

async function changeEmail() {
  emailError.value = "";
  emailSuccess.value = "";
  if (!newEmail.value) return (emailError.value = "Enter a new email");
  emailLoading.value = true;
  try {
    await axios.put(
      "/api/auth/update-credentials",
      { newEmail: newEmail.value },
      authHeaders(),
    );
    emailSuccess.value = "Email updated successfully";
    if (auth.employee) {
      auth.employee = {
        ...auth.employee,
        email: newEmail.value.toLowerCase().trim(),
      };
      localStorage.setItem("hotel_employee", JSON.stringify(auth.employee));
    }
    newEmail.value = auth.employee?.email || "";
  } catch (err) {
    emailError.value = err.response?.data?.message || "Failed to update email";
  } finally {
    emailLoading.value = false;
  }
}

async function changePassword() {
  passwordError.value = "";
  passwordSuccess.value = "";
  if (!currentPassword.value || !newPassword.value || !confirmPassword.value)
    return (passwordError.value = "All fields are required");
  if (newPassword.value !== confirmPassword.value)
    return (passwordError.value = "Passwords do not match");
  if (newPassword.value.length < 8)
    return (passwordError.value = "Password must be at least 8 characters");
  passwordLoading.value = true;
  try {
    await axios.put(
      "/api/auth/update-credentials",
      {
        currentPassword: currentPassword.value,
        newPassword: newPassword.value,
      },
      authHeaders(),
    );
    passwordSuccess.value = "Password updated successfully";
    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
  } catch (err) {
    passwordError.value =
      err.response?.data?.message || "Failed to update password";
  } finally {
    passwordLoading.value = false;
  }
}
</script>
