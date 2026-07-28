<template>
  <section class="food-billing-page">
    <header class="page-head">
      <div>
        <p class="eyebrow">Hotel F&B Desk</p>
        <h2>Food Billing Dashboard</h2>
      </div>
      <div class="head-actions"></div>
    </header>

    <div class="dashboard-layout">
      <aside class="left-panel">
        <div class="panel-head">
          <h3>Menu Browser</h3>
        </div>

        <label class="field">
          <span>Active Guest</span>
          <select
            :value="selectedGuest?.stayId || ''"
            @change="onGuestChange($event.target.value)"
          >
            <option value="">Select guest stay</option>
            <option
              v-for="guest in activeGuests"
              :key="guest.stayId"
              :value="guest.stayId"
            >
              {{ guest.guestName }} · Room {{ guest.roomNumber }} ({{
                guest.roomType
              }})
            </option>
          </select>
        </label>

        <div class="menu-manager">
          <div class="panel-head panel-head--tight">
            <h4>{{ activeTab }} Menu</h4>
            <button
              class="pill-btn"
              type="button"
              @click="showMenuEditor = !showMenuEditor"
            >
              {{ showMenuEditor ? "Hide Menu Editor" : "Add Menu Item" }}
            </button>
          </div>
          <div v-if="showMenuEditor" class="menu-manager__form">
            <label>
              <span>Item name</span>
              <input
                v-model="menuDraft.name"
                type="text"
                placeholder="e.g. Cigarette"
              />
            </label>
            <label>
              <span>Price</span>
              <input
                v-model="menuDraft.price"
                type="number"
                min="0"
                step="1"
                placeholder="0"
              />
            </label>
            <label class="menu-manager__description">
              <span>Description</span>
              <input
                v-model="menuDraft.description"
                type="text"
                placeholder="Optional description"
              />
            </label>
            <div class="menu-manager__actions">
              <button class="pill-btn" type="button" @click="submitMenuItem">
                {{ editingItemId ? "Save Item" : "Add Item" }}
              </button>
              <button
                v-if="editingItemId"
                class="pill-btn pill-btn--ghost"
                type="button"
                @click="cancelEdit"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div class="tab-row">
          <button
            v-for="tab in tabs"
            :key="tab"
            :class="['tab-btn', { 'tab-btn--active': activeTab === tab }]"
            @click="activeTab = tab"
          >
            {{ tab }}
          </button>
        </div>

        <div class="menu-grid">
          <article v-for="item in activeMenu" :key="item.id" class="menu-card">
            <template v-if="editingItemId === item.id">
              <div class="menu-card__edit">
                <label>
                  <span>Name</span>
                  <input v-model="editingDraft.name" type="text" />
                </label>
                <label>
                  <span>Price</span>
                  <input
                    v-model="editingDraft.price"
                    type="number"
                    min="0"
                    step="1"
                  />
                </label>
                <label>
                  <span>Description</span>
                  <input v-model="editingDraft.description" type="text" />
                </label>
                <div class="menu-card__actions">
                  <button
                    class="pill-btn"
                    type="button"
                    @click="saveMenuEdit(item.id)"
                  >
                    Save
                  </button>
                  <button
                    class="pill-btn pill-btn--ghost"
                    type="button"
                    @click="cancelEdit"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="menu-card__top">
                <h4>{{ item.name }}</h4>
                <strong>{{ formatNpr(item.price) }}</strong>
              </div>
              <p>{{ item.description }}</p>

              <div class="card-actions" @click.stop>
                <button
                  v-if="!itemQtys[item.id]"
                  class="btn-add"
                  type="button"
                  @click="addMenuItem(item)"
                >
                  <span aria-hidden="true">+</span>
                  <span>Add to order</span>
                </button>

                <div v-else class="qty-row">
                  <button
                    class="qty-btn"
                    type="button"
                    aria-label="Decrease quantity"
                    @click="decrementMenuItem(item)"
                  >
                    −
                  </button>
                  <span class="qty-num">{{ itemQtys[item.id] }}</span>
                  <button
                    class="qty-btn"
                    type="button"
                    aria-label="Increase quantity"
                    @click="incrementMenuItem(item)"
                  >
                    +
                  </button>
                </div>

                <span class="action-divider" aria-hidden="true"></span>

                <button
                  class="btn-icon"
                  type="button"
                  :aria-label="`Edit ${item.name}`"
                  @click="startEdit(item)"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 17.25V20h2.75L17.8 8.95l-2.75-2.75L4 17.25Zm14.71-8.54a.996.996 0 0 0 0-1.41l-2-2a.996.996 0 1 0-1.41 1.41l2 2c.38.38.97.38 1.41 0Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>

                <button
                  class="btn-icon btn-delete"
                  type="button"
                  :aria-label="`Delete ${item.name}`"
                  @click="deleteMenuItem(item.id)"
                >
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M9 3.75h6a1.5 1.5 0 0 1 1.5 1.5V6h3v1.5h-1.05l-.74 9.2A2.25 2.25 0 0 1 15.47 19H8.53a2.25 2.25 0 0 1-2.24-2.3l-.74-9.2H4.5V6h3v-.75A1.5 1.5 0 0 1 9 3.75Zm1.5 2.25h3V6h-3v0Zm-2.22 2.5.53 6.6a.75.75 0 1 0 1.5-.12l-.53-6.6a.75.75 0 1 0-1.5.12Zm5.44-.12-.53 6.6a.75.75 0 1 0 1.5.12l.53-6.6a.75.75 0 1 0-1.5-.12Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </div>
            </template>
          </article>
        </div>
      </aside>

      <main class="right-panel">
        <div class="panel-head">
          <h3>Live Guest Bill</h3>
          <span :class="['status-badge', 'status-badge--red']">occupied</span>
        </div>

        <div class="guest-card">
          <div class="guest-row">
            <span>Guest</span>
            <strong class="guest-name">
              {{ selectedGuest?.guestName || "No guest selected" }}
            </strong>
          </div>
          <div class="guest-row">
            <span>Room</span>
            <strong>
              {{ selectedGuest?.roomNumber || "-" }}
              ({{ selectedGuest?.roomType || "-" }})
            </strong>
          </div>
          <div class="guest-row">
            <span>Nightly Rate</span>
            <strong>{{ formatNpr(selectedGuest?.ratePerNight || 0) }}</strong>
          </div>
          <div class="guest-row">
            <span>Nights</span>
            <strong>{{ selectedGuest?.nights || 0 }}</strong>
          </div>
          <div class="guest-row total-row">
            <span>Room Subtotal</span>
            <strong>{{ formatNpr(roomSubtotal) }}</strong>
          </div>
        </div>
        <div class="payment-panel">
          <div class="payment-panel__head">
            <strong>Payment status</strong>
            <span :class="paymentBadgeClass">{{ paymentStatusLabel }}</span>
          </div>

          <div class="payment-pills">
            <button
              v-for="option in paymentOptions"
              :key="option.value"
              type="button"
              class="payment-pill"
              :class="{
                'payment-pill--active': paymentStatus === option.value,
              }"
              @click="store.setPaymentStatus(option.value)"
            >
              {{ option.label }}
            </button>
          </div>

          <div class="partial-payment-box">
            <div class="partial-payment-row">
              <label>
                <span>Amount paid</span>
                <input
                  :value="amountPaid"
                  type="number"
                  min="0"
                  step="1"
                  @input="store.setAmountPaid($event.target.value)"
                />
              </label>
            </div>

            <p class="payment-helper">
              {{ balanceLabel }}: {{ formatNpr(balanceAmount) }}
            </p>

            <div class="save-payment-row">
              <button
                class="pill-btn pill-btn--ghost"
                type="button"
                :disabled="savingPayment || !selectedGuest"
                @click="store.savePayment()"
              >
                {{ savingPayment ? "Saving..." : "Save Payment" }}
              </button>
            </div>
          </div>
        </div>
        <p class="empty-note">
          {{
            selectedGuest
              ? "Guest details loaded."
              : "Select an active guest to start billing."
          }}
        </p>

        <div class="bill-items">
          <div class="bill-head">
            <strong>Items</strong>
            <button
              class="pill-btn pill-btn--ghost"
              @click="clearOrder"
              :disabled="!orderItems.length"
            >
              Clear
            </button>
          </div>

          <div v-if="!orderItems.length" class="empty-note">
            No food or beverage items added yet.
          </div>

          <div v-for="line in orderItems" :key="line.id" class="bill-line">
            <div>
              <strong>{{ line.menuItem }}</strong>
              <p>
                {{ line.category }} · {{ line.qty }} x
                {{ formatNpr(line.unitPrice) }}
              </p>
            </div>
            <div class="line-actions">
              <strong>{{ formatNpr(line.qty * line.unitPrice) }}</strong>
              <div class="qty-controls">
                <button
                  class="qty-btn"
                  type="button"
                  @click="store.changeQty(line.id, -1)"
                  :disabled="line.qty <= 1"
                >
                  −
                </button>
                <span class="qty-label">{{ line.qty }}</span>
                <button
                  class="qty-btn"
                  type="button"
                  @click="store.changeQty(line.id, 1)"
                >
                  +
                </button>
              </div>
              <button class="remove-btn" @click="store.removeItem(line.id)">
                Remove
              </button>
            </div>
          </div>
        </div>

        <footer class="totals-card">
          <div class="total-item">
            <span>Room charges</span>
            <strong>{{ formatNpr(roomSubtotal) }}</strong>
          </div>
          <div class="total-item">
            <span>Food & beverages</span>
            <strong>{{ formatNpr(foodAndBeverageTotal) }}</strong>
          </div>
          <div class="total-item">
            <span>Extras</span>
            <strong>{{ formatNpr(extrasTotal) }}</strong>
          </div>
          <div class="total-item">
            <span>Subtotal</span>
            <strong>{{ formatNpr(subtotal) }}</strong>
          </div>
          <div class="total-item total-item--grand">
            <span>Grand Total</span>
            <strong>{{ formatNpr(grandTotal) }}</strong>
          </div>
          <div class="total-item">
            <span>Amount paid</span>
            <strong>{{ formatNpr(amountPaid) }}</strong>
          </div>
          <div class="total-item">
            <span>{{ balanceLabel }}</span>
            <strong>{{ formatNpr(balanceAmount) }}</strong>
          </div>
        </footer>

        <div class="action-bar">
          <button class="pill-btn" @click="printBill">Print Bill</button>
          <button
            class="primary-btn"
            :disabled="!canCharge || submitting"
            @click="chargeToRoom"
          >
            {{ submitting ? "Charging..." : chargeButtonLabel }}
          </button>
        </div>

        <div v-if="lastInvoice" class="invoice-result-card">
          <strong>Customer payment recorded</strong>
          <p>
            Invoice {{ lastInvoice.invoiceNumber }} · Total
            {{ formatNpr(lastInvoice.totalAmount) }}
          </p>
          <p>
            Room {{ lastInvoice.room?.roomNumber }} ·
            {{ lastInvoice.customer?.fullName }}
          </p>
        </div>
      </main>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { storeToRefs } from "pinia";
