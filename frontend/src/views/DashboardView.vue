<template>
  <section class="page-grid">
    <div class="page-header">
      <div>
        <p class="eyebrow">Operations Snapshot</p>
        <h2>Dashboard</h2>
      </div>
    </div>

    <div class="stat-grid">
      <KpiCard
        label="Total Rooms"
        :value="totalRooms"
        hint="Inventory in service"
        trend="+2 this month"
        trend-tone="positive"
      >
        <template #icon>◫</template>
      </KpiCard>
      <KpiCard
        label="Occupied"
        :value="summary.occupiedRooms"
        hint="Rooms currently in use"
        trend="+4%"
        trend-tone="positive"
      >
        <template #icon>▣</template>
      </KpiCard>
      <KpiCard
        label="Available"
        :value="summary.availableRooms"
        hint="Open for check-in"
        trend="-1%"
        trend-tone="negative"
      >
        <template #icon>□</template>
      </KpiCard>
      <KpiCard
        label="Today's Revenue"
        :value="formatCurrency(metrics.revenue)"
        hint="Paid invoices total"
        trend="Stable"
        trend-tone="neutral"
      >
        <template #icon>₹</template>
      </KpiCard>
    </div>

    <div class="quick-actions">
      <RouterLink class="primary-btn quick-action-btn" to="/stays"
        >New Check-In</RouterLink
      >
      <RouterLink class="pill-btn quick-action-btn" to="/stays"
        >New Check-Out</RouterLink
      >
      <RouterLink class="pill-btn quick-action-btn" to="/customers"
        >Add Customer</RouterLink
      >
      <RouterLink class="pill-btn quick-action-btn" to="/rooms"
        >Add Room</RouterLink
      >
    </div>

    <div class="panel-grid dashboard-grid">
      <article class="panel panel--wide room-status-panel">
        <div class="panel__head">
          <h3>Occupancy Overview</h3>
          <span class="status-badge status-badge--amber"
            >{{ metrics.occupancy }}%</span
          >
        </div>
        <div v-if="loading" class="panel-state">
          <LoadingSpinner />
        </div>
        <div v-else class="bar-chart-stack">
          <div
            v-for="item in occupancyRows"
            :key="item.label"
            class="bar-chart-row"
          >
            <p>{{ item.label }}</p>
            <div class="bar-track">
              <div
                class="bar-fill bar-fill--gold"
                :style="{ width: `${item.percent}%` }"
              ></div>
            </div>
            <strong>{{ item.count }}</strong>
          </div>
          <svg
            class="occupancy-chart"
            viewBox="0 0 240 240"
            role="img"
            aria-label="Occupancy chart"
          >
            <circle cx="120" cy="120" r="86" class="donut-track"></circle>
            <circle
              cx="120"
              cy="120"
              r="86"
              class="donut-fill"
              :stroke-dasharray="donutDasharray"
              :stroke-dashoffset="donutOffset"
            ></circle>
            <text x="120" y="114" text-anchor="middle" class="donut-label">
              {{ metrics.occupancy }}%
            </text>
            <text x="120" y="140" text-anchor="middle" class="donut-subtitle">
              Occupied
            </text>
          </svg>
        </div>
      </article>

      <article class="panel panel--wide activity-feed-panel">
        <div class="panel__head">
          <h3>Live Activity Feed</h3>
          <span class="subtle">Recent events</span>
        </div>
        <div class="timeline activity-feed">
          <div
            v-for="item in activityFeed"
            :key="item.id"
            class="timeline-item activity-row"
          >
            <span class="timeline-dot"></span>
            <div>
              <strong>{{ item.title }}</strong>
              <p class="subtle">{{ item.description }}</p>
            </div>
            <span class="subtle">{{ formatDate(item.time) }}</span>
          </div>
          <p v-if="activityFeed.length === 0" class="subtle">
            No recent activity.
          </p>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
import api from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner.vue";
import KpiCard from "../components/KpiCard.vue";
import { formatCurrency, formatDate } from "../utils/format";

const loading = ref(false);
const summary = reactive({
  totalEarnings: 0,
  occupiedRooms: 0,
  availableRooms: 0,
  activeCheckIns: 0,
});
const rooms = ref([]);
const stays = ref([]);
const invoices = ref([]);

const totalRooms = computed(
  () => summary.occupiedRooms + summary.availableRooms,
);

const metrics = computed(() => {
  const totalRooms = summary.occupiedRooms + summary.availableRooms;
  const checkedOut = stays.value.filter(
    (stay) => stay.stayStatus === "CheckedOut",
  ).length;
  return {
    revenue: summary.totalEarnings,
    occupancy: totalRooms
      ? Math.round((summary.occupiedRooms / totalRooms) * 100)
      : 0,
    checkIns: summary.activeCheckIns,
    checkOuts: checkedOut,
  };
});

const activityFeed = computed(() => {
  const stayEvents = stays.value.slice(0, 6).map((stay) => ({
    id: `stay-${stay._id}`,
    title:
      stay.stayStatus === "CheckedOut"
        ? "Check-out completed"
        : "Check-in active",
    description: `${stay.customer?.fullName || "Guest"} • Room ${stay.room?.roomNumber || "-"}`,
    time: stay.actualCheckOutAt || stay.createdAt,
  }));

  const invoiceEvents = invoices.value.slice(0, 6).map((invoice) => ({
    id: `invoice-${invoice._id}`,
    title: "Invoice generated",
    description: `${invoice.invoiceNumber} • ${formatCurrency(invoice.totalAmount)}`,
    time: invoice.createdAt,
  }));

  return [...stayEvents, ...invoiceEvents]
    .sort((a, b) => new Date(b.time) - new Date(a.time))
    .slice(0, 10);
});

const badgeClass = (status) => {
  if (status === "Available") return "status-badge status-badge--green";
  if (status === "Occupied") return "status-badge status-badge--red";
  if (status === "Cleaning") return "status-badge status-badge--blue";
  return "status-badge status-badge--amber";
};

const occupancyRows = computed(() => {
  const total = totalRooms.value || 1;
  const available = summary.availableRooms || 0;
  const occupied = summary.occupiedRooms || 0;
  const maintenance = rooms.value.filter(
    (room) => String(room.status || "").toLowerCase() === "cleaning",
  ).length;

  return [
    {
      label: "Occupied rooms",
      count: occupied,
      percent: Math.round((occupied / total) * 100),
    },
    {
      label: "Available rooms",
      count: available,
      percent: Math.round((available / total) * 100),
    },
    {
      label: "Maintenance",
      count: maintenance,
      percent: Math.max(5, Math.round((maintenance / total) * 100)),
    },
  ];
});

const donutDasharray = computed(() => {
  const radius = 86;
  const circumference = 2 * Math.PI * radius;
  const percentage = metrics.value.occupancy / 100;
  return `${circumference * percentage} ${circumference}`;
});

const donutOffset = computed(() => {
  const radius = 86;
  const circumference = 2 * Math.PI * radius;
  return circumference * 0.25;
});

const loadData = async () => {
  loading.value = true;
  try {
    const [dashboardRes, roomRes, stayRes, invoiceRes] = await Promise.all([
      api.get("/dashboard/summary"),
      api.get("/rooms"),
      api.get("/stays"),
      api.get("/billing"),
    ]);

    Object.assign(summary, dashboardRes.data.summary || {});
    rooms.value = roomRes.data.rooms || [];
    stays.value = stayRes.data.stays || [];
    invoices.value = invoiceRes.data.invoices || [];
  } finally {
    loading.value = false;
  }
};

onMounted(loadData);
</script>
