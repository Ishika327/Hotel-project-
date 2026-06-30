import { defineStore } from "pinia";
import api from "../services/api";

const employeeCacheKey = "hotel_employee";

const readEmployeeCache = () => {
  try {
    const raw = localStorage.getItem(employeeCacheKey);
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
};

const writeEmployeeCache = (employee) => {
  if (!employee) {
    localStorage.removeItem(employeeCacheKey);
    return;
  }

  localStorage.setItem(employeeCacheKey, JSON.stringify(employee));
};

export const useAuthStore = defineStore("auth", {
  state: () => ({
    employee: readEmployeeCache(),
    token: localStorage.getItem("hotel_token") || "",
    initialized: false,
    loading: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token && state.employee),
  },
  actions: {
    async bootstrap() {
      this.initialized = false;
      if (!this.token) {
        this.employee = null;
        writeEmployeeCache(null);
        this.initialized = true;
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        this.employee = data.employee;
        writeEmployeeCache(data.employee);
      } catch (error) {
        this.clearSession();
      } finally {
        this.initialized = true;
      }
    },
    async login(credentials) {
      this.loading = true;
      try {
        const { data } = await api.post("/auth/login", credentials);
        this.token = data.token;
        this.employee = data.employee;
        localStorage.setItem("hotel_token", data.token);
        writeEmployeeCache(data.employee);
        return data;
      } finally {
        this.loading = false;
      }
    },
    async updateProfile(payload) {
      const { data } = await api.put("/auth/update-profile", payload);
      if (data.employee) {
        this.employee = data.employee;
        writeEmployeeCache(data.employee);
      }
      return data;
    },
    async logout() {
      try {
        await api.post("/auth/logout");
      } finally {
        this.clearSession();
      }
    },
    clearSession() {
      this.token = "";
      this.employee = null;
      localStorage.removeItem("hotel_token");
      writeEmployeeCache(null);
    },
  },
});