import { useFoodBillingStore } from "../stores/foodBilling";
import NepaliDate from "nepali-date-converter";

const store = useFoodBillingStore();
const {
  activeGuests,
  selectedGuest,
  orderItems,
  loadingGuests,
  submitting,
  savingPayment,
  lastInvoice,
  paymentStatus,
  amountPaid,
  remainingBalance,
} = storeToRefs(store);

const tabs = ["Breakfast", "Dinner", "Drinks", "Extras"];
const activeTab = ref("Breakfast");
const showMenuEditor = ref(false);
const MENU_STORAGE_KEY = "hotel_food_menu_catalog";

const MENU_BY_CATEGORY = {
  Breakfast: [
    {
      id: "breakfast-full",
      name: "Full Breakfast",
      description: "Eggs, toast, hash browns, and juice.",
      price: 1600,
      category: "Breakfast",
    },
    {
      id: "breakfast-bennedict",
      name: "Eggs Benedict",
      description: "Poached eggs, hollandaise, sourdough.",
      price: 1860,
      category: "Breakfast",
    },
    {
      id: "breakfast-pancakes",
      name: "Pancakes",
      description: "Stack with maple syrup and butter.",
      price: 1330,
      category: "Breakfast",
    },
    {
      id: "breakfast-avocado",
      name: "Avocado Toast",
      description: "Sourdough, avocado mash, chili flakes.",
      price: 1460,
      category: "Breakfast",
    },
    {
      id: "breakfast-croissant",
      name: "Croissant & Jam",
      description: "Butter croissant with preserves.",
      price: 800,
      category: "Breakfast",
    },
    {
      id: "breakfast-fruit",
      name: "Fruit Bowl",
      description: "Seasonal mixed fruit selection.",
      price: 930,
      category: "Breakfast",
    },
    {
      id: "breakfast-yogurt",
      name: "Yogurt Parfait",
      description: "Greek yogurt, granola, berries.",
      price: 1060,
      category: "Breakfast",
    },
    {
      id: "breakfast-muesli",
      name: "Muesli & Milk",
      description: "Toasted oats with chilled milk.",
      price: 930,
      category: "Breakfast",
    },
  ],
  Dinner: [
    {
      id: "dinner-caesar",
      name: "Caesar Salad",
      description: "Romaine, parmesan, garlic croutons.",
      price: 1730,
      category: "Dinner",
    },
    {
      id: "dinner-soup",
      name: "Soup of the Day",
      description: "Freshly prepared chef special.",
      price: 1330,
      category: "Dinner",
    },
    {
      id: "dinner-salmon",
      name: "Grilled Salmon",
      description: "Herb salmon with lemon butter.",
      price: 3720,
      category: "Dinner",
    },
    {
      id: "dinner-beef",
      name: "Beef Tenderloin",
      description: "Pan-seared steak and jus.",
      price: 5050,
      category: "Dinner",
    },
    {
      id: "dinner-risotto",
      name: "Mushroom Risotto",
      description: "Creamy arborio with porcini.",
      price: 2920,
      category: "Dinner",
    },
    {
      id: "dinner-chicken",
      name: "Chicken Supreme",
      description: "Roasted breast with pan sauce.",
      price: 3320,
      category: "Dinner",
    },
    {
      id: "dinner-creme",
      name: "Crème Brûlée",
      description: "Classic vanilla custard.",
      price: 1330,
      category: "Dinner",
    },
    {
      id: "dinner-fondant",
      name: "Chocolate Fondant",
      description: "Warm center chocolate cake.",
      price: 1600,
      category: "Dinner",
    },
  ],
  Drinks: [
    {
      id: "drink-espresso",
      name: "Espresso",
      description: "Single origin espresso shot.",
      price: 530,
      category: "Drinks",
    },
    {
      id: "drink-cappuccino",
      name: "Cappuccino",
      description: "Rich espresso with steamed milk.",
      price: 660,
      category: "Drinks",
    },
    {
      id: "drink-tea",
      name: "English Tea",
      description: "Classic black tea service.",
      price: 530,
      category: "Drinks",
    },
    {
      id: "drink-hot-chocolate",
      name: "Hot Chocolate",
      description: "Dark cocoa with cream.",
      price: 800,
      category: "Drinks",
    },
    {
      id: "drink-oj",
      name: "Fresh OJ",
      description: "Freshly squeezed orange juice.",
      price: 800,
      category: "Drinks",
    },
    {
      id: "drink-still-water",
      name: "Still Water",
      description: "Mineral still water bottle.",
      price: 400,
      category: "Drinks",
    },
    {
      id: "drink-sparkling-water",
      name: "Sparkling Water",
      description: "Sparkling mineral water.",
      price: 530,
      category: "Drinks",
    },
    {
      id: "drink-soft",
      name: "Soft Drink",
      description: "Assorted carbonated beverages.",
      price: 530,
      category: "Drinks",
    },
    {
      id: "drink-wine",
      name: "House Wine",
      description: "Red or white by the glass.",
      price: 1200,
      category: "Drinks",
    },
    {
      id: "drink-beer",
      name: "Beer",
      description: "Local premium lager.",
      price: 930,
      category: "Drinks",
    },
    {
      id: "drink-cocktail",
      name: "Cocktail",
      description: "Bartender signature cocktail.",
      price: 1860,
      category: "Drinks",
    },
    {
      id: "drink-whisky",
      name: "Whisky",
      description: "Single malt house pour.",
      price: 2130,
      category: "Drinks",
    },
  ],
  Extras: [
    {
      id: "extra-laundry",
      name: "Laundry (per item)",
      description: "Pressed and folded service.",
      price: 660,
      category: "Extras",
    },
    {
      id: "extra-minibar",
      name: "Minibar Restock",
      description: "Complete minibar replenishment.",
      price: 2390,
      category: "Extras",
    },
    {
      id: "extra-late-checkout",
      name: "Late Checkout",
      description: "Extended stay beyond standard checkout.",
      price: 3990,
      category: "Extras",
    },
    {
      id: "extra-airport",
      name: "Airport Transfer",
      description: "Private transfer service.",
      price: 5980,
      category: "Extras",
    },
  ],
};

