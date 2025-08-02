<template>
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
    <!-- Active Bots/Trades -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Active Trades</CardTitle>
        <Bot class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div v-if="tradesPending" class="text-2xl font-bold animate-pulse opacity-50 transition-opacity duration-300">{{ stats.activeBots || '--' }}</div>
        <div v-else-if="tradesError" class="text-2xl font-bold text-destructive">Error</div>
        <div v-else class="text-2xl font-bold transition-all duration-300">{{ stats.activeBots }}</div>
        <p class="text-xs text-muted-foreground">
          <span class="text-green-500">+{{ stats.botsStartedToday }}</span> opened today
        </p>
      </CardContent>
    </Card>

    <!-- Total P&L -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Unrealized P&L</CardTitle>
        <TrendingUp class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div v-if="accountPending" class="text-2xl font-bold animate-pulse opacity-50 transition-opacity duration-300">${{ stats.totalPnL ? Math.abs(stats.totalPnL).toFixed(2) : '--' }}</div>
        <div v-else-if="accountError" class="text-2xl font-bold text-destructive">Error</div>
        <div v-else class="text-2xl font-bold transition-all duration-300" :class="stats.totalPnL >= 0 ? 'text-green-500' : 'text-destructive'">
          {{ stats.totalPnL >= 0 ? '+' : '' }}${{ Math.abs(stats.totalPnL).toFixed(2) }}
        </div>
        <p class="text-xs text-muted-foreground">
          <span :class="stats.pnlChange >= 0 ? 'text-green-500' : 'text-destructive'">
            {{ stats.pnlChange >= 0 ? '+' : '' }}{{ stats.pnlChange.toFixed(1) }}%
          </span> of balance
        </p>
      </CardContent>
    </Card>

    <!-- Total Trades -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Trades Today</CardTitle>
        <Activity class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div v-if="tradesPending" class="text-2xl font-bold animate-pulse opacity-50 transition-opacity duration-300">{{ stats.tradesToday || '--' }}</div>
        <div v-else-if="tradesError" class="text-2xl font-bold text-destructive">Error</div>
        <div v-else class="text-2xl font-bold transition-all duration-300">{{ stats.tradesToday }}</div>
        <p class="text-xs text-muted-foreground">
          Win Rate: <span class="text-green-500">{{ stats.winRate.toFixed(1) }}%</span>
        </p>
      </CardContent>
    </Card>

    <!-- API Status -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">API Status</CardTitle>
        <Wifi class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="flex items-center gap-2">
          <div class="text-2xl font-bold">{{ stats.apiLatency }}ms</div>
          <Badge variant="outline" class="text-xs">
            <div class="w-1.5 h-1.5 rounded-full mr-1" :class="accountError || tradesError || positionsError ? 'bg-red-500' : 'bg-green-500'"></div>
            {{ accountError || tradesError || positionsError ? 'Error' : 'Connected' }}
          </Badge>
        </div>
        <p class="text-xs text-muted-foreground">
          OANDA API • {{ stats.uptime }}% uptime
        </p>
      </CardContent>
    </Card>
  </div>

  <!-- Trading Engine Status Bar -->
  <div class="mb-6">
    <Card>
      <CardContent class="p-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full animate-pulse" :class="accountError || tradesError || positionsError ? 'bg-red-500' : 'bg-green-500'"></div>
              <span class="text-sm font-medium">
                {{ accountError || tradesError || positionsError ? 'Trading Engine Error' : 'Trading Engine Online' }}
              </span>
            </div>
            <div class="text-sm text-muted-foreground">
              {{ stats.engineUptime }} uptime
            </div>
            <div v-if="accountData" class="text-sm text-muted-foreground">
              {{ accountData.openTradeCount }} open trade{{ accountData.openTradeCount !== 1 ? 's' : '' }}
            </div>
          </div>

          <div class="flex items-center gap-6">
            <div class="text-sm">
              <span class="text-muted-foreground">Balance:</span>
              <span class="ml-1 font-medium">${{ accountData ? parseFloat(accountData.balance).toFixed(2) : '--' }}</span>
            </div>
            <div class="text-sm">
              <span class="text-muted-foreground">Market:</span>
              <Badge variant="outline" class="ml-1" :class="stats.marketStatus === 'OPEN' ? 'text-green-600' : 'text-red-600'">
                {{ stats.marketStatus }}
              </Badge>
            </div>
            <div class="text-sm">
              <span class="text-muted-foreground">Margin Used:</span>
              <span class="ml-1">${{ accountData ? parseFloat(accountData.marginUsed).toFixed(2) : '--' }}</span>
            </div>
            <Button variant="outline" size="sm" @click="refreshStats" :disabled="isRefreshing">
              <RefreshCw class="w-3 h-3 mr-1" :class="{ 'animate-spin': isRefreshing }" />
              Refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bot, TrendingUp, Activity, Wifi, RefreshCw } from 'lucide-vue-next'
