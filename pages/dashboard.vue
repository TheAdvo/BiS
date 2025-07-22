<script setup lang="ts">
import LivePricing from '~/components/Dashboard/LivePricing.vue';

</script>

<template>
  <div class="@container mx-auto max-w-7xl p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
    <DashboardAccount />
    <DashboardOpenPositions />
    <LivePricing />
  </div>
</template>
