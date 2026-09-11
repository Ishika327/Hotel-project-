<template>
  <section class="page-grid">
    <div class="page-header">
      <div>
        <p class="eyebrow">Performance Intelligence</p>
        <h2>Reports</h2>
      </div>
    </div>

    <div class="report-toolbar">
      <div class="report-tabs">
        <button
          v-for="mode in reportModes"
          :key="mode.value"
          type="button"
          class="report-tab"
          :class="{ 'report-tab--active': reportMode === mode.value }"
          @click="reportMode = mode.value"
        >
          {{ mode.label }}
        </button>
      </div>
      <div class="inline-stats">
        <label>
          Start date
          <NepaliDatePicker
            v-model="dateRange.start"
            placeholder="मिति छान्नुहोस्"
          />
        </label>
        <label>
          End date
          <NepaliDatePicker
            v-model="dateRange.end"
            placeholder="मिति छान्नुहोस्"
          />
        </label>
      </div>
    </div>

    <div class="panel-grid reports-grid">
      <article class="panel panel--wide report-panel--main">
        <div class="panel__head">
          <h3>Revenue</h3>
          <StatusBadge :label="reportMode || 'Select mode'" variant="amber" />
        </div>
        <p class="summary-caption">{{ reportSubtitle }}</p>
        <label class="report-search">
          <span>Search by day, month, or year</span>
          <input
            v-model="reportSearch"
            type="text"
            placeholder="Example: 29 May 2026 or May 2026 or 2026"
          />
        </label>

        <div class="summary-grid summary-grid--single">
          <div class="summary-card summary-card--highlight">
            <span>{{ reportTotalLabel }}</span>
            <strong>{{ formatCurrency(reportTotal) }}</strong>
          </div>
        </div>

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ reportTableHeading }}</th>
                <th>Income</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in filteredReportRows" :key="row.key">
                <td>{{ row.label }}</td>
                <td>{{ formatCurrency(row.total) }}</td>
              </tr>
              <tr v-if="filteredReportRows.length === 0">
                <td colspan="2" class="empty-cell">No income data yet.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="panel panel--wide report-panel--main">
        <div class="panel__head"><h3>Occupancy</h3></div>
        <div class="occupancy-donut">
          <svg
            viewBox="0 0 160 160"
            role="img"
            aria-label="Occupancy donut chart"
          >
            <circle cx="80" cy="80" r="54" class="donut-track"></circle>
            <circle
              cx="80"
              cy="80"
              r="54"
              class="donut-segment donut-segment--occupied"
              :stroke-dasharray="occupiedCircumference"
              :stroke-dashoffset="occupiedOffset"
            ></circle>
            <circle
              cx="80"
              cy="80"
              r="54"
              class="donut-segment donut-segment--available"
              :stroke-dasharray="availableCircumference"
              :stroke-dashoffset="availableOffset"
            ></circle>
          </svg>
          <div class="occupancy-donut__label">
            <strong>{{ occupancy.occupancyRate }}%</strong>
            <span class="subtle">Occupied</span>
          </div>
        </div>
        <div class="chart-legend">
          <span><i class="legend legend--gold"></i>Occupied</span>
          <span><i class="legend legend--blue"></i>Available</span>
        </div>
      </article>

      <article class="panel panel--wide report-panel--rooms">
        <div class="panel__head"><h3>Top-Performing Rooms</h3></div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Invoices</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="room in topRooms" :key="room.roomId">
                <td>{{ room.roomNumber }}</td>
                <td>{{ room.invoiceCount }}</td>
                <td>{{ formatCurrency(room.revenue) }}</td>
              </tr>
              <tr v-if="topRooms.length === 0">
                <td colspan="3" class="empty-cell">
                  No room performance data yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import api from "../services/api";
import NepaliDate from "nepali-date-converter";
import StatusBadge from "../components/StatusBadge.vue";
import NepaliDatePicker from "../components/NepaliDatePicker.vue";
import { useUiStore } from "../stores/ui";
import { formatCurrency } from "../utils/format";

