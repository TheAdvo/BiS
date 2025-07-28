<script setup lang="ts">
// Use the dashboard layout
definePageMeta({
  layout: 'dashboard'
})

import { onMounted } from 'vue'
// Lazy load dashboard components for better performance
const DashboardPositionsTable = defineAsyncComponent(() => import('@/components/Dashboard/PositionsTable.vue'))

// Get account data for status indicator
const { data: accountData } = useOandaAccount()

// SEO Meta Tags
useHead({
  title: 'Open Positions - ADVOAI Trading Engine',
  meta: [
    { name: 'description', content: 'Monitor and manage your active trading positions with real-time updates and performance metrics.' },
    { name: 'robots', content: 'noindex, nofollow' } // Private dashboard
  ]
})

// Computed for account status
const accountStatus = computed(() => {
  if (!accountData.value) return { text: 'Offline', color: 'bg-gray-500/10 text-gray-500 border-gray-500/20' }

  const alias = accountData.value.alias?.toLowerCase() || ''
  const accountId = accountData.value.accountID || ''

  if (alias.includes('live') || accountId.includes('001')) {
    return { text: 'Live Trading', color: 'bg-green-500/10 text-green-500 border-green-500/20' }
  } else {
    return { text: 'Demo Trading', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' }
  }
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
          <span class="px-3 py-1 text-sm rounded-full border" :class="accountStatus.color">
            {{ accountStatus.text }}
          </span>
        </div>
      </div>

      <!-- Positions Table -->
      <DashboardPositionsTable />
    </div>
  </div>
</template>
