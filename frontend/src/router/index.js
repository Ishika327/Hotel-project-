import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";
import AppShell from "../components/AppShell.vue";
import LoginView from "../views/LoginView.vue";
import DashboardView from "../views/DashboardView.vue";
import CustomersView from "../views/CustomersView.vue";
import RoomsView from "../views/RoomsView.vue";
import InvoiceView from "../views/InvoiceView.vue";
import StaysView from "../views/StaysView.vue";
import ReportsView from "../views/ReportsView.vue";
import ProfileSettings from "../views/ProfileSettings.vue";
import AccountSettings from "../views/AccountSettings.vue";
import FoodBillingDashboard from "../views/FoodBillingDashboard.vue";

const routes = [
  {
    path: "/login",
    name: "login",
    component: LoginView,
    meta: { public: true },
  },
  {
    path: "/",
    component: AppShell,
    meta: { requiresAuth: true },
    children: [
      { path: "", name: "dashboard", component: DashboardView },
      { path: "customers", name: "customers", component: CustomersView },
      { path: "rooms", name: "rooms", component: RoomsView },
      { path: "stays", name: "stays", component: StaysView },
      { path: "invoices", name: "invoices", component: InvoiceView },
      {
        path: "food-billing",
        name: "food-billing",
        component: FoodBillingDashboard,
      },
      { path: "food-billing-dashboard", redirect: { name: "food-billing" } },
      { path: "billing", redirect: { name: "invoices" } },
      { path: "reports", name: "reports", component: ReportsView },
      {
        path: "account-settings",
        name: "AccountSettings",
        component: AccountSettings,
      },
      {
        path: "profile-settings",
        name: "ProfileSettings",
        component: ProfileSettings,
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  if (!auth.initialized) {
    await auth.bootstrap();
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return "/login";
  }

  if (to.name === "login" && auth.isAuthenticated) {
    return "/";
  }
});

export default router;
