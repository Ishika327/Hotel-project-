<template>
  <section class="page-grid">
    <div class="page-header">
      <div>
        <p class="eyebrow">Staff Access</p>
        <h2>Employees</h2>
      </div>
      <button class="pill-btn" @click="showModal = true">Add Employee</button>
    </div>

    <article class="panel">
      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Access Scope</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="employee in employees" :key="employee._id">
              <td>
                <strong>{{ employee.fullName }}</strong>
              </td>
              <td>{{ employee.email }}</td>
              <td>
                <span :class="roleBadge(employee.role)">
                  {{ employee.role === "admin" ? "Admin" : "Receptionist" }}
                </span>
              </td>
              <td>
                {{
                  employee.role === "admin"
                    ? "System-wide controls"
                    : "Front desk operations"
                }}
              </td>
            </tr>
            <tr v-if="employees.length === 0">
              <td colspan="4" class="empty-cell">No employees available.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>

    <BaseModal v-if="showModal" title="Add Employee" @close="showModal = false">
      <form class="form-grid" @submit.prevent="createEmployee">
        <label>
          Full Name
          <input v-model="form.fullName" required type="text" />
        </label>
        <label>
          Email
          <input v-model="form.email" required type="email" />
        </label>
        <label>
          Password
          <input
            v-model="form.password"
            required
            type="password"
            minlength="8"
          />
        </label>
        <label>
          Role
          <select v-model="form.role">
            <option value="admin">Admin</option>
            <option value="receptionist">Receptionist</option>
          </select>
        </label>
        <div class="full action-row">
          <button class="primary-btn" type="submit">Create Employee</button>
        </div>
      </form>
    </BaseModal>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import api from "../services/api";
import BaseModal from "../components/BaseModal.vue";
import { useUiStore } from "../stores/ui";

const ui = useUiStore();
const employees = ref([]);
const showModal = ref(false);
const form = reactive({
  fullName: "",
  email: "",
  password: "",
  role: "receptionist",
});

const loadEmployees = async () => {
  const { data } = await api.get("/employees");
  employees.value = data.employees || [];
};

const createEmployee = async () => {
  try {
    await api.post("/employees", form);
    ui.pushToast("Employee created");
    showModal.value = false;
    Object.assign(form, {
      fullName: "",
      email: "",
      password: "",
      role: "receptionist",
    });
    await loadEmployees();
  } catch (error) {
    ui.pushToast(
      error.response?.data?.message || "Employee creation failed",
      "error",
    );
  }
};

const roleBadge = (role) => {
  if (role === "admin") return "status-badge status-badge--amber";
  return "status-badge status-badge--blue";
};

onMounted(loadEmployees);
</script>
