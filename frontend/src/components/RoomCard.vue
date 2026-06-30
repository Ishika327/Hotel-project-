<template>
  <article class="room-card">
    <div class="room-card__top">
      <div>
        <p class="room-card__number">Room {{ room.roomNumber }}</p>
        <div class="room-card__meta">
          <span class="room-type-pill">{{ room.roomType }}</span>
          <span class="room-floor"
            >Floor {{ room.floor || room.floorNumber || "-" }}</span
          >
        </div>
      </div>
      <StatusBadge :label="room.status" :variant="badgeVariant" />
    </div>

    <div class="room-card__body">
      <div>
        <p class="subtle">Price / night</p>
        <strong>{{ priceLabel }}</strong>
      </div>
      <slot name="footer" />
    </div>
  </article>
</template>

<script setup>
import { computed } from "vue";
import StatusBadge from "./StatusBadge.vue";

const props = defineProps({
  room: { type: Object, required: true },
  priceLabel: { type: String, default: "" },
});

const badgeVariant = computed(() => {
  const status = String(props.room?.status || "").toLowerCase();
  if (status === "available") return "green";
  if (status === "occupied") return "red";
  if (status === "maintenance" || status === "cleaning") return "amber";
  return "neutral";
});
</script>
