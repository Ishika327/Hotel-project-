import { defineStore } from "pinia";

export const useUiStore = defineStore("ui", {
  state: () => ({
    theme: localStorage.getItem("hotel_theme") || "dark",
    toasts: [],
  }),
  actions: {
    initTheme() {
      document.documentElement.classList.toggle("dark", this.theme === "dark");
    },
    toggleTheme() {
      this.theme = this.theme === "dark" ? "light" : "dark";
      localStorage.setItem("hotel_theme", this.theme);
      document.documentElement.classList.toggle("dark", this.theme === "dark");
    },
    pushToast(message, type = "success") {
      const id = crypto.randomUUID();
      this.toasts.push({ id, message, type });
      window.setTimeout(() => this.removeToast(id), 3500);
    },
    removeToast(id) {
      this.toasts = this.toasts.filter((toast) => toast.id !== id);
    },
  },
});