import { ref, onMounted, onUnmounted, computed } from 'vue'

import { useOandaStore } from '@/stores/oanda'

// Use centralized OANDA store (Pinia)
const oanda = useOandaStore()

// State from Pinia store
const accountData = computed(() => oanda.getAccount)
const tradesData = computed(() => oanda.getTrades)
const positionsData = computed(() => oanda.getPositions)
const accountPending = computed(() => oanda.getIsAccountLoading)
const tradesPending = computed(() => oanda.getIsTradesLoading)
const positionsPending = computed(() => oanda.getIsPositionsLoading)
const accountError = computed(() => oanda.getAccountError)
const tradesError = computed(() => oanda.getTradesError)
const positionsError = computed(() => oanda.getPositionsError)
const refreshAll = oanda.refreshAll
const storeRefreshing = computed(() => oanda.isRefreshing)

// State
const isRefreshing = ref(false)
const apiLatency = ref(0)
const engineStartTime = ref(new Date())

// Helper function to determine if market is open
const isMarketOpen = (): boolean => {
  const now = new Date()
  const day = now.getUTCDay() // 0 = Sunday, 1 = Monday, etc.
  const hour = now.getUTCHours()
  const minutes = now.getUTCMinutes()
  const totalMinutes = hour * 60 + minutes

  // Forex market is closed on weekends
  if (day === 0 || day === 6) return false

  // Market opens Sunday 21:00 UTC and closes Friday 21:00 UTC
  if (day === 1 && totalMinutes < 21 * 60) return false // Monday before 21:00
  if (day === 5 && totalMinutes >= 21 * 60) return false // Friday after 21:00

  return true
}

// Calculate win rate from trades data
const calculateWinRate = (): number => {
  if (!tradesData.value?.trades || tradesData.value.trades.length === 0) return 0

  const winningTrades = tradesData.value.trades.filter(trade => parseFloat(trade.unrealizedPL) > 0)
  return (winningTrades.length / tradesData.value.trades.length) * 100
}

// Calculate system uptime
const getEngineUptime = (): string => {
  const now = new Date()
  const diff = now.getTime() - engineStartTime.value.getTime()

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (days > 0) return `${days}d ${hours}h ${minutes}m`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

// Computed stats from real data
const stats = computed(() => {
  const account = accountData.value
  const trades = tradesData.value?.trades || []
  const positions = positionsData.value?.positions || []

  // Debug logging
  if (process.client) {
    console.log('BotQuickStats - Account data:', account)
    console.log('BotQuickStats - Trades data:', trades)
    console.log('BotQuickStats - Positions data:', positions)
  }

  return {
    // Real data from OANDA
    activeBots: trades.length, // Use open trades as "active bots"
    botsStartedToday: trades.filter(trade => {
      const today = new Date().toDateString()
      const tradeDate = new Date(trade.openTime).toDateString()
      return today === tradeDate
    }).length,
    totalPnL: account ? parseFloat(account.unrealizedPL || '0') : 0,
    pnlChange: account ? (parseFloat(account.unrealizedPL || '0') / parseFloat(account.balance || '1')) * 100 : 0,
    tradesToday: trades.filter(trade => {
      const today = new Date().toDateString()
      const tradeDate = new Date(trade.openTime).toDateString()
      return today === tradeDate
    }).length,
    winRate: calculateWinRate(),
    apiLatency: apiLatency.value,
    uptime: 99.9, // This would need server monitoring in real implementation
    engineUptime: getEngineUptime(),
    marketStatus: isMarketOpen() ? 'OPEN' : 'CLOSED',
    cpuUsage: Math.floor(Math.random() * 30) + 15, // Would need system monitoring
    memoryUsage: Math.floor(Math.random() * 20) + 35 // Would need system monitoring
  }
})

// Methods
const refreshStats = async () => {
  try {
    isRefreshing.value = true

    // Measure API latency
    const startTime = performance.now()

    // Use centralized refresh instead of individual calls
    await refreshAll(true) // Force refresh

    const endTime = performance.now()
    apiLatency.value = Math.round(endTime - startTime)

  } catch (error) {
    console.error('Failed to refresh stats:', error)
  } finally {
    isRefreshing.value = false
  }
}

// Auto-refresh stats every 30 seconds
let statsInterval: NodeJS.Timeout | null = null

onMounted(() => {
  // Initial refresh
  refreshStats()
  // Set up interval
  statsInterval = setInterval(refreshStats, 30000)
})

onUnmounted(() => {
  if (statsInterval) {
    clearInterval(statsInterval)
  }
})
</script>

<style scoped>
/* Smooth transitions for value changes */
.text-2xl {
  transition: all 0.3s ease;
}

.text-green-500,
.text-destructive {
  transition: color 0.3s ease;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: .5;
  }
}
</style>
