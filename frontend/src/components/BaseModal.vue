<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal-card">
      <div class="modal-card__head">
        <h3>{{ title }}</h3>
        <button class="icon-btn" @click="$emit('close')">✕</button>
      </div>
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({ title: String });
defineEmits(["close"]);
</script>
