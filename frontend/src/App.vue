<template>
  <div :class="['app-shell', ui.theme]">
    <router-view />
    <ToastStack />
  </div>
</template>

<script setup>
import { onMounted } from "vue";
import { useUiStore } from "./stores/ui";
import ToastStack from "./components/ToastStack.vue";

const ui = useUiStore();

onMounted(() => {
  ui.initTheme();
});
</script>
