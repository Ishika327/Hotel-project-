<template>
  <section class="stepper-card">
    <div class="stepper-card__steps">
      <button
        v-for="(step, index) in steps"
        :key="step"
        type="button"
        :class="[
          'stepper-dot',
          {
            'stepper-dot--active': index === modelValue,
            'stepper-dot--done': index < modelValue,
          },
        ]"
        @click="$emit('update:modelValue', index)"
      >
        <span>{{ index + 1 }}</span>
        <small>{{ step }}</small>
      </button>
    </div>

    <div class="stepper-card__content">
      <slot :step="modelValue" />
    </div>
  </section>
</template>

<script setup>
defineProps({
  steps: { type: Array, default: () => [] },
  modelValue: { type: Number, default: 0 },
});

defineEmits(["update:modelValue"]);
</script>
