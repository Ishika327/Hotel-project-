<template>
  <article class="stat-card">
    <p>{{ label }}</p>
    <strong>{{ value }}</strong>
    <span>{{ hint }}</span>
  </article>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number],
  hint: { type: String, default: "" },
});
</script>
