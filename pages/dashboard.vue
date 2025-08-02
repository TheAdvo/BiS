<script setup lang="ts">
// Use the dashboard layout
definePageMeta({
  layout: 'dashboard'
})

import { onMounted } from 'vue'

// Import trading bot components directly
import BotManagementPanel from '@/components/TradingBot/BotManagementPanel.vue'
import StrategyScriptEditor from '@/components/TradingBot/StrategyScriptEditor.vue'
import BotPerformanceMonitor from '@/components/TradingBot/BotPerformanceMonitor.vue'
import ActiveStrategiesPanel from '@/components/TradingBot/ActiveStrategiesPanel.vue'
import SimplifiedMarketAnalysis from '@/components/TradingBot/SimplifiedMarketAnalysis.vue'
import BotQuickStats from '@/components/TradingBot/BotQuickStats.vue'

import { useOandaStore } from '~/stores/oanda'


// Use Pinia OANDA store
const oanda = useOandaStore()
const refreshAll = oanda.refreshAll
const refreshAccount = oanda.refreshAccount
const startAutoRefresh = useOandaAutoRefresh().start

// SEO Meta Tags
useHead({
  title: 'Trading Bot Engine - Automated Strategy Execution',
  meta: [
    { name: 'description', content: 'Advanced trading bot engine with custom JavaScript strategy scripting, real-time execution, and performance monitoring.' },
    { name: 'robots', content: 'noindex, nofollow' } // Private dashboard
  ]
})

onMounted(async () => {
  const logger = useLogger()
  logger.info('Trading Bot Engine loaded', 'Welcome to ADVOAI Bot Dashboard')


  // Initial data load
  await refreshAll()

  // Start centralized auto-refresh for all components
  startAutoRefresh()
})
</script>

<template>

  <div class="flex-1 p-6 bg-background">
    <!-- OANDA Account Info -->
    <div class="mb-4 p-4 rounded bg-card shadow flex flex-col gap-2">
      <template v-if="oanda.getIsAccountLoading">
        <span class="text-muted">Loading account...</span>
      </template>
      <template v-else-if="oanda.getAccountError">
        <span class="text-error">Error: {{ oanda.getAccountError }}</span>
      </template>
      <template v-else-if="oanda.getAccount">
        <div class="flex gap-4 items-center">
          <span class="font-bold">Account:</span>
          <span>{{ oanda.getAccount.accountID }}</span>
          <span class="font-bold">Balance:</span>
          <span>{{ oanda.getAccount.balance }} {{ oanda.getAccount.currency }}</span>
        </div>
      </template>
    </div>

    <!-- Bot Quick Stats -->
    <BotQuickStats />

    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full">
      <!-- Left side - Strategy Editor & Management (5 columns) -->
      <div class="xl:col-span-5 space-y-2">
        <StrategyScriptEditor />
        <BotManagementPanel />
      </div>

      <!-- Center - Market Analysis & Performance (4 columns) -->
      <div class="xl:col-span-4 space-y-6">
        <SimplifiedMarketAnalysis />
        <BotPerformanceMonitor />
      </div>

      <!-- Right side - Active Bots & Control (3 columns) -->
      <div class="xl:col-span-3">
        <ActiveStrategiesPanel />
      </div>
    </div>
  </div>
</template>