const cloneMenuCatalog = () => ({
  Breakfast: MENU_BY_CATEGORY.Breakfast.map((item) => ({ ...item })),
  Dinner: MENU_BY_CATEGORY.Dinner.map((item) => ({ ...item })),
  Drinks: MENU_BY_CATEGORY.Drinks.map((item) => ({ ...item })),
  Extras: MENU_BY_CATEGORY.Extras.map((item) => ({ ...item })),
});

const loadMenuCatalog = () => {
  try {
    const stored = localStorage.getItem(MENU_STORAGE_KEY);
    if (!stored) return cloneMenuCatalog();
    const parsed = JSON.parse(stored);
    return tabs.reduce((catalog, tab) => {
      catalog[tab] =
        Array.isArray(parsed?.[tab]) && parsed[tab].length
          ? parsed[tab]
              .filter((item) => item && item.name)
              .map((item) => ({
                id: String(item.id || `${tab.toLowerCase()}-${Date.now()}`),
                name: String(item.name || "Unnamed item"),
                description: String(item.description || ""),
                price: Number(item.price || 0),
                category: tab,
              }))
          : cloneMenuCatalog()[tab];
      return catalog;
    }, {});
  } catch {
    return cloneMenuCatalog();
  }
};

const menuCatalog = ref(loadMenuCatalog());
const menuDraft = reactive({ name: "", description: "", price: "" });
const editingItemId = ref("");
const editingDraft = reactive({ name: "", description: "", price: "" });
const itemQtys = reactive({});

const activeMenu = computed(() => menuCatalog.value[activeTab.value] || []);

const saveMenuCatalog = () => {
  localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menuCatalog.value));
};

const resetMenuDraft = () => {
  menuDraft.name = "";
  menuDraft.description = "";
  menuDraft.price = "";
};

const resetEditDraft = () => {
  editingItemId.value = "";
  editingDraft.name = "";
  editingDraft.description = "";
  editingDraft.price = "";
};

const cancelEdit = () => {
  resetEditDraft();
};

