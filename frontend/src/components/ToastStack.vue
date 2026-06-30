<template>
  <div class="toast-stack">
    <div
      v-for="toast in ui.toasts"
      :key="toast.id"
      :class="['toast', `toast--${toast.type}`]"
    >
      {{ toast.message }}
    </div>
  </div>
</template>

<script setup>
import { useUiStore } from "../stores/ui";

const ui = useUiStore();
</script>
