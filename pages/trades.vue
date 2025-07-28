<script setup lang="ts">
// Use the dashboard layout
definePageMeta({
  layout: 'dashboard'
})

import { onMounted } from 'vue'
// Lazy load dashboard components for better performance
const DashboardTradesTable = defineAsyncComponent(() => import('@/components/Dashboard/TradesTable.vue'))

// SEO Meta Tags
useHead({
  title: 'Trade History - ADVOAI Trading Engine',
  meta: [
    { name: 'description', content: 'Review your executed trades and performance history with detailed analytics and statistics.' },
    { name: 'robots', content: 'noindex, nofollow' } // Private dashboard
  ]
})

onMounted(() => {
  const logger = useLogger()
  logger.info('Trades loaded', 'Viewing your trading history')
})
</script>

<template>
  <div class="flex-1 p-6 bg-background">
    <div class="space-y-6">
      <!-- Page Title -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">Trade History</h1>
          <p class="text-muted-foreground">Review your executed trades and performance history</p>
        </div>
        <div class="flex items-center gap-3">
          <select class="px-3 py-2 text-sm border border-border rounded-md bg-background">
            <option value="all">All Trades</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
            Export Data
          </button>
        </div>
      </div>

      <!-- Trade Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="p-4 border border-border rounded-lg bg-card">
          <div class="text-sm font-medium text-muted-foreground">Total Trades</div>
          <div class="text-2xl font-bold">127</div>
          <div class="text-xs text-green-500">+12 this week</div>
        </div>
        <div class="p-4 border border-border rounded-lg bg-card">
          <div class="text-sm font-medium text-muted-foreground">Win Rate</div>
          <div class="text-2xl font-bold text-green-500">68.5%</div>
          <div class="text-xs text-green-500">+2.3% this month</div>
        </div>
        <div class="p-4 border border-border rounded-lg bg-card">
          <div class="text-sm font-medium text-muted-foreground">Total P&L</div>
          <div class="text-2xl font-bold text-green-500">+$4,250.80</div>
          <div class="text-xs text-green-500">+$340.20 today</div>
        </div>
        <div class="p-4 border border-border rounded-lg bg-card">
          <div class="text-sm font-medium text-muted-foreground">Avg Trade</div>
          <div class="text-2xl font-bold">$33.47</div>
          <div class="text-xs text-muted-foreground">Per trade profit</div>
        </div>
      </div>

      <!-- Trades Table -->
      <DashboardTradesTable />
    </div>
  </div>
</template>
