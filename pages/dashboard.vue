<script setup lang="ts">
// Use the dashboard layout
definePageMeta({
  layout: 'dashboard'
})

import { onMounted } from 'vue'

// Lazy load dashboard components for better performance and bundle splitting
const DashboardAccountData = defineAsyncComponent(() => import('@/components/Dashboard/AccountData.vue'))
const DashboardLivePricing = defineAsyncComponent(() => import('@/components/Dashboard/LivePricingSimple.vue'))
const DashboardMarketStatus = defineAsyncComponent(() => import('@/components/Dashboard/MarketStatus.vue'))
const DashboardTradingView = defineAsyncComponent(() => import('@/components/Dashboard/TradingView.vue'))
const DashboardQuickStats = defineAsyncComponent(() => import('@/components/Dashboard/QuickStats.vue'))

// SEO Meta Tags
useHead({
  title: 'Dashboard - ADVOAI Trading Engine',
  meta: [
    { name: 'description', content: 'Monitor your trading performance, positions, and real-time market data with advanced analytics.' },
    { name: 'robots', content: 'noindex, nofollow' } // Private dashboard
  ]
})

onMounted(() => {
  const logger = useLogger()
  logger.info('Dashboard loaded', 'Welcome to ADVOAI Trading Engine')
})
</script>

<template>
  <div class="flex-1 p-6 bg-background">
    <!-- Quick Stats -->
    <DashboardQuickStats />

    <div class="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full">
      <!-- Left side - Chart (3 columns) -->
      <div class="xl:col-span-3">
        <DashboardTradingView />
      </div>

      <!-- Right side - Data panels (1 column) -->
      <div class="space-y-6">
        <DashboardMarketStatus />
        <DashboardAccountData />
        <DashboardLivePricing />
      </div>
    </div>
  </div>
</template>