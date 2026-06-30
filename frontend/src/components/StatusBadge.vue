<template>
  <span :class="['status-badge', variantClass]">
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  label: { type: String, default: "" },
  variant: { type: String, default: "neutral" },
});

const variantClass = computed(() => {
  const map = {
    green: "status-badge--green",
    red: "status-badge--red",
    blue: "status-badge--blue",
    amber: "status-badge--amber",
    neutral: "status-badge--neutral",
  };

  return map[props.variant] || map.neutral;
});
</script>
