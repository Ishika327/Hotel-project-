<template>
  <section class="page-grid">
    <div class="page-header">
      <div>
        <p class="eyebrow">Guest Intelligence</p>
        <h2>Customer History</h2>
      </div>
    </div>

    <article class="panel">
      <form class="search-grid" @submit.prevent="searchHistory">
        <label
          ><span>Phone Number</span><input v-model="query.phoneNumber"
        /></label>
        <label><span>Name</span><input v-model="query.name" /></label>
        <label
          ><span>Room Number</span><input v-model="query.roomNumber"
        /></label>
        <button class="primary-btn">Search</button>
      </form>
    </article>

    <div class="panel-grid">
      <article class="panel panel--wide">
        <div class="panel__head"><h3>Profile</h3></div>
        <div v-if="result.customer">
          <p>
            <strong>{{ result.customer.fullName }}</strong>
          </p>
          <p>{{ result.customer.phoneNumber }}</p>
          <p>{{ result.customer.address }}</p>
          <p>Total Spending: {{ formatCurrency(result.totalSpending) }}</p>
          <p>Total Visits: {{ result.totalVisits }}</p>
        </div>
        <p v-else class="subtle">
          Search for a phone number, name, or room number.
        </p>
      </article>

      <article class="panel">
        <div class="panel__head"><h3>Previous Visits</h3></div>
        <div class="list-cards">
          <div v-for="stay in result.stays" :key="stay._id" class="list-card">
            <div>
              <strong>{{ stay.room?.roomNumber }}</strong>
              <p>{{ formatDate(stay.checkInDate) }}</p>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref } from "vue";
import api from "../services/api";
import { useUiStore } from "../stores/ui";
import { formatCurrency, formatDate } from "../utils/format";

const ui = useUiStore();
const query = reactive({ phoneNumber: "", name: "", roomNumber: "" });
const result = ref({
  stays: [],
  expenses: [],
  invoices: [],
  customer: null,
  totalSpending: 0,
  totalVisits: 0,
});

const searchHistory = async () => {
  try {
    const { data } = await api.get("/history/search", { params: query });
    result.value = data;
  } catch (error) {
    ui.pushToast(
      error.response?.data?.message || "History search failed",
      "error",
    );
  }
};
</script>
