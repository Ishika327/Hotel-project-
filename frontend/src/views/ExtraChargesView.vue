<template>
  <section class="page-grid">
    <div class="page-header">
      <div>
        <p class="eyebrow">Service Desk</p>
        <h2>Extra Charges</h2>
      </div>
      <button class="pill-btn" @click="refreshData">Refresh</button>
    </div>

    <div class="panel-grid">
      <article class="panel panel--wide">
        <div class="panel__head"><h3>Find Stay</h3></div>
        <div class="form-grid">
          <label
            ><span>Customer Name</span
            ><input v-model="staySearch.name" placeholder="Type customer name"
          /></label>
          <label
            ><span>Room Number</span
            ><input v-model="staySearch.room" placeholder="Type room number"
          /></label>
          <label class="full"
            ><span>Stay (Customer - Room)</span
            ><select v-model="selectedStayId">
              <option value="">Select stay</option>
              <option v-if="filteredStays.length === 0" disabled>
                No stays found
              </option>
              <option
                v-for="stay in filteredStays"
                :key="stay._id"
                :value="stay._id"
              >
                {{ stay.customer?.fullName }} - {{ stay.room?.roomNumber }} ({{
                  stay.stayStatus
                }})
              </option>
            </select>
          </label>
        </div>

        <div class="panel__head"><h3>Add Charge</h3></div>
        <form class="form-grid" @submit.prevent="addExpense">
          <label>
            <span>Type</span>
            <select v-model="expenseForm.expenseType">
              <option>Food</option>
              <option>Drinks</option>
              <option>Room Service</option>
              <option>Laundry</option>
              <option>Other</option>
            </select>
          </label>
          <label v-if="isMenuType">
            <span>Description</span>
            <div class="action-row">
              <input :value="menuSummary" placeholder="Select items" readonly />
              <button class="pill-btn" type="button" @click="openMenuPicker">
                Choose
              </button>
            </div>
          </label>
          <label v-else>
            <span>Description</span>
            <select v-model="expenseForm.itemKey">
              <option
                v-for="item in expenseItemOptions"
                :key="item.key"
                :value="item.key"
              >
                {{ item.label }} - {{ formatCurrency(item.price) }}
              </option>
            </select>
          </label>
          <label v-if="!isMenuType"
            ><span>Quantity</span
            ><input v-model.number="expenseForm.quantity" type="number" min="1"
          /></label>
          <label v-if="!isMenuType"
            ><span>Price</span
            ><input :value="formatCurrency(selectedExpensePrice)" disabled
          /></label>
          <label v-else
            ><span>Selected Total</span
            ><input :value="formatCurrency(menuSubtotal)" disabled
          /></label>
          <div class="full action-row">
            <button class="primary-btn" type="submit">Add Charge</button>
          </div>
        </form>
      </article>

      <article class="panel">
        <div class="panel__head"><h3>Cart</h3></div>
        <div class="stack">
          <div v-if="cartItems.length === 0" class="subtle">
            No items selected
          </div>
          <div v-for="item in cartItems" :key="item.key" class="cart-row">
            <div>
              <strong>{{ item.label }}</strong>
              <p class="subtle">
                {{ formatCurrency(item.price) }} x {{ item.qty }}
              </p>
            </div>
            <div class="cart-actions">
              <button class="pill-btn" type="button" @click="decQty(item.key)">
                -
              </button>
              <span class="cart-qty">{{ item.qty }}</span>
              <button class="pill-btn" type="button" @click="incQty(item.key)">
                +
              </button>
              <span class="cart-price">{{ formatCurrency(item.total) }}</span>
            </div>
          </div>
          <div class="action-row" v-if="cartItems.length">
            <strong>Subtotal: {{ formatCurrency(menuSubtotal) }}</strong>
            <button class="primary-btn" @click="addExpense">Checkout</button>
          </div>
        </div>

        <div class="panel__head"><h3>Totals</h3></div>
        <div class="stack">
          <p>
            Room Charges:
            <strong>{{ formatCurrency(stayCharges.roomCharges) }}</strong>
          </p>
          <p>
            Extra Charges:
            <strong>{{ formatCurrency(stayCharges.expenseTotal) }}</strong>
          </p>
          <p>
            Total Amount:
            <strong>{{ formatCurrency(stayCharges.totalAmount) }}</strong>
          </p>
        </div>

        <div class="panel__head"><h3>Charges</h3></div>
        <div class="list-cards">
          <div v-for="expense in expenses" :key="expense._id" class="list-card">
            <div>
              <strong>{{ expense.expenseType }}</strong>
              <p>{{ expense.description || "Charge" }}</p>
            </div>
            <span>{{ formatCurrency(expense.total) }}</span>
          </div>
        </div>
      </article>
    </div>
  </section>

  <div
    v-if="menuPickerOpen"
    class="modal-backdrop"
    @click.self="menuPickerOpen = false"
  >
    <div class="modal-card">
      <div class="modal-card__head">
        <h3>{{ expenseForm.expenseType }} Menu</h3>
        <button class="icon-btn" type="button" @click="menuPickerOpen = false">
          ✕
        </button>
      </div>
      <div class="menu-grid">
        <div
          v-for="item in expenseItemOptions"
          :key="item.key"
          class="menu-row"
        >
          <div>
            <strong>{{ item.label }}</strong>
            <p class="subtle">{{ formatCurrency(item.price) }}</p>
          </div>
          <input
            v-model.number="menuQuantities[item.key]"
            class="menu-qty"
            type="number"
            min="0"
          />
        </div>
      </div>
      <div class="action-row">
        <span class="subtle">Selected: {{ menuSummary || "None" }}</span>
        <button class="pill-btn" type="button" @click="menuPickerOpen = false">
          Done
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import api from "../services/api";
import { useUiStore } from "../stores/ui";
import { formatCurrency } from "../utils/format";