const ui = useUiStore();
const occupancy = reactive({
  totalRooms: 0,
  occupied: 0,
  available: 0,
  occupancyRate: 0,
  activeStays: [],
});
const invoices = ref([]);
const reportMode = ref("");
const reportSearch = ref("");
const dateRange = reactive({ start: "", end: "" });
const reportModes = [
  { label: "Daily", value: "daily" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

const reportAnchorDate = new Date();

const pad2 = (value) => String(value).padStart(2, "0");

const normalizeSearchText = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[,/\-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const matchesSearch = (candidate, queryTokens) => {
  const candidateTokens = normalizeSearchText(candidate).split(" ");
  return queryTokens.every((token) =>
    candidateTokens.some((candidateToken) => candidateToken.startsWith(token)),
  );
};

const invoicePaidDate = (invoice) =>
  invoice?.paidAt ? new Date(invoice.paidAt) : null;

const bsYearFor = (date) => {
  try {
    return new NepaliDate(date).format("YYYY", "en");
  } catch {
    return String(date.getFullYear());
  }
};

const formatReportDate = (date) => {
  try {
    return new NepaliDate(date).format("MMMM DD, YYYY", "en");
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  }
};

const formatReportMonth = (year, monthIndex) => {
  const adDate = new Date(year, monthIndex, 1);
  try {
    return new NepaliDate(adDate).format("MMMM YYYY", "en");
  } catch {
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
    }).format(adDate);
  }
};

const reportPaidInvoices = computed(() =>
  invoices.value.filter(
    (invoice) =>
      String(
        invoice.paymentStatus || invoice.paidStatus || "",
      ).toLowerCase() === "paid" && invoice.paidAt,
  ),
);

const filteredPaidInvoices = computed(() => {
  const start = dateRange.start
    ? new Date(`${dateRange.start}T00:00:00`)
    : null;
  const end = dateRange.end ? new Date(`${dateRange.end}T23:59:59`) : null;
  return reportPaidInvoices.value.filter((invoice) => {
    const paidDate = invoicePaidDate(invoice);
    if (!paidDate) return false;
    if (start && paidDate < start) return false;
    if (end && paidDate > end) return false;
    return true;
  });
});

const reportRows = computed(() => {
  const paidInvoices = filteredPaidInvoices.value;
  const anchorYear = reportAnchorDate.getFullYear();
  const anchorMonth = reportAnchorDate.getMonth();

  if (reportMode.value === "daily") {
    const totals = paidInvoices.reduce((acc, invoice) => {
      const paidDate = invoicePaidDate(invoice);
      if (!paidDate) return acc;
      if (
        paidDate.getFullYear() !== anchorYear ||
        paidDate.getMonth() !== anchorMonth
      ) {
        return acc;
      }
      const key = `${paidDate.getFullYear()}-${pad2(paidDate.getMonth() + 1)}-${pad2(paidDate.getDate())}`;
      acc[key] = (acc[key] || 0) + Number(invoice.totalAmount || 0);
      return acc;
    }, {});

    return Object.keys(totals)
      .sort()
      .map((key) => ({
        key,
        label: formatReportDate(new Date(`${key}T00:00:00`)),
        total: totals[key],
      }));
  }

  if (reportMode.value === "monthly") {
    const totals = paidInvoices.reduce((acc, invoice) => {
      const paidDate = invoicePaidDate(invoice);
      if (!paidDate || paidDate.getFullYear() !== anchorYear) return acc;
      const key = `${paidDate.getFullYear()}-${pad2(paidDate.getMonth() + 1)}`;
      acc[key] = (acc[key] || 0) + Number(invoice.totalAmount || 0);
      return acc;
    }, {});

    return Object.keys(totals)
      .sort()
      .map((key) => {
        const [, month] = key.split("-");
        return {
          key,
          label: formatReportMonth(anchorYear, Number(month) - 1),
          total: totals[key],
        };
      });
  }

  const totals = paidInvoices.reduce((acc, invoice) => {
    const paidDate = invoicePaidDate(invoice);
    if (!paidDate) return acc;
    const key = bsYearFor(paidDate);
    acc[key] = (acc[key] || 0) + Number(invoice.totalAmount || 0);
    return acc;
  }, {});

  const years = Object.keys(totals).sort((a, b) => Number(a) - Number(b));

  return years.map((year) => ({
    key: year,
    label: year,
    total: totals[year] || 0,
  }));
});

const filteredReportRows = computed(() => {
  const queryTokens = normalizeSearchText(reportSearch.value)
    .split(" ")
    .filter(Boolean);
  if (!queryTokens.length) return reportRows.value;

  return reportRows.value.filter((row) => {
    return matchesSearch(`${row.label} ${row.key} ${row.total}`, queryTokens);
  });
});

const reportTotal = computed(() =>
  reportRows.value.reduce((sum, row) => sum + Number(row.total || 0), 0),
);

const reportTotalLabel = computed(() => {
  if (reportMode.value === "daily") return "Monthly Income";
  if (reportMode.value === "monthly") return "Yearly Income";
  return "All-Year Income";
});

const reportSubtitle = computed(() => {
  const year = reportAnchorDate.getFullYear();
  if (reportMode.value === "daily") {
    return `Daily income for ${formatReportMonth(year, reportAnchorDate.getMonth())}`;
  }
  if (reportMode.value === "monthly") {
    return `Monthly income for ${year}`;
  }
  return "Yearly income by year";
});

const reportTableHeading = computed(() => {
  if (reportMode.value === "daily") return "Date";
  if (reportMode.value === "monthly") return "Month";
  return "Year";
});

const topRooms = computed(() => {
  const byRoom = filteredPaidInvoices.value.reduce((acc, invoice) => {
    const roomId = invoice.room?._id;
    if (!roomId) return acc;
    if (!acc[roomId]) {
      acc[roomId] = {
        roomId,
        roomNumber: invoice.room?.roomNumber || "-",
        invoiceCount: 0,
        revenue: 0,
      };
    }
    acc[roomId].invoiceCount += 1;
    acc[roomId].revenue += Number(invoice.totalAmount || 0);
    return acc;
  }, {});

  return Object.values(byRoom)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);
});

