<template>
  <section class="page-grid profile-settings-page">
    <div class="page-header">
      <div>
        <p class="eyebrow">My Account</p>
        <h2>Profile Settings</h2>
      </div>
    </div>

    <div class="panel-grid profile-settings-grid">
      <article class="panel profile-card">
        <div class="panel__head panel__head--stack">
          <div>
            <h3>Change Email</h3>
            <p class="subtle">
              Update the email tied to your employee account.
            </p>
          </div>
        </div>
        <div class="section-divider"></div>

        <form class="stack" @submit.prevent="submitEmail">
          <label>
            New Email
            <input
              v-model.trim="emailForm.email"
              type="email"
              placeholder="you@hotel.com"
              autocomplete="email"
            />
          </label>

          <button
            class="primary-btn button-with-spinner"
            :disabled="emailLoading || emailDisabled"
            type="submit"
          >
            <LoadingSpinner v-if="emailLoading" label="Updating..." />
            <span v-else>Update Email</span>
          </button>

          <p v-if="emailMessage" :class="['inline-message', emailTone]">
            {{ emailMessage }}
          </p>
        </form>
      </article>

      <article class="panel profile-card">
        <div class="panel__head panel__head--stack">
          <div>
            <h3>Change Password</h3>
            <p class="subtle">
              Choose a strong password and confirm your current one.
            </p>
          </div>
        </div>
        <div class="section-divider"></div>

        <form class="stack" @submit.prevent="submitPassword">
          <label>
            Current Password
            <div class="password-field">
              <input
                v-model="passwordForm.currentPassword"
                :type="visibility.currentPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Current password"
              />
              <button
                class="password-toggle"
                type="button"
                @click="toggleVisibility('currentPassword')"
              >
                {{ visibility.currentPassword ? "🙈" : "👁" }}
              </button>
            </div>
          </label>

          <label>
            New Password
            <div class="password-field">
              <input
                v-model="passwordForm.newPassword"
                :type="visibility.newPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="At least 8 characters"
                @blur="confirmTouched = true"
              />
              <button
                class="password-toggle"
                type="button"
                @click="toggleVisibility('newPassword')"
              >
                {{ visibility.newPassword ? "🙈" : "👁" }}
              </button>
            </div>
            <div class="strength-meter">
              <span class="strength-meter__label">
                Strength: {{ passwordStrength.label }}
              </span>
              <div class="strength-meter__track">
                <span
                  class="strength-meter__fill"
                  :style="{ width: `${passwordStrength.percent}%` }"
                ></span>
              </div>
            </div>
            <small v-if="passwordErrors.newPassword" class="error-text">
              {{ passwordErrors.newPassword }}
            </small>
          </label>

          <label>
            Confirm New Password
            <div class="password-field">
              <input
                v-model="passwordForm.confirmPassword"
                :type="visibility.confirmPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="Repeat new password"
                @blur="confirmTouched = true"
              />
              <button
                class="password-toggle"
                type="button"
                @click="toggleVisibility('confirmPassword')"
              >
                {{ visibility.confirmPassword ? "🙈" : "👁" }}
              </button>
            </div>
            <small v-if="showConfirmError" class="error-text">
              Passwords must match.
            </small>
          </label>

          <button
            class="primary-btn button-with-spinner"
            :disabled="passwordLoading || passwordDisabled"
            type="submit"
          >
            <LoadingSpinner v-if="passwordLoading" label="Updating..." />
            <span v-else>Update Password</span>
          </button>

          <p v-if="passwordMessage" :class="['inline-message', passwordTone]">
            {{ passwordMessage }}
          </p>
        </form>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import { useAuthStore } from "../stores/auth";
import { useUiStore } from "../stores/ui";

const auth = useAuthStore();
const ui = useUiStore();

const emailForm = reactive({ email: auth.employee?.email || "" });
const emailLoading = ref(false);
const emailMessage = ref("");
const emailTone = ref("");

const passwordForm = reactive({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
});
const passwordLoading = ref(false);
const passwordMessage = ref("");
const passwordTone = ref("");
const confirmTouched = ref(false);
const visibility = reactive({
  currentPassword: false,
  newPassword: false,
  confirmPassword: false,
});

watch(
  () => auth.employee?.email,
  (value) => {
    emailForm.email = value || "";
  },
  { immediate: true },
);

const emailDisabled = computed(
  () => !emailForm.email || emailForm.email === (auth.employee?.email || ""),
);

const passwordStrength = computed(() => {
  const value = passwordForm.newPassword || "";
  let score = 0;
  if (value.length >= 8) score += 40;
  if (/[A-Z]/.test(value)) score += 15;
  if (/[a-z]/.test(value)) score += 15;
  if (/[0-9]/.test(value)) score += 15;
  if (/[^A-Za-z0-9]/.test(value)) score += 15;

  if (score >= 80) return { label: "Strong", percent: 100 };
  if (score >= 55) return { label: "Good", percent: 72 };
  if (score >= 35) return { label: "Fair", percent: 46 };
  return { label: "Weak", percent: 18 };
});

const passwordErrors = computed(() => ({
  newPassword:
    passwordForm.newPassword && passwordForm.newPassword.length < 8
      ? "New password must be at least 8 characters."
      : "",
}));

const showConfirmError = computed(
  () =>
    confirmTouched.value &&
    !!passwordForm.newPassword &&
    passwordForm.newPassword !== passwordForm.confirmPassword,
);

const passwordDisabled = computed(() => {
  const hasCurrent = passwordForm.currentPassword.trim().length > 0;
  const hasNew = passwordForm.newPassword.trim().length >= 8;
  const matches = passwordForm.newPassword === passwordForm.confirmPassword;
  return !hasCurrent || !hasNew || !matches;
});

const toggleVisibility = (field) => {
  visibility[field] = !visibility[field];
};

const resetPasswordState = () => {
  passwordForm.currentPassword = "";
  passwordForm.newPassword = "";
  passwordForm.confirmPassword = "";
  confirmTouched.value = false;
};

const submitEmail = async () => {
  emailLoading.value = true;
  emailMessage.value = "";
  emailTone.value = "";

  try {
    const response = await auth.updateProfile({ email: emailForm.email });
    emailForm.email =
      response.employee?.email || auth.employee?.email || emailForm.email;
    emailTone.value = "success";
    emailMessage.value = "Email updated successfully.";
    ui.pushToast("Email updated successfully");
  } catch (error) {
    emailTone.value = "error";
    emailMessage.value =
      error.response?.data?.message || "Unable to update email.";
  } finally {
    emailLoading.value = false;
  }
};

const submitPassword = async () => {
  passwordLoading.value = true;
  passwordMessage.value = "";
  passwordTone.value = "";

  try {
    await auth.updateProfile({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
      confirmPassword: passwordForm.confirmPassword,
    });
    passwordTone.value = "success";
    passwordMessage.value = "Password updated successfully.";
    ui.pushToast("Password updated successfully");
    resetPasswordState();
  } catch (error) {
    passwordTone.value = "error";
    passwordMessage.value =
      error.response?.data?.message || "Unable to update password.";
  } finally {
    passwordLoading.value = false;
  }
};
</script>
