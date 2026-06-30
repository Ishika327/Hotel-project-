<template>
  <aside :class="['sidebar', { 'sidebar--open': open }]">
    <div class="sidebar__brand">
      <div class="brand-mark">H</div>
      <div>
        <strong>Hotel Admin</strong>
        <p>Employee Portal</p>
      </div>
      <button class="icon-btn mobile-only" @click="$emit('close')">✕</button>
    </div>

    <nav class="sidebar__nav">
      <RouterLink to="/" @click="$emit('close')">Dashboard</RouterLink>
      <RouterLink to="/rooms" @click="$emit('close')">Rooms</RouterLink>
      <RouterLink to="/customers" @click="$emit('close')">Customers</RouterLink>
      <RouterLink to="/stays" @click="$emit('close')">Stays</RouterLink>
      <RouterLink to="/invoices" @click="$emit('close')">Invoices</RouterLink>
      <RouterLink to="/food-billing" @click="$emit('close')"
        >Food Billing</RouterLink
      >
      <RouterLink to="/reports" @click="$emit('close')">Reports</RouterLink>
    </nav>
  </aside>
  <div
    v-if="open"
    class="sidebar-backdrop mobile-only"
    @click="$emit('close')"
  ></div>
</template>

<script setup>
defineProps({ open: { type: Boolean, default: false } });
defineEmits(["close"]);
</script>
