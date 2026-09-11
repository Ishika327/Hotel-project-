<template>
  <div class="nepali-date-picker" ref="rootEl">
    <button
      type="button"
      class="nepali-date-picker__trigger"
      @click="toggleOpen"
    >
      <span :class="{ 'nepali-date-picker__placeholder': !modelValue }">
        {{ displayText }}
      </span>
      <span class="nepali-date-picker__icon">📅</span>
    </button>

    <div v-if="open" class="nepali-date-picker__panel">
      <div class="nepali-date-picker__header">
        <strong>{{ monthNames[viewMonth] }} {{ viewYear }}</strong>
        <div class="nepali-date-picker__nav">
          <button type="button" @click="prevMonth">‹</button>
          <button type="button" @click="nextMonth">›</button>
        </div>
      </div>

      <div class="nepali-date-picker__weekdays">
        <span v-for="day in weekdayLabels" :key="day">{{ day }}</span>
      </div>

      <div class="nepali-date-picker__grid">
        <button
          v-for="(cell, index) in gridCells"
          :key="index"
          type="button"
          class="nepali-date-picker__day"
          :class="{
            'nepali-date-picker__day--empty': !cell,
            'nepali-date-picker__day--selected': isSelected(cell),
          }"
          :disabled="!cell"
          @click="cell && selectDay(cell)"
        >
          {{ cell ? toNepaliDigits(cell) : "" }}
        </button>
      </div>

      <div class="nepali-date-picker__footer">
        <button type="button" class="link-btn" @click="clearDate">खाली</button>
        <button type="button" class="link-btn" @click="goToday">आज</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import NepaliDate from "nepali-date-converter";

const props = defineProps({
  modelValue: { type: String, default: "" },
  placeholder: { type: String, default: "Select date" },
});
const emit = defineEmits(["update:modelValue"]);

const monthNames = [
  "बैशाख",
  "ज्येष्ठ",
  "असार",
  "श्रावण",
  "भाद्र",
  "आश्विन",
  "कार्तिक",
  "मंसिर",
  "पुष",
  "माघ",
  "फाल्गुण",
  "चैत्र",
];
const weekdayLabels = ["आइत", "सोम", "मंगल", "बुध", "बिहि", "शुक्र", "शनि"];
const nepaliDigits = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

const toNepaliDigits = (value) =>
  String(value).replace(/[0-9]/g, (digit) => nepaliDigits[Number(digit)]);

const open = ref(false);
const rootEl = ref(null);

const bsFromAdString = (adString) => {
  if (!adString) return null;
  try {
    const d = new Date(`${adString}T00:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    return new NepaliDate(d).getBS();
  } catch {
    return null;
  }
};

const currentBS = () => new NepaliDate(new Date()).getBS();

const initial = bsFromAdString(props.modelValue) || currentBS();
const viewYear = ref(initial.year);
const viewMonth = ref(initial.month);

watch(
  () => props.modelValue,
  (value) => {
    const bs = bsFromAdString(value);
    if (bs) {
      viewYear.value = bs.year;
      viewMonth.value = bs.month;
    }
  },
);

const daysInBSMonth = (year, monthIndex) => {
  for (let d = 28; d <= 32; d += 1) {
    try {
      const next = new NepaliDate(year, monthIndex, d + 1).getBS();
      if (next.month !== monthIndex || next.year !== year) return d;
    } catch {
      return d;
    }
  }
  return 30;
};

const gridCells = computed(() => {
  const firstDay = new NepaliDate(viewYear.value, viewMonth.value, 1);
  const startWeekday = firstDay.getDay();
  const totalDays = daysInBSMonth(viewYear.value, viewMonth.value);

  const cells = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= totalDays; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
});

const displayText = computed(() => {
  if (!props.modelValue) return props.placeholder;
  const bs = bsFromAdString(props.modelValue);
  if (!bs) return props.placeholder;
  return `${toNepaliDigits(bs.date)} ${monthNames[bs.month]} ${toNepaliDigits(bs.year)}`;
});

const isSelected = (day) => {
  if (!day || !props.modelValue) return false;
  const bs = bsFromAdString(props.modelValue);
  if (!bs) return false;
  return (
    bs.year === viewYear.value &&
    bs.month === viewMonth.value &&
    bs.date === day
  );
};

const toIsoDateString = (jsDate) => {
  const y = jsDate.getFullYear();
  const m = String(jsDate.getMonth() + 1).padStart(2, "0");
  const d = String(jsDate.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const selectDay = (day) => {
  const picked = new NepaliDate(viewYear.value, viewMonth.value, day);
  emit("update:modelValue", toIsoDateString(picked.toJsDate()));
  open.value = false;
};

const clearDate = () => {
  emit("update:modelValue", "");
  open.value = false;
};

const goToday = () => {
  const todayBS = currentBS();
  viewYear.value = todayBS.year;
  viewMonth.value = todayBS.month;
  const picked = new NepaliDate(todayBS.year, todayBS.month, todayBS.date);
  emit("update:modelValue", toIsoDateString(picked.toJsDate()));
  open.value = false;
};

const prevMonth = () => {
  if (viewMonth.value === 0) {
    viewMonth.value = 11;
    viewYear.value -= 1;
  } else {
    viewMonth.value -= 1;
  }
};

const nextMonth = () => {
  if (viewMonth.value === 11) {
    viewMonth.value = 0;
    viewYear.value += 1;
  } else {
    viewMonth.value += 1;
  }
};

const toggleOpen = () => {
  open.value = !open.value;
};

const handleOutsideClick = (event) => {
  if (rootEl.value && !rootEl.value.contains(event.target)) {
    open.value = false;
  }
};

onMounted(() => {
  document.addEventListener("mousedown", handleOutsideClick);
});
onBeforeUnmount(() => {
  document.removeEventListener("mousedown", handleOutsideClick);
});
</script>

<style scoped>
.nepali-date-picker {
  position: relative;
}

.nepali-date-picker__trigger {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--panel-border);
  background: var(--panel);
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  font-size: 0.88rem;
}

.nepali-date-picker__placeholder {
  color: #9ba2b5;
}

.nepali-date-picker__panel {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 40;
  width: 280px;
  background: var(--panel);
  border: 1px solid var(--panel-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow);
  padding: 12px;
}

.nepali-date-picker__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.nepali-date-picker__nav {
  display: flex;
  gap: 6px;
}

.nepali-date-picker__nav button {
  width: 26px;
  height: 26px;
  border: 1px solid var(--panel-border);
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
}

.nepali-date-picker__weekdays,
.nepali-date-picker__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
  text-align: center;
}

.nepali-date-picker__weekdays span {
  font-size: 0.72rem;
  color: var(--muted);
  font-weight: 600;
  padding: 4px 0;
}

.nepali-date-picker__day {
  height: 30px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.82rem;
  color: var(--text);
}

.nepali-date-picker__day:hover:not(:disabled) {
  background: rgba(37, 99, 235, 0.1);
}

.nepali-date-picker__day--empty {
  visibility: hidden;
  cursor: default;
}

.nepali-date-picker__day--selected {
  background: var(--gold);
  color: #ffffff;
  font-weight: 700;
}

.nepali-date-picker__footer {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--panel-border);
}

.link-btn {
  border: none;
  background: transparent;
  color: var(--gold);
  cursor: pointer;
  font-weight: 600;
  font-size: 0.82rem;
}
</style>
