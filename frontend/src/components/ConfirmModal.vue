<template>
  <div class="modal-backdrop" @click.self="$emit('cancel')">
    <div class="modal-card modal-card--confirm">
      <div class="modal-card__head">
        <h3>{{ title }}</h3>
        <button class="icon-btn" type="button" @click="$emit('cancel')">
          ✕
        </button>
      </div>
      <p class="subtle">{{ message }}</p>
      <div class="modal-card__actions">
        <button
          class="pill-btn pill-btn--ghost"
          type="button"
          @click="$emit('cancel')"
        >
          Cancel
        </button>
        <button class="primary-btn" type="button" @click="$emit('confirm')">
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, default: "Confirm action" },
  message: { type: String, default: "Are you sure?" },
  confirmLabel: { type: String, default: "Confirm" },
});

defineEmits(["confirm", "cancel"]);
</script>
