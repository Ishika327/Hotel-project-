<template>
  <article class="kpi-card">
    <div class="kpi-card__head">
      <div class="kpi-card__icon">
        <slot name="icon" />
      </div>
      <span :class="['trend-chip', trendClass]">{{ trend }}</span>
    </div>
    <strong class="kpi-card__value">{{ value }}</strong>
    <p class="kpi-card__label">{{ label }}</p>
    <p class="kpi-card__hint">{{ hint }}</p>
  </article>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  label: String,
  value: [String, Number],
  hint: { type: String, default: "" },
  trend: { type: String, default: "Stable" },
  trendTone: { type: String, default: "neutral" },
});

const trendClass = computed(() => `trend-chip--${props.trendTone}`);
</script>
