<template>
  <section class="page-grid">
    <div class="page-header">
      <div>
        <p class="eyebrow">Finance Desk</p>
        <h2>Invoices</h2>
      </div>
      <div class="action-row">
        <button class="pill-btn" type="button" @click="refreshData">
          Refresh
        </button>
        <button
          v-if="selectedInvoice"
          class="primary-btn"
          type="button"
          @click="openPrintWindow(selectedInvoice)"
        >
          Print / Download PDF
        </button>
      </div>
    </div>

    <div class="panel-grid invoices-grid">
      <article class="panel panel--wide">
        <div class="panel__head"><h3>Create Invoice</h3></div>
        <form class="form-grid" @submit.prevent="generateInvoice">
          <label>
            Stay
            <select v-model="invoiceForm.stayId" required>
              <option value="">Select stay</option>
              <option
                v-for="stay in checkinStays"
                :key="stay._id"
                :value="stay._id"
              >
                {{ stay.customer?.fullName }} - Room {{ stay.room?.roomNumber }}
              </option>
            </select>
          </label>
          <label>
            Payment method
            <select v-model="invoiceForm.paymentMethod">
              <option>Cash</option>
              <option>Card</option>
              <option>Bank Transfer</option>
              <option>Mobile Money</option>
              <option>Other</option>
            </select>
          </label>
          <div class="full action-row">
            <button class="primary-btn">Generate Invoice</button>
          </div>
        </form>
      </article>

      <article class="panel panel--wide">
        <div class="panel__head"><h3>Invoice Register</h3></div>
        <DataTable>
          <template #default>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Guest</th>
                <th>Total</th>
                <th>Status</th>
                <th>Print</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="invoice in invoices" :key="invoice._id">
                <td>{{ invoice.invoiceNumber }}</td>
                <td>{{ invoice.customer?.fullName || "-" }}</td>
                <td>{{ formatCurrency(invoice.totalAmount) }}</td>
                <td>
                  <span
                    :class="
                      statusBadge(invoice.paymentStatus || invoice.paidStatus)
                    "
                  >
                    {{ paymentLabelFor(invoice) }}
                  </span>
                </td>
                <td>
                  <button
                    class="pill-btn"
                    type="button"
                    @click="
                      openPrintableInvoice(invoice);
                      openPrintWindow(invoice);
                    "
                  >
                    Print
                  </button>
                </td>
              </tr>
              <tr v-if="invoices.length === 0">
                <td colspan="5" class="empty-cell">No invoices yet.</td>
              </tr>
            </tbody>
          </template>
        </DataTable>
      </article>
    </div>

    <article v-if="selectedInvoice" class="panel invoice-print-layout">
      <div class="invoice-head invoice-receipt-head">
        <div>
          <p class="eyebrow">Hotel Aashirbad</p>
          <h3>Hotel Aashirbad and guest house</h3>
          <p class="subtle">Luxury Hospitality Invoice</p>
        </div>
        <div class="invoice-logo-block">
          <div class="login-logo invoice-logo-mark">H</div>
        </div>
        <div class="invoice-meta">
          <p><strong>Invoice:</strong> {{ selectedInvoice.invoiceNumber }}</p>
          <p>
            <strong>Date:</strong> {{ formatDate(selectedInvoice.createdAt) }}
          </p>
          <p>
            <strong>Status:</strong>
            <span :class="statusBadge(selectedPaymentStatus)">{{
              paymentLabelFor(selectedInvoice)
            }}</span>
          </p>
        </div>
      </div>

      <div class="invoice-parties">
        <div>
          <p class="eyebrow">Bill To</p>
          <p>
            <strong>{{ selectedInvoice.customer?.fullName || "Guest" }}</strong>
          </p>
          <p>{{ selectedInvoice.customer?.email || "No email" }}</p>
        </div>
        <div>
          <p class="eyebrow">Room</p>
          <p>
            <strong>{{ selectedInvoice.room?.roomNumber || "-" }}</strong>
          </p>
          <p>{{ selectedInvoice.room?.roomType || "Standard" }}</p>
        </div>
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Line Item</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Room Charges</td>
              <td>1</td>
              <td>{{ formatCurrency(selectedInvoice.roomCharges) }}</td>
              <td>{{ formatCurrency(selectedInvoice.roomCharges) }}</td>
            </tr>
            <tr>
              <td>Extra Charges</td>
              <td>1</td>
              <td>{{ formatCurrency(selectedInvoice.expenseTotal) }}</td>
              <td>{{ formatCurrency(selectedInvoice.expenseTotal) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="invoice-totals">
        <p>
          <span>Subtotal</span><strong>{{ formatCurrency(subtotal) }}</strong>
        </p>
        <p class="invoice-grand">
          <span>Grand Total</span
          ><strong>{{ formatCurrency(grandTotal) }}</strong>
        </p>
        <p>
          <span>Amount paid</span>
          <strong>
            {{
              formatCurrency(
                selectedInvoice.amountPaid || selectedInvoice.paidAmount || 0,
              )
            }}
          </strong>
        </p>
        <p>
          <span>{{ balanceLabel }}</span>
          <strong>{{ formatCurrency(balanceAmount) }}</strong>
        </p>
      </div>

      <div v-if="balanceAmount > 0" class="invoice-note invoice-note--warning">
        {{ balanceLabel }} pending: {{ formatCurrency(balanceAmount) }}
      </div>
      <div v-else class="invoice-note invoice-note--success">
        Payment complete.
      </div>

      <div class="action-row">
        <button
          class="pill-btn"
          type="button"
          @click="openPrintWindow(selectedInvoice)"
        >
          Print Layout
        </button>
      </div>
    </article>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import api from "../services/api";
import DataTable from "../components/DataTable.vue";
import { useUiStore } from "../stores/ui";
import { formatCurrency } from "../utils/format";

const ui = useUiStore();
const invoices = ref([]);
const stays = ref([]);
const invoiceForm = reactive({
  stayId: "",
  paymentMethod: "Cash",
});
const selectedInvoice = ref(null);

const formatDate = (value) => {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const loadInvoices = async () => {
  const { data } = await api.get("/billing");
  invoices.value = data.invoices || [];
  if (selectedInvoice.value) {
    selectedInvoice.value =
      invoices.value.find(
        (invoice) => invoice._id === selectedInvoice.value._id,
      ) || null;
  }
};

const loadStays = async () => {
  const { data } = await api.get("/stays");
  stays.value = data.stays || [];
};

const checkinStays = computed(() =>
  stays.value.filter((stay) => stay.stayStatus === "CheckedIn"),
);

const subtotal = computed(() =>
  Number(selectedInvoice.value?.totalAmount || 0),
);
const grandTotal = computed(() => subtotal.value);

const paymentLabelFor = (invoice) => {
  const status = String(
    invoice?.paymentStatus || invoice?.paidStatus || "unpaid",
  ).toLowerCase();
  if (status === "paid") return "Paid in Full";
  if (status === "partial") return "Partial Payment";
  return "Unpaid";
};

const selectedPaymentStatus = computed(() =>
  String(
    selectedInvoice.value?.paymentStatus ||
      selectedInvoice.value?.paidStatus ||
      "unpaid",
  ).toLowerCase(),
);

const balanceAmount = computed(() => {
  const paid = Number(
    selectedInvoice.value?.amountPaid || selectedInvoice.value?.paidAmount || 0,
  );
  if (paid > grandTotal.value) {
    return paid - grandTotal.value;
  }
  return Number(selectedInvoice.value?.remainingBalance || 0);
});

const balanceLabel = computed(() => {
  const paid = Number(
    selectedInvoice.value?.amountPaid || selectedInvoice.value?.paidAmount || 0,
  );
  return paid > grandTotal.value ? "Return" : "Remaining balance";
});

const statusBadge = (status) => {
  const normalized = String(status || "unpaid").toLowerCase();
  if (normalized === "paid") return "status-badge status-badge--green";
  if (normalized === "partial") return "status-badge status-badge--amber";
  return "status-badge status-badge--red";
};

const refreshData = async () => {
  await Promise.all([loadInvoices(), loadStays()]);
};

const generateInvoice = async () => {
  if (!invoiceForm.stayId) {
    ui.pushToast("Select a stay before generating invoice", "error");
    return;
  }
  try {
    await api.post("/billing/generate", invoiceForm);
    ui.pushToast("Invoice generated");
    await loadInvoices();
  } catch (error) {
    ui.pushToast(
      error.response?.data?.message || "Invoice generation failed",
      "error",
    );
  }
};

const openPrintableInvoice = async (invoice) => {
  try {
    const { data } = await api.get(`/billing/${invoice._id}`);
    selectedInvoice.value = data.invoice;
  } catch (error) {
    ui.pushToast(
      error.response?.data?.message || "Unable to open invoice",
      "error",
    );
  }
};

const normalizeInvoiceData = (invoice) => {
  if (!invoice) return null;

  const roomCharges = Number(invoice.roomCharges || 0);
  const extraCharges = Number(invoice.expenseTotal || 0);
  const subtotalValue = Number(
    invoice.totalAmount || roomCharges + extraCharges,
  );
  const vatValue = Number(invoice.vat || 0);
  const grandTotalValue = subtotalValue + vatValue;
  const amountPaidValue = Number(invoice.amountPaid || invoice.paidAmount || 0);

  return {
    invoiceNumber: invoice.invoiceNumber || "-",
    date: formatDate(invoice.createdAt || invoice.paidAt || invoice.updatedAt),
    paymentStatus: String(
      invoice.paymentStatus || invoice.paidStatus || "unpaid",
    ).toLowerCase(),
    guestName: invoice.customer?.fullName || invoice.guestName || "Guest",
    guestEmail: invoice.customer?.email || invoice.guestEmail || "",
    roomNumber: invoice.room?.roomNumber || invoice.roomNumber || "-",
    roomType: invoice.room?.roomType || invoice.roomType || "Standard",
    lineItems:
      invoice.lineItems?.length > 0
        ? invoice.lineItems.map((item) => ({
            name: item.name || "Item",
            description: item.description || "",
            qty: Number(item.qty || 0),
            rate: Number(item.rate || 0),
          }))
        : [
            {
              name: "Room charges",
              description: `${invoice.room?.roomType || invoice.roomType || "Room"} · Room ${invoice.room?.roomNumber || invoice.roomNumber || "-"}`,
              qty: 1,
              rate: roomCharges,
            },
            {
              name: "Extra charges",
              description: "Room service & miscellaneous",
              qty: 1,
              rate: extraCharges,
            },
          ],
    subtotal: subtotalValue,
    vat: vatValue,
    grandTotal: grandTotalValue,
    amountPaid: amountPaidValue,
  };
};

const buildPrintHTML = (invoice) => {
  const normalized = normalizeInvoiceData(invoice);
  if (!normalized) return "";

  const statusLabel =
    normalized.paymentStatus === "paid"
      ? "Paid in Full"
      : normalized.paymentStatus === "partial"
        ? "Partial Payment"
        : "Unpaid";

  const statusClass =
    normalized.paymentStatus === "paid"
      ? "badge-paid"
      : normalized.paymentStatus === "partial"
        ? "badge-partial"
        : "badge-unpaid";

  const returnAmount = Math.max(
    0,
    normalized.amountPaid - normalized.grandTotal,
  );
  const remainingAmount = Math.max(
    0,
    normalized.grandTotal - normalized.amountPaid,
  );
  const showReturn = normalized.amountPaid > normalized.grandTotal;
  const showRemaining = normalized.amountPaid < normalized.grandTotal;
  const noticeClass =
    normalized.paymentStatus === "paid"
      ? "success"
      : normalized.paymentStatus === "partial"
        ? "partial"
        : "unpaid";
  const noticeMessage =
    normalized.paymentStatus === "paid"
      ? `Payment complete. NPR ${normalized.amountPaid.toFixed(2)} received.${showReturn ? ` NPR ${returnAmount.toFixed(2)} to be returned to guest.` : ""}`
      : normalized.paymentStatus === "partial"
        ? `Partial payment received — NPR ${remainingAmount.toFixed(2)} still outstanding.`
        : `Payment pending — full amount of NPR ${normalized.grandTotal.toFixed(2)} is outstanding.`;

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Invoice ${normalized.invoiceNumber}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'DM Sans', sans-serif; background: #fff; color: #1A1814; padding: 40px; }
      .inv-head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #E8E6E0; }
      .hotel-name { font-family: 'DM Serif Display', serif; font-size: 22px; color: #1A1814; margin-bottom: 4px; }
      .hotel-sub { font-size: 12px; color: #A09D96; }
      .inv-meta { text-align: right; font-size: 12.5px; color: #6B6860; line-height: 1.8; }
      .inv-meta b { color: #1A1814; }
      .badge-paid { background: #EBF5EE; color: #1A5C3A; font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; border: 1px solid #C4DFCC; display: inline-block; }
      .badge-partial { background: #FDF3E0; color: #7A4F00; font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; border: 1px solid #F2DFBE; display: inline-block; }
      .badge-unpaid { background: #FBECEC; color: #8B2020; font-size: 11px; font-weight: 500; padding: 3px 10px; border-radius: 20px; border: 1px solid #EDCACA; display: inline-block; }
      .inv-bill { display: flex; justify-content: space-between; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #E8E6E0; }
      .bill-label { font-size: 10px; font-weight: 500; color: #A09D96; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 6px; }
      .bill-name { font-size: 15px; font-weight: 500; margin-bottom: 3px; }
      .bill-email { font-size: 12.5px; color: #A09D96; }
      .room-info { text-align: right; }
      .room-num { font-family: 'DM Serif Display', serif; font-size: 28px; line-height: 1; }
      .room-type { font-size: 12.5px; color: #A09D96; margin-top: 3px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
      thead tr { background: #F2F1ED; }
      th { font-size: 10.5px; font-weight: 500; color: #A09D96; letter-spacing: 0.09em; text-transform: uppercase; padding: 10px 14px; text-align: left; border-bottom: 1px solid #E8E6E0; }
      th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
      td { font-size: 13.5px; padding: 13px 14px; border-bottom: 1px solid #F2F1ED; vertical-align: middle; }
      td:nth-child(2), td:nth-child(3) { text-align: right; color: #6B6860; }
      td:nth-child(4) { text-align: right; font-weight: 500; }
      .td-desc { font-size: 11.5px; color: #A09D96; margin-top: 2px; }
      .totals { display: flex; justify-content: flex-end; margin-bottom: 20px; }
      .totals-box { width: 280px; }
      .tot-row { display: flex; justify-content: space-between; font-size: 13px; color: #6B6860; padding: 5px 0; }
      .tot-row span:last-child { font-weight: 500; color: #1A1814; }
      .tot-grand { display: flex; justify-content: space-between; font-size: 15px; font-weight: 500; color: #1A1814; border-top: 1.5px solid #3D3A30; padding-top: 10px; margin-top: 6px; }
      .tot-grand span:last-child { font-family: 'DM Serif Display', serif; font-size: 18px; }
      .tot-paid { display: flex; justify-content: space-between; font-size: 13px; padding: 5px 0; color: #1A5C3A; }
      .tot-paid span:last-child { font-weight: 500; }
      .tot-return { display: flex; justify-content: space-between; font-size: 13px; padding: 5px 0; color: #8B6914; }
      .tot-return span:last-child { font-weight: 500; }
      .tot-remaining { display: flex; justify-content: space-between; font-size: 13px; padding: 5px 0; color: #8B2020; }
      .tot-remaining span:last-child { font-weight: 500; }
      .notice { padding: 12px 16px; border-radius: 8px; font-size: 13px; margin-bottom: 20px; }
      .notice.success { background: #EBF5EE; border: 1px solid #C4DFCC; color: #1A5C3A; }
      .notice.partial { background: #FDF3E0; border: 1px solid #F2DFBE; color: #7A4F00; }
      .notice.unpaid { background: #FBECEC; border: 1px solid #EDCACA; color: #8B2020; }
      .footer { border-top: 1px solid #E8E6E0; padding-top: 14px; font-size: 12px; color: #A09D96; text-align: center; }
    </style>
  </head>
  <body>
    <div class="inv-head">
      <div>
        <div class="hotel-name">Hotel Aashirbad and guest house</div>
        <div class="hotel-sub">Luxury Hospitality Invoice</div>
      </div>
      <div class="inv-meta">
        <div><b>Invoice:</b> ${normalized.invoiceNumber}</div>
        <div><b>Date:</b> ${normalized.date}</div>
        <div><b>Status:</b> <span class="${statusClass}">${statusLabel}</span></div>
      </div>
    </div>

    <div class="inv-bill">
      <div>
        <div class="bill-label">Bill to</div>
        <div class="bill-name">${normalized.guestName}</div>
        <div class="bill-email">${normalized.guestEmail || "No email provided"}</div>
      </div>
      <div class="room-info">
        <div class="bill-label">Room</div>
        <div class="room-num">${normalized.roomNumber}</div>
        <div class="room-type">${normalized.roomType}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr><th>Line Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr>
      </thead>
      <tbody>
        ${normalized.lineItems
          .map(
            (item) => `
          <tr>
            <td>
              <div>${item.name}</div>
              <div class="td-desc">${item.description || ""}</div>
            </td>
            <td>${Number(item.qty || 0)}</td>
            <td>NPR ${Number(item.rate || 0).toFixed(2)}</td>
            <td>NPR ${(Number(item.qty || 0) * Number(item.rate || 0)).toFixed(2)}</td>
          </tr>`,
          )
          .join("")}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-box">
        <div class="tot-row"><span>Subtotal</span><span>NPR ${normalized.subtotal.toFixed(2)}</span></div>
        <div class="tot-row"><span>VAT (13%)</span><span>NPR ${normalized.vat.toFixed(2)}</span></div>
        <div style="height:1px;background:#E8E6E0;margin:8px 0;"></div>
        <div class="tot-grand"><span>Grand Total</span><span>NPR ${normalized.grandTotal.toFixed(2)}</span></div>
        <div style="height:1px;background:#E8E6E0;margin:8px 0;"></div>
        <div class="tot-paid"><span>Amount Paid</span><span>NPR ${normalized.amountPaid.toFixed(2)}</span></div>
        ${showReturn ? `<div class="tot-return"><span>Return to Guest</span><span>NPR ${returnAmount.toFixed(2)}</span></div>` : ""}
        ${showRemaining ? `<div class="tot-remaining"><span>Remaining Balance</span><span>NPR ${remainingAmount.toFixed(2)}</span></div>` : ""}
      </div>
    </div>

    <div class="notice ${noticeClass}">${noticeMessage}</div>
    <div class="footer">Thank you for staying at Hotel Aashirbad and Guest House.</div>
  </body>
</html>`;
};

const openPrintWindow = (invoice) => {
  const printData = normalizeInvoiceData(invoice);
  if (!printData) return;

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    ui.pushToast("Unable to open print window", "error");
    return;
  }

  win.document.write(buildPrintHTML(printData));
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
  };
};

const printSelectedInvoice = () => {
  openPrintWindow(selectedInvoice.value);
};

onMounted(refreshData);
</script>
