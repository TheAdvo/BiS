<script setup lang="ts">
// Components
import StrategyScriptEditor from '@/components/TradingBot/StrategyScriptEditor.vue'
import MarketOverview from '~/components/TradingBot/MarketOverview.vue'
import BotQuickStats from '@/components/TradingBot/BotQuickStats.vue'
import AccountCard from '@/components/Dashboard/AccountCard.vue'
import MaCrossoverPanel from '@/components/TradingBot/MaCrossoverPanel.vue'

definePageMeta({ layout: 'dashboard' })

// --- Account store ---

// SEO Meta Tags
useHead({
  title: 'ADVO Engine - Automated Strategy Execution',
  meta: [
    { name: 'description', content: 'Advanced trading bot engine with custom JavaScript strategy scripting, real-time execution, and performance monitoring.' },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})


</script>

<template>
  <div class="flex-1 p-6 bg-background">
    <!-- OANDA Account Info -->
    <AccountCard />
    <BotQuickStats />

    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full">
      <!-- Left side - Strategy Editor & Management (5 columns) -->
      <div class="xl:col-span-5 space-y-6">
        <ClientOnly>
          <StrategyScriptEditor />
        </ClientOnly>
      </div>

      <!-- Center - Market Analysis & Performance (4 columns) -->
      <div class="xl:col-span-4 space-y-6">
        <MarketOverview />
      </div>

      <!-- Right side - Active Bots & Control (3 columns) -->
      <div class="xl:col-span-3 space-y-6">
        <MaCrossoverPanel />
      </div>
    </div>
  </div>
</template>