<template>
  <aside :class="['sidebar', { 'sidebar--open': open }]">
    <!-- Logo -->
    <div class="sidebar__brand">
      <img src="/hotel-logo.jpg" alt="Hotel Aashirbad" class="brand-logo" />

      <div class="brand-text">
        <h2>Hotel Aashirbad</h2>
        <p>Guest House</p>
        <small>Staff Portal</small>
      </div>

      <button class="icon-btn mobile-only" @click="$emit('close')">✕</button>
    </div>

    <nav class="sidebar__nav">
      <RouterLink to="/" @click="$emit('close')"> Dashboard </RouterLink>

      <RouterLink to="/rooms" @click="$emit('close')"> Rooms </RouterLink>

      <RouterLink to="/customers" @click="$emit('close')">
        Customers
      </RouterLink>

      <RouterLink to="/stays" @click="$emit('close')"> Stays </RouterLink>

      <RouterLink to="/invoices" @click="$emit('close')"> Invoices </RouterLink>

      <RouterLink to="/food-billing" @click="$emit('close')">
        Food Billing
      </RouterLink>

      <RouterLink to="/reports" @click="$emit('close')"> Reports </RouterLink>
    </nav>
  </aside>

  <div
    v-if="open"
    class="sidebar-backdrop mobile-only"
    @click="$emit('close')"
  ></div>
</template>

<script setup>
defineProps({
  open: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["close"]);
</script>

<style scoped>
.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
}

.brand-logo {
  width: 72px;
  height: 120px;
  object-fit: contain;
  border-radius: 8px;
  background: white;
  padding: 4px;
}

.brand-text h2 {
  margin: 0;
  color: white;
  font-size: 20px;
  line-height: 1.2;
}

.brand-text p {
  margin: 4px 0;
  color: #dbeafe;
  font-size: 15px;
}

.brand-text small {
  color: #bfdbfe;
  font-size: 13px;
}
</style>