const resetItemQtys = () => {
  Object.keys(itemQtys).forEach((key) => {
    delete itemQtys[key];
  });
};

const syncItemQtys = () => {
  const nextQtys = {};

  tabs.forEach((tab) => {
    (menuCatalog.value[tab] || []).forEach((item) => {
      const line = store.getMenuLine(item);
      if (line && Number(line.qty || 0) > 0) {
        nextQtys[item.id] = Number(line.qty || 0);
      }
    });
  });

  resetItemQtys();
  Object.entries(nextQtys).forEach(([itemId, qty]) => {
    itemQtys[itemId] = qty;
  });
};

watch(orderItems, syncItemQtys, { deep: true, immediate: true });
watch(menuCatalog, syncItemQtys, { deep: true });

const createMenuId = (category, name) =>
  `${category.toLowerCase()}-${String(name || "item")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}-${Date.now()}`;

const submitMenuItem = () => {
  const name = String(menuDraft.name || "").trim();
  const price = Number(menuDraft.price || 0);
  const description = String(menuDraft.description || "").trim();
  if (!name || price < 0) return;

  const nextItem = {
    id: createMenuId(activeTab.value, name),
    name,
    description,
    price,
    category: activeTab.value,
  };

  menuCatalog.value = {
    ...menuCatalog.value,
    [activeTab.value]: [
      ...(menuCatalog.value[activeTab.value] || []),
      nextItem,
    ],
  };
  saveMenuCatalog();
  resetMenuDraft();
};

const startEdit = (item) => {
  editingItemId.value = item.id;
  editingDraft.name = item.name;
  editingDraft.description = item.description || "";
  editingDraft.price = String(item.price || 0);
};

const saveMenuEdit = (itemId) => {
  const name = String(editingDraft.name || "").trim();
  const price = Number(editingDraft.price || 0);
  const description = String(editingDraft.description || "").trim();
  if (!name || price < 0) return;

  menuCatalog.value = {
    ...menuCatalog.value,
    [activeTab.value]: (menuCatalog.value[activeTab.value] || []).map((item) =>
      item.id === itemId
        ? { ...item, name, description, price, category: activeTab.value }
        : item,
    ),
  };
  saveMenuCatalog();
  resetEditDraft();
};

const deleteMenuItem = (itemId) => {
  if (!window.confirm("Delete this menu item?")) return;

  menuCatalog.value = {
    ...menuCatalog.value,
    [activeTab.value]: (menuCatalog.value[activeTab.value] || []).filter(
      (item) => item.id !== itemId,
    ),
  };
  saveMenuCatalog();
  if (editingItemId.value === itemId) {
    resetEditDraft();
  }
};

const addMenuItem = async (item) => {
  await store.addItem(item);
  syncItemQtys();
};

const incrementMenuItem = async (item) => {
  await store.changeQty(store.getMenuLine(item)?.id || item.id, 1);
  syncItemQtys();
};

const decrementMenuItem = async (item) => {
  const line = store.getMenuLine(item);
  if (!line) {
    syncItemQtys();
    return;
  }

  if (Number(line.qty || 0) <= 1) {
    await store.removeItem(line.id);
  } else {
    await store.changeQty(line.id, -1);
  }

  syncItemQtys();
};

const clearOrder = () => {
  store.clearOrder();
  resetItemQtys();
};

const roomSubtotal = computed(() => {
  if (!selectedGuest.value) return 0;
  return (
    Number(selectedGuest.value.ratePerNight || 0) *
    Number(selectedGuest.value.nights || 0)
  );
});

const foodAndBeverageTotal = computed(() =>
  orderItems.value
    .filter((line) =>
      ["Breakfast", "Dinner", "Drinks", "Food"].includes(line.category),
    )
    .reduce((sum, line) => sum + line.qty * line.unitPrice, 0),
);

const extrasTotal = computed(() =>
  orderItems.value
    .filter((line) => line.category === "Extras")
    .reduce((sum, line) => sum + line.qty * line.unitPrice, 0),
);

const subtotal = computed(
  () => roomSubtotal.value + foodAndBeverageTotal.value + extrasTotal.value,
);
const grandTotal = computed(() => subtotal.value);

const paymentOptions = [
  { label: "Unpaid", value: "unpaid" },
  { label: "Amount Paid", value: "partial" },
  { label: "Paid in Full", value: "paid" },
];

const paymentStatusLabel = computed(() => {
  if (paymentStatus.value === "paid") return "Paid in Full";
  if (paymentStatus.value === "partial") return "Amount Paid";
  return "Unpaid";
});

const paymentBadgeClass = computed(() => {
  if (paymentStatus.value === "paid") return "status-badge status-badge--green";
  if (paymentStatus.value === "partial")
    return "status-badge status-badge--amber";
  return "status-badge status-badge--red";
});

const balanceAmount = computed(() => {
  if (amountPaid.value > grandTotal.value) {
    return amountPaid.value - grandTotal.value;
  }
  return remainingBalance.value;
});

const balanceLabel = computed(() =>
  amountPaid.value > grandTotal.value ? "Return" : "Remaining balance",
);

const chargeButtonLabel = computed(() => {
  return "Charge";
});

const canCharge = computed(() =>
  Boolean(
    selectedGuest.value &&
    (roomSubtotal.value > 0 || orderItems.value.length > 0),
  ),
);

const formatNpr = (value) => {
  const number = Number(value || 0);
  const hasFraction = Math.abs(number % 1) > 0;
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(number);
  return `Rs. ${formatted}`;
};

const itemQty = (itemId) => {
  const line = orderItems.value.find((entry) => entry.id === itemId);
  return line ? line.qty : 0;
};

const onGuestChange = (stayId) => {
  const nextGuest =
    activeGuests.value.find((guest) => guest.stayId === stayId) || null;
  store.selectGuest(nextGuest);
};