const ui = useUiStore();
const stays = ref([]);
const expenses = ref([]);
const stayDetails = ref(null);
const staySearch = reactive({ name: "", room: "" });
const stayCharges = reactive({
  roomCharges: 0,
  expenseTotal: 0,
  totalAmount: 0,
});
const selectedStayId = ref("");
const menuPickerOpen = ref(false);
const menuQuantities = reactive({});
const expenseForm = reactive({
  expenseType: "Food",
  itemKey: "",
  quantity: 1,
});

const menuOptions = {
  Food: [
    { key: "Breakfast_Pancake", label: "Pancake", price: 250 },
    { key: "Breakfast_Omelette", label: "Omelette", price: 220 },
    { key: "Breakfast_Paratha", label: "Paratha", price: 180 },
    { key: "Breakfast_Porridge", label: "Porridge", price: 160 },
    { key: "Lunch_SetMeal", label: "Set Meal", price: 650 },
    { key: "Lunch_RiceCurry", label: "Rice & Curry", price: 550 },
    { key: "Dinner_Thali", label: "Dinner Thali", price: 750 },
    { key: "Dinner_Noodles", label: "Noodles", price: 420 },
  ],
  Drinks: [
    { key: "Water", label: "Water", price: 40 },
    { key: "Tea", label: "Tea", price: 80 },
    { key: "Coffee", label: "Coffee", price: 120 },
    { key: "SoftDrink", label: "Soft Drink", price: 150 },
    { key: "Juice", label: "Juice", price: 180 },
  ],
  "Room Service": [
    { key: "Standard", label: "Standard Service", price: 200 },
    { key: "LateCheckout", label: "Late Checkout", price: 500 },
  ],
  Laundry: [
    { key: "Laundry", label: "Laundry (Per Item)", price: 120 },
    { key: "DryClean", label: "Dry Clean", price: 250 },
  ],
  Other: [{ key: "Misc", label: "Miscellaneous", price: 150 }],
};

const expenseItemOptions = computed(
  () => menuOptions[expenseForm.expenseType] || [],
);

const isMenuType = computed(() =>
  ["Food", "Drinks"].includes(expenseForm.expenseType),
);

const selectedExpenseItem = computed(() => {
  const options = expenseItemOptions.value;
  return options.find((item) => item.key === expenseForm.itemKey) || options[0];
});

const selectedExpensePrice = computed(
  () => selectedExpenseItem.value?.price || 0,
);

const selectedMenuItems = computed(() =>
  expenseItemOptions.value.filter(
    (item) => (menuQuantities[item.key] || 0) > 0,
  ),
);

const menuSummary = computed(() =>
  selectedMenuItems.value
    .map((item) => `${item.label} x${menuQuantities[item.key]}`)
    .join(", "),
);

const menuSubtotal = computed(() =>
  selectedMenuItems.value.reduce(
    (sum, item) => sum + (menuQuantities[item.key] || 0) * item.price,
    0,
  ),
);

const cartItems = computed(() =>
  selectedMenuItems.value.map((item) => ({
    key: item.key,
    label: item.label,
    qty: menuQuantities[item.key] || 0,
    price: item.price,
    total: (menuQuantities[item.key] || 0) * item.price,
  })),
);

