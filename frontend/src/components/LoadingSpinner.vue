<template>
  <div class="spinner-wrap">
    <div class="spinner"></div>
    <span>{{ label }}</span>
  </div>
</template>

<script setup>
defineProps({ label: { type: String, default: "Loading..." } });
</script>
