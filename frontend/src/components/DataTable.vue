<template>
  <div class="data-table-shell">
    <div class="data-table-shell__head">
      <slot name="head" />
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <slot />
      </table>
    </div>
    <div v-if="$slots.footer" class="data-table-shell__footer">
      <slot name="footer" />
    </div>
  </div>
</template>