const incQty = (key) => {
  menuQuantities[key] = (menuQuantities[key] || 0) + 1;
};

const decQty = (key) => {
  menuQuantities[key] = Math.max(0, (menuQuantities[key] || 0) - 1);
};

const openMenuPicker = () => {
  expenseItemOptions.value.forEach((item) => {
    if (menuQuantities[item.key] === undefined) {
      menuQuantities[item.key] = 0;
    }
  });
  menuPickerOpen.value = true;
};

const loadStays = async () => {
  const { data } = await api.get("/stays");
  stays.value = data.stays || [];
};

const refreshData = async () => {
  await loadStays();
};

const filteredStays = computed(() => {
  const name = staySearch.name.trim().toLowerCase();
  const room = staySearch.room.trim().toLowerCase();
  return stays.value.filter((stay) => {
    const customerName = (stay.customer?.fullName || "").toLowerCase();
    const roomNumber = String(stay.room?.roomNumber || "").toLowerCase();
    return (
      (!name || customerName.includes(name)) &&
      (!room || roomNumber.includes(room))
    );
  });
});

const updateCharges = () => {
  const roomCharges = Number(stayDetails.value?.roomCharges || 0);
  const expenseTotal = expenses.value.reduce(
    (sum, item) => sum + Number(item.total || 0),
    0,
  );
  stayCharges.roomCharges = roomCharges;
  stayCharges.expenseTotal = expenseTotal;
  stayCharges.totalAmount = roomCharges + expenseTotal;
};

const fetchStayDetails = async (stayId) => {
  const id = stayId || selectedStayId.value;
  if (!id) return;
  try {
    const { data } = await api.get(`/stays/${id}`);
    stayDetails.value = data.stay;
    updateCharges();
  } catch (error) {
    stayDetails.value = null;
    updateCharges();
    ui.pushToast(
      error.response?.data?.message || "Unable to load stay",
      "error",
    );
  }
};

const loadStayExpenses = async (stayId) => {
  const id = stayId || selectedStayId.value;
  if (!id) {
    expenses.value = [];
    updateCharges();
    return;
  }
  try {
    const { data } = await api.get("/expenses", { params: { stayId: id } });
    expenses.value = data.expenses || [];
    updateCharges();
  } catch (error) {
    expenses.value = [];
    updateCharges();
    ui.pushToast(
      error.response?.data?.message || "Unable to load expenses",
      "error",
    );
  }
};

const addExpense = async () => {
  if (!selectedStayId.value || !stayDetails.value) {
    ui.pushToast("Select a stay before adding charges", "error");
    return;
  }
  if (isMenuType.value) {
    if (!menuSummary.value) {
      ui.pushToast("Select at least one menu item", "error");
      return;
    }
  } else if (!selectedExpenseItem.value) {
    ui.pushToast("Select a charge item", "error");
    return;
  }
  try {
    if (isMenuType.value) {
      const items = selectedMenuItems.value.map((item) => ({
        stayId: selectedStayId.value,
        customerId: stayDetails.value.customer?._id,
        roomId: stayDetails.value.room?._id,
        expenseType: expenseForm.expenseType,
        description: item.label,
        quantity: menuQuantities[item.key],
        price: item.price,
      }));

      await Promise.all(items.map((it) => api.post("/expenses", it)));
    } else {
      await api.post("/expenses", {
        stayId: selectedStayId.value,
        customerId: stayDetails.value.customer?._id,
        roomId: stayDetails.value.room?._id,
        expenseType: expenseForm.expenseType,
        description: selectedExpenseItem.value.label,
        quantity: expenseForm.quantity,
        price: selectedExpenseItem.value.price,
      });
    }

    ui.pushToast("Charge(s) added");
    await loadStayExpenses(selectedStayId.value);
    Object.assign(expenseForm, {
      expenseType: "Food",
      itemKey: "",
      quantity: 1,
    });
    Object.keys(menuQuantities).forEach((k) => (menuQuantities[k] = 0));
  } catch (error) {
    ui.pushToast(error.response?.data?.message || "Add charge failed", "error");
  }
};

watch(
  () => selectedStayId.value,
  (value) => {
    if (!value) {
      stayDetails.value = null;
      expenses.value = [];
      updateCharges();
      return;
    }
    fetchStayDetails(value);
    loadStayExpenses(value);
  },
);

watch(
  () => expenseForm.expenseType,
  () => {
    expenseForm.itemKey = expenseItemOptions.value[0]?.key || "";
  },
  { immediate: true },
);

onMounted(refreshData);
</script>