const chartValues = computed(() => {
  const guestVolume = occupancy.activeStays?.length || 0;
  const revenueScale = Math.min(100, Math.round(reportTotal.value / 1000));
  const guestScale = Math.min(100, guestVolume * 10);
  return {
    revenue: revenueScale,
    occupancy: occupancy.occupancyRate,
    guests: guestScale,
  };
});

const barStyle = (value, max) => ({
  width: `${Math.max(5, Math.min(max, value))}%`,
});

const occupiedCircumference = computed(() => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const total = Math.max(1, occupancy.totalRooms || 0);
  return `${circumference * (occupancy.occupied / total)} ${circumference}`;
});

const availableCircumference = computed(() => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const total = Math.max(1, occupancy.totalRooms || 0);
  return `${circumference * (occupancy.available / total)} ${circumference}`;
});

const occupiedOffset = computed(() => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  return circumference * 0.25;
});

const availableOffset = computed(() => {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const total = Math.max(1, occupancy.totalRooms || 0);
  return circumference * 0.25 - circumference * (occupancy.occupied / total);
});

const exportCsv = () => {
  const rows = [
    [reportTableHeading.value, "Income"],
    ...filteredReportRows.value.map((row) => [row.label, row.total]),
  ];
  const csv = rows
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "hotel-reports.csv";
  link.click();
  URL.revokeObjectURL(url);
};

const loadReports = async () => {
  try {
    const [occupancyResponse, invoiceResponse] = await Promise.all([
      api.get("/reports/occupancy"),
      api.get("/billing"),
    ]);
    Object.assign(occupancy, occupancyResponse.data);
    invoices.value = invoiceResponse.data.invoices || [];
  } catch (error) {
    ui.pushToast(
      error.response?.data?.message || "Unable to load reports",
      "error",
    );
  }
};

onMounted(loadReports);
</script>

<style scoped>
.report-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding: 14px 16px;
}

.report-tab {
  padding: 8px 14px;
  font-size: 0.85rem;
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid var(--panel-border);
  color: var(--muted);
}

.report-tab--active {
  background: linear-gradient(135deg, var(--gold), var(--gold-soft));
  color: #26190a;
  font-weight: 700;
  border-color: transparent;
}

.inline-stats {
  gap: 12px;
}

.inline-stats label {
  gap: 4px;
  font-size: 0.8rem;
  color: var(--muted);
  font-weight: 500;
}

.inline-stats input {
  width: 160px;
  height: 38px;
  padding: 7px 10px;
  font-size: 0.86rem;
}

.report-panel--main {
  min-height: 0;
}

.panel__head {
  margin-bottom: 6px;
}

.summary-caption {
  margin: 4px 0 14px;
  font-size: 0.88rem;
}

.report-search {
  display: grid;
  gap: 6px;
  margin-bottom: 16px;
}

.report-search span {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--text);
}

.report-search input {
  height: 40px;
}

.summary-grid--single {
  margin-bottom: 16px;
}

.summary-card--highlight {
  max-width: 100%;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(185, 134, 63, 0.08);
  border: 1px solid rgba(185, 134, 63, 0.2);
}

.summary-card--highlight span {
  font-size: 0.85rem;
  color: var(--muted);
  font-weight: 500;
}

.summary-card--highlight strong {
  font-family: var(--font-mono);
  font-size: 1.15rem;
}

.table-wrap {
  border-top: 1px solid var(--panel-border);
  margin-top: 4px;
}

.occupancy-donut {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 220px;
  margin: 16px auto;
}

.report-panel--main:has(.occupancy-donut) {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.report-panel--main:has(.occupancy-donut) .panel__head {
  width: 100%;
}

.occupancy-donut__label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  justify-items: center;
}

.occupancy-donut__label strong {
  font-size: 1.6rem;
  font-family: var(--font-mono);
}

.occupancy-donut__label .subtle {
  font-size: 0.82rem;
}

.chart-legend {
  width: 100%;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--panel-border);
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