const buildBillPrintHTML = () => {
  const guest = selectedGuest.value;
  if (!guest) return "";

  const items = orderItems.value || [];
  const roomTotal = Number(guest.ratePerNight || 0) * Number(guest.nights || 0);
  const foodTotal = items
    .filter((item) => String(item.category || "").toLowerCase() !== "extras")
    .reduce(
      (sum, item) => sum + Number(item.qty || 0) * Number(item.unitPrice || 0),
      0,
    );
  const extrasTotal = items
    .filter((item) => String(item.category || "").toLowerCase() === "extras")
    .reduce(
      (sum, item) => sum + Number(item.qty || 0) * Number(item.unitPrice || 0),
      0,
    );
  const subtotal = roomTotal + foodTotal + extrasTotal;
  const vat = Math.round(subtotal * 0.13);
  const grandTotal = subtotal + vat;
  const paid = Number(amountPaid.value || 0);
  const remaining = Math.max(0, grandTotal - paid);
  const returnAmt = Math.max(0, paid - grandTotal);
  const nowDate = new Date();
  const now = (() => {
    const timePart = new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(nowDate);
    try {
      return `${new NepaliDate(nowDate).format("DD MMMM YYYY", "en")}, ${timePart}`;
    } catch {
      return nowDate.toLocaleString("en-NP", {
        dateStyle: "medium",
        timeStyle: "short",
      });
    }
  })();
  const itemRows = [
    {
      name: "Room charges",
      category: `${guest.roomType || "Room"} · ${guest.nights || 0} night${Number(guest.nights || 0) > 1 ? "s" : ""}`,
      qty: 1,
      unitPrice: Number(guest.ratePerNight || 0),
      total: roomTotal,
    },
    ...items.map((item) => ({
      name: item.menuItem || item.name || "Item",
      category: item.category || "",
      qty: Number(item.qty || 0),
      unitPrice: Number(item.unitPrice || 0),
      total: Number(item.qty || 0) * Number(item.unitPrice || 0),
    })),
  ]
    .map(
      (item) => `
        <tr>
          <td>
            <div>${item.name}</div>
            <div class="sub">${item.category || ""}</div>
          </td>
          <td>${Number(item.qty || 0)}</td>
          <td>NPR ${Number(item.unitPrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
          <td>NPR ${Number(item.total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
        </tr>`,
    )
    .join("");

  const statusBadge =
    paymentStatus.value === "paid"
      ? "badge-paid"
      : paymentStatus.value === "partial"
        ? "badge-partial"
        : "badge-unpaid";

  const statusText =
    paymentStatus.value === "paid"
      ? "Paid in Full"
      : paymentStatus.value === "partial"
        ? "Partial Payment"
        : "Unpaid";

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Bill — ${guest.guestName || "Guest"}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'DM Sans', sans-serif; background: #fff; color: #1A1814; padding: 36px; font-size: 14px; }
      .head { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 18px; border-bottom: 1px solid #E8E6E0; margin-bottom: 18px; }
      .hotel { font-family: 'DM Serif Display', serif; font-size: 20px; margin-bottom: 3px; }
      .hotel-sub { font-size: 11px; color: #A09D96; letter-spacing: 0.04em; }
      .meta { text-align: right; font-size: 12px; color: #6B6860; line-height: 1.9; }
      .meta b { color: #1A1814; }
      .badge-paid { background: #EBF5EE; color: #1A5C3A; font-size: 11px; font-weight: 500; padding: 2px 10px; border-radius: 20px; border: 1px solid #C4DFCC; display: inline-block; }
      .badge-partial { background: #FDF3E0; color: #7A4F00; font-size: 11px; font-weight: 500; padding: 2px 10px; border-radius: 20px; border: 1px solid #F2DFBE; display: inline-block; }
      .badge-unpaid { background: #FBECEC; color: #8B2020; font-size: 11px; font-weight: 500; padding: 2px 10px; border-radius: 20px; border: 1px solid #EDCACA; display: inline-block; }
      .guest-row { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 1px solid #E8E6E0; margin-bottom: 18px; }
      .lbl { font-size: 10px; font-weight: 500; color: #A09D96; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 5px; }
      .guest-name { font-size: 15px; font-weight: 500; margin-bottom: 2px; }
      .guest-meta { font-size: 12px; color: #A09D96; }
      .room-right { text-align: right; }
      .room-num { font-family: 'DM Serif Display', serif; font-size: 26px; line-height: 1; }
      .room-type { font-size: 12px; color: #A09D96; margin-top: 3px; }
      .stay-chips { display: flex; gap: 8px; margin-bottom: 18px; flex-wrap: wrap; }
      .chip { background: #F2F1ED; border: 1px solid #E8E6E0; border-radius: 20px; padding: 4px 12px; font-size: 11.5px; color: #6B6860; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      thead tr { background: #F2F1ED; }
      th { font-size: 10px; font-weight: 500; color: #A09D96; letter-spacing: 0.09em; text-transform: uppercase; padding: 9px 12px; text-align: left; border-bottom: 1px solid #E8E6E0; }
      th:nth-child(2), th:nth-child(3), th:nth-child(4) { text-align: right; }
      td { font-size: 13px; padding: 11px 12px; border-bottom: 1px solid #F2F1ED; vertical-align: middle; }
      td:nth-child(2), td:nth-child(3) { text-align: right; color: #6B6860; }
      td:nth-child(4) { text-align: right; font-weight: 500; }
      .sub { font-size: 11px; color: #A09D96; margin-top: 2px; text-transform: capitalize; }
      .totals { display: flex; justify-content: flex-end; margin-bottom: 18px; }
      .totals-box { width: 260px; }
      .tr { display: flex; justify-content: space-between; font-size: 13px; color: #6B6860; padding: 4px 0; }
      .tr span:last-child { font-weight: 500; color: #1A1814; }
      .tr-grand { display: flex; justify-content: space-between; font-size: 15px; font-weight: 500; color: #1A1814; border-top: 1.5px solid #3D3A30; padding-top: 9px; margin-top: 5px; }
      .tr-grand span:last-child { font-family: 'DM Serif Display', serif; font-size: 17px; }
      .tr-paid { display: flex; justify-content: space-between; font-size: 13px; color: #1A5C3A; padding: 4px 0; }
      .tr-paid span:last-child { font-weight: 500; }
      .tr-return { display: flex; justify-content: space-between; font-size: 13px; color: #8B6914; padding: 4px 0; }
      .tr-return span:last-child { font-weight: 500; }
      .tr-remaining { display: flex; justify-content: space-between; font-size: 13px; color: #8B2020; padding: 4px 0; }
      .tr-remaining span:last-child { font-weight: 500; }
      .divider { height: 1px; background: #E8E6E0; margin: 6px 0; }
      .notice { padding: 11px 14px; border-radius: 8px; font-size: 12.5px; margin-bottom: 18px; }
      .notice.success { background: #EBF5EE; border: 1px solid #C4DFCC; color: #1A5C3A; }
      .notice.partial { background: #FDF3E0; border: 1px solid #F2DFBE; color: #7A4F00; }
      .notice.unpaid { background: #FBECEC; border: 1px solid #EDCACA; color: #8B2020; }
      .footer { border-top: 1px solid #E8E6E0; padding-top: 14px; font-size: 11.5px; color: #A09D96; text-align: center; }
    </style>
  </head>
  <body>
    <div class="head">
      <div>
        <div class="hotel">Hotel Aashirbad and Guest House</div>
        <div class="hotel-sub">Food & Beverage Bill</div>
      </div>
      <div class="meta">
        <div><b>Invoice:</b> ${guest.invoiceNumber || "-"}</div>
        <div><b>Printed:</b> ${now}</div>
        <div><span class="${statusBadge}">${statusText}</span></div>
      </div>
    </div>

    <div class="guest-row">
      <div>
        <div class="lbl">Guest</div>
        <div class="guest-name">${guest.guestName || "Guest"}</div>
        <div class="guest-meta">${guest.phone || ""}</div>
      </div>
      <div class="room-right">
        <div class="lbl">Room</div>
        <div class="room-num">${guest.roomNumber || "-"}</div>
        <div class="room-type">${guest.roomType || "Standard"}</div>
      </div>
    </div>

    <div class="stay-chips">
      <div class="chip">Check-in: ${guest.checkIn || "-"}</div>
      <div class="chip">Check-out: ${guest.checkOut || "-"}</div>
      <div class="chip">${guest.nights || 0} nights</div>
      <div class="chip">NPR ${Number(guest.ratePerNight || 0).toLocaleString("en-IN")} / night</div>
    </div>

    <table>
      <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <div class="totals">
      <div class="totals-box">
        <div class="tr"><span>Room charges</span><span>NPR ${roomTotal.toLocaleString()}</span></div>
        <div class="tr"><span>Food & beverages</span><span>NPR ${foodTotal.toLocaleString()}</span></div>
        <div class="tr"><span>Extras</span><span>NPR ${extrasTotal.toLocaleString()}</span></div>
        <div class="divider"></div>
        <div class="tr"><span>Subtotal</span><span>NPR ${subtotal.toLocaleString()}</span></div>
        <div class="tr"><span>VAT (13%)</span><span>NPR ${vat.toLocaleString()}</span></div>
        <div class="tr-grand"><span>Grand total</span><span>NPR ${grandTotal.toLocaleString()}</span></div>
        <div class="divider"></div>
        <div class="tr-paid"><span>Amount paid</span><span>NPR ${paid.toLocaleString()}</span></div>
        ${returnAmt > 0 ? `<div class="tr-return"><span>Return to guest</span><span>NPR ${returnAmt.toLocaleString()}</span></div>` : ""}
        ${remaining > 0 && paid > 0 ? `<div class="tr-remaining"><span>Remaining balance</span><span>NPR ${remaining.toLocaleString()}</span></div>` : ""}
      </div>
    </div>

    <div class="notice ${paymentStatus.value === "paid" ? "success" : paymentStatus.value === "partial" ? "partial" : "unpaid"}">
      ${
        paymentStatus.value === "paid"
          ? `Payment complete — NPR ${paid.toLocaleString()} received.${returnAmt > 0 ? ` NPR ${returnAmt.toLocaleString()} to be returned to guest.` : ""}`
          : paymentStatus.value === "partial"
            ? `Amount Paid — NPR ${remaining.toLocaleString()} still outstanding.`
            : `Payment pending — NPR ${grandTotal.toLocaleString()} outstanding.`
      }
    </div>

    <div class="footer">Hotel Aashirbad and Guest House  ·  Food & Beverage Bill  ·  ${now}</div>
  </body>
</html>`;
};

const printBill = () => {
  if (!selectedGuest.value) return;

  const win = window.open("", "_blank", "width=800,height=650");
  if (!win) return;

  win.document.write(buildBillPrintHTML());
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
  };
};

const chargeToRoom = async () => {
  await store.submitOrder();
};

const fetchActiveGuests = async () => {
  await store.fetchActiveGuests();
};

watch(
  grandTotal,
  (value) => {
    store.setBillingTotal(value);
    if (paymentStatus.value === "paid") {
      store.setAmountPaid(value);
    }
  },
  { immediate: true },
);

onMounted(fetchActiveGuests);

watch(activeTab, () => {
  resetMenuDraft();
  resetEditDraft();
});
</script>

<style scoped>
.food-billing-page {
  min-height: 100%;
  background: #fafaf7;
  color: #1b1f2a;
  border: 1px solid #e8e6e0;
  border-radius: 14px;
  padding: 18px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.eyebrow {
  font-family: "DM Sans", "Segoe UI", sans-serif;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #7c6c3a;
  font-size: 0.76rem;
  margin: 0;
}

h2,
h3,
h4 {
  font-family: "DM Serif Display", Georgia, serif;
  margin: 0;
}

.dashboard-layout {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 14px;
}

.left-panel,
.right-panel {
  border: 1px solid #e8e6e0;
  border-radius: 12px;
  background: #fff;
  padding: 14px;
}

.left-panel {
  background:
    linear-gradient(180deg, rgba(201, 168, 76, 0.08), transparent 35%), #fff;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.panel-head--tight {
  margin-bottom: 8px;
}

.menu-manager {
  margin-bottom: 14px;
  padding: 12px;
  border: 1px solid #eadfbd;
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(201, 168, 76, 0.08), #fff);
}

.menu-manager__form {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.menu-manager__form label,
.menu-card__edit label {
  display: grid;
  gap: 6px;
}

.menu-manager__form label span,
.menu-card__edit label span {
  font-size: 0.85rem;
  color: #5e594b;
}

.menu-manager__form input,
.menu-card__edit input {
  width: 100%;
  border: 1px solid #e5dcc4;
  border-radius: 10px;
  padding: 10px 12px;
  background: #fff;
  color: #1b1f2a;
}

.menu-manager__description,
.menu-card__edit label:last-of-type {
  grid-column: 1 / -1;
}

.menu-manager__actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.btn-add {
  flex: 1;
  height: 38px;
  background: #c9a84c;
  color: #1a1814;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: inherit;
  transition: background 0.14s;
}

.btn-add:hover {
  background: #b8962e;
}

.btn-add:active {
  transform: scale(0.98);
}

.qty-row {
  flex: 1;
  height: 38px;
  background: var(--color-background-secondary, #f5f1e8);
  border-radius: 8px;
  display: flex;
  align-items: center;
  overflow: hidden;
}

.qty-btn {
  width: 36px;
  height: 38px;
  border: none;
  background: transparent;
  color: var(--color-text-secondary, #6d6252);
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.12s;
  flex-shrink: 0;
}

.qty-btn:hover {
  background: var(--color-border-tertiary, #ddd2c0);
}

.qty-num {
  flex: 1;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary, #1a1814);
}

.action-divider {
  width: 1px;
  height: 20px;
  background: var(--color-border-tertiary, #ddd2c0);
  flex-shrink: 0;
  margin: 0 4px;
}

.btn-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  border: 0.5px solid var(--color-border-tertiary, #ddd2c0);
  background: var(--color-background-primary, #ffffff);
  color: var(--color-text-tertiary, #7b6d5d);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  transition: all 0.14s;
  flex-shrink: 0;
}

.btn-icon svg {
  width: 15px;
  height: 15px;
  display: block;
}

.btn-icon:hover {
  border-color: var(--color-border-secondary, #c8bca7);
  color: var(--color-text-secondary, #6d6252);
  background: var(--color-background-secondary, #f5f1e8);
}

.btn-icon.btn-delete:hover {
  border-color: #edcaca;
  color: #8b2020;
  background: #fbecec;
}

.field {
  display: grid;
  gap: 6px;
  margin-bottom: 12px;
}

.field span {
  font-family: "DM Sans", "Segoe UI", sans-serif;
  font-size: 0.9rem;
  color: #504c3d;
}

select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e8e6e0;
  background: #fefdf9;
  color: #12213f;
  font-size: 1rem;
  font-weight: 700;
}

.tab-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.tab-btn {
  border: 1px solid #e8e6e0;
  background: #f2f1ec;
  border-radius: 999px;
  padding: 7px 12px;
  cursor: pointer;
  color: #463d25;
}

.tab-btn--active {
  border-color: #c9a84c;
  background: rgba(201, 168, 76, 0.2);
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.menu-card {
  border: 1px solid #e8e6e0;
  border-radius: 11px;
  padding: 14px;
  background: linear-gradient(180deg, #fff, #fbfaf6);
  cursor: pointer;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease;
  display: grid;
  gap: 10px;
  align-content: start;
}

.menu-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(32, 24, 4, 0.08);
}

.menu-card__top {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.menu-card__edit {
  display: grid;
  gap: 10px;
}

.menu-card__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.menu-card__actions--grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.menu-card__actions--grid .add-btn,
.menu-card__actions--grid .pill-btn,
.menu-card__actions--grid .remove-btn {
  width: 100%;
  justify-content: center;
  min-height: 40px;
  font-weight: 700;
  box-shadow: 0 8px 18px rgba(32, 24, 4, 0.06);
}

.menu-card__actions--grid .add-btn {
  background: linear-gradient(180deg, #f7dc7d, #e8c95a);
  border-color: #c9a84c;
  color: #2b230b;
}

.menu-card__actions--grid .pill-btn,
.menu-manager__actions .pill-btn,
.menu-card__edit .pill-btn {
  background: #1f2a3d;
  border-color: #1f2a3d;
  color: #fff;
}

.menu-card__actions--grid .pill-btn--ghost,
.menu-manager__actions .pill-btn--ghost,
.menu-card__edit .pill-btn--ghost {
  background: #fff;
  color: #1f2a3d;
  border-color: #cfd7e6;
}

.menu-card__actions--grid .remove-btn {
  background: #fff0f0;
  border-color: #efc6c6;
  color: #b52d2d;
}

.menu-card__actions--grid .add-btn:hover,
.menu-card__actions--grid .pill-btn:hover,
.menu-card__actions--grid .remove-btn:hover,
.menu-manager__actions .pill-btn:hover,
.menu-card__edit .pill-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 10px 22px rgba(32, 24, 4, 0.12);
}

.menu-manager__actions .pill-btn,
.menu-manager__actions .pill-btn--ghost,
.menu-card__edit .pill-btn,
.menu-card__edit .pill-btn--ghost {
  min-height: 40px;
  padding: 8px 14px;
  font-weight: 700;
}

.menu-manager__actions .pill-btn--ghost,
.menu-card__edit .pill-btn--ghost {
  background: #fff;
}

.menu-card p {
  margin: 6px 0 10px;
  color: #6f6a58;
  font-size: 0.88rem;
}

.qty-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qty-btn,
.add-btn,
.pill-btn,
.primary-btn,
.remove-btn {
  border: 1px solid #e8e6e0;
  border-radius: 8px;
  cursor: pointer;
  padding: 6px 10px;
  background: #fff;
}

.qty-btn {
  width: 30px;
  height: 30px;
  padding: 0;
}

.add-btn {
  background: #f5f2e9;
  border-color: #d9c78d;
}

.pill-btn {
  background: #181d2a;
  color: #fff;
  border-color: #181d2a;
}

.pill-btn--ghost {
  background: #fff;
  color: #1b1f2a;
  border-color: #e8e6e0;
}

.primary-btn {
  background: #c9a84c;
  border-color: #c9a84c;
  color: #2b230b;
  font-weight: 700;
}

.pill-btn:disabled,
.primary-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.status-badge {
  border-radius: 999px;
  padding: 5px 10px;
  font-size: 0.78rem;
  text-transform: capitalize;
  border: 1px solid transparent;
}

.status-badge--green {
  background: rgba(42, 194, 109, 0.16);
  color: #1f6a3f;
  border-color: rgba(42, 194, 109, 0.3);
}

.status-badge--red {
  background: rgba(255, 95, 95, 0.16);
  color: #8c2f2f;
  border-color: rgba(255, 95, 95, 0.3);
}

.status-badge--amber {
  background: rgba(242, 184, 75, 0.18);
  color: #7a560f;
  border-color: rgba(242, 184, 75, 0.32);
}

.status-badge--blue {
  background: rgba(74, 157, 255, 0.16);
  color: #2b5f9e;
  border-color: rgba(74, 157, 255, 0.28);
}

.guest-card,
.bill-items,
.totals-card {
  border: 1px solid #e8e6e0;
  border-radius: 10px;
  padding: 12px;
  background: #fff;
}

.guest-card {
  margin-bottom: 10px;
}

.payment-panel {
  margin: 10px 0 12px;
  padding: 12px;
  border: 1px solid #e8e6e0;
  border-radius: 10px;
  background: linear-gradient(180deg, rgba(201, 168, 76, 0.08), #fff);
}

.payment-panel__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 10px;
}

.payment-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.payment-pill {
  border: 1px solid #e8e6e0;
  background: #fff;
  border-radius: 999px;
  padding: 7px 12px;
  cursor: pointer;
  color: #42391f;
}

.payment-pill--active {
  border-color: #c9a84c;
  background: rgba(201, 168, 76, 0.15);
  font-weight: 700;
}

.partial-payment-box {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #ece6d8;
}

.partial-payment-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}

.partial-payment-row label {
  display: grid;
  gap: 6px;
}

.partial-payment-row span {
  font-size: 0.85rem;
  color: #5e594b;
}

.partial-payment-row input[type="number"] {
  width: 100%;
}

.partial-payment-row input[type="number"] {
  background: #ffffff;
  color: #12213f;
  border: 1px solid #e6e0d6;
  padding: 10px 12px;
  border-radius: 8px;
}

.partial-payment-row input[type="number"]:focus {
  outline: none;
  box-shadow: 0 0 0 4px rgba(201, 168, 76, 0.08);
  border-color: rgba(201, 168, 76, 0.6);
}

.payment-helper {
  margin: 10px 0 0;
  color: #6f6a58;
  font-size: 0.9rem;
}

.save-payment-row {
  margin-top: 10px;
}

.guest-row,
.total-item,
.bill-head,
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.guest-name {
  font-size: 1.15rem;
  font-weight: 800;
  color: #12213f;
  letter-spacing: 0.01em;
}

.bill-items,
.totals-card {
  margin-top: 0;
}

.bill-head {
  margin-bottom: 6px;
}

.guest-row,
.total-item {
  padding: 5px 0;
}

.total-row,
.total-item--grand {
  border-top: 1px solid #e8e6e0;
  margin-top: 6px;
  padding-top: 10px;
}

.bill-items {
  margin-bottom: 10px;
}

.bill-line {
  border-top: 1px solid #f0eee7;
  padding: 10px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.bill-line p {
  margin: 3px 0 0;
  color: #6f6a58;
  font-size: 0.85rem;
}

.line-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: flex-end;
  white-space: nowrap;
}

.qty-btn {
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: 1px solid #c9b892;
  background: #fff;
  cursor: pointer;
  display: inline-grid;
  place-items: center;
  font-size: 1.05rem;
}

.qty-label {
  min-width: 28px;
  padding: 0 8px;
  text-align: center;
  font-weight: 700;
  font-size: 1rem;
}

.remove-btn {
  background: #fff3f3;
  border-color: #f3d3d3;
  color: #8f2c2c;
  padding: 8px 10px;
}

.empty-note {
  margin: 8px 0;
  color: #7a7567;
}

.action-bar {
  margin-top: 10px;
}

.invoice-result-card {
  margin-top: 14px;
  border: 1px solid #c9a84c;
  border-radius: 12px;
  background: #fff8e7;
  padding: 12px 14px;
  color: #56451b;
}

.invoice-result-card p {
  margin: 4px 0 0;
}

@media (max-width: 1100px) {
  .dashboard-layout {
    grid-template-columns: 1fr;
  }

  .menu-grid {
    grid-template-columns: 1fr;
  }
}
/* --- Retheme to red/blue signage palette --- */
/* ===== CLEAN BLUE & WHITE THEME ===== */

.food-billing-page {
  background: #f5f9ff;
  border-color: #d6e4ff;
}

.left-panel,
.right-panel,
.guest-card,
.bill-items,
.totals-card {
  background: #ffffff;
  border-color: #d6e4ff;
}

.left-panel {
  background:
    linear-gradient(180deg, rgba(37, 99, 235, 0.05), transparent 35%), #ffffff;
}

.menu-manager,
.payment-panel {
  background: linear-gradient(180deg, rgba(37, 99, 235, 0.06), #ffffff);
  border-color: #bfdbfe;
}

.eyebrow {
  color: #2563eb;
}

.field span,
.menu-manager__form label span,
.menu-card__edit label span,
.partial-payment-row span {
  color: #334155;
}

select,
.menu-manager__form input,
.menu-card__edit input,
.partial-payment-row input[type="number"] {
  border-color: #cbd5e1;
  background: #ffffff;
  color: #0f172a;
}

select:focus,
.menu-manager__form input:focus,
.menu-card__edit input:focus,
.partial-payment-row input[type="number"]:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
}

.tab-btn {
  background: #eff6ff;
  border-color: #dbeafe;
  color: #1e3a8a;
}

.tab-btn--active {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
  font-weight: 700;
}

.btn-add {
  background: #2563eb;
  color: #ffffff;
}

.btn-add:hover {
  background: #1d4ed8;
}

.pill-btn {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

.pill-btn:hover {
  background: #1d4ed8;
}

.pill-btn--ghost {
  background: #ffffff;
  border-color: #cbd5e1;
  color: #1e3a8a;
}

.primary-btn {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

.primary-btn:hover {
  background: #1d4ed8;
}

.payment-pill {
  background: #ffffff;
  border-color: #cbd5e1;
  color: #1e3a8a;
}

.payment-pill--active {
  background: #2563eb;
  border-color: #2563eb;
  color: #ffffff;
}

.menu-card {
  background: linear-gradient(180deg, #ffffff, #f8fbff);
  border-color: #dbeafe;
}

.menu-card:hover {
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.12);
}

.qty-row {
  background: #eff6ff;
}

.qty-btn:hover {
  background: #dbeafe;
}

.btn-icon:hover {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #2563eb;
}

.guest-name {
  color: #0f172a;
}

.empty-note,
.bill-line p,
.payment-helper {
  color: #64748b;
}

.invoice-result-card {
  background: #eff6ff;
  border-color: #93c5fd;
  color: #1e3a8a;
}

.status-badge--blue {
  background: rgba(37, 99, 235, 0.12);
  color: #1d4ed8;
  border-color: rgba(37, 99, 235, 0.28);
}

.status-badge--green {
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
  border-color: rgba(22, 163, 74, 0.25);
}

.status-badge--amber {
  background: rgba(245, 158, 11, 0.12);
  color: #b45309;
  border-color: rgba(245, 158, 11, 0.25);
}

.status-badge--red {
  background: rgba(239, 68, 68, 0.12);
  color: #dc2626;
  border-color: rgba(239, 68, 68, 0.25);
}

/* ======================================= */
</style>
