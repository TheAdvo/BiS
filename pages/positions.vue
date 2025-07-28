<script setup lang="ts">
import { onMounted } from 'vue'
import DashboardPositionsTable from '@/components/Dashboard/PositionsTable.vue'

// Use the dashboard layout
definePageMeta({
  layout: 'dashboard'
})

// SEO Meta Tags
useHead({
  title: 'Open Positions - ADVOAI Trading Engine',
  meta: [
    { name: 'description', content: 'Monitor and manage your active trading positions with real-time updates and performance metrics.' },
    { name: 'robots', content: 'noindex, nofollow' } // Private dashboard
  ]
})

onMounted(() => {
  const logger = useLogger()
  logger.info('Positions loaded', 'Monitoring your open positions')
})
</script>

<template>
  <div class="flex-1 p-6 bg-background">
    <div class="space-y-6">
      <!-- Page Title -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight">Open Positions</h1>
          <p class="text-muted-foreground">Monitor and manage your active trading positions</p>
        </div>
        <div class="flex items-center gap-2">
          <span class="px-3 py-1 text-sm bg-green-500/10 text-green-500 rounded-full border border-green-500/20">
            Live Trading
          </span>
        </div>
      </div>

      <!-- Positions Table -->
      <DashboardPositionsTable />
    </div>
  </div>
</template>
