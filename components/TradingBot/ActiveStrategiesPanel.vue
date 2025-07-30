<template>
  <div class="w-full h-[800px]">
    <Card class="h-full">
      <CardHeader class="">
        <div class="flex items-center justify-between">
          <CardTitle class="text-base font-bold flex items-center gap-2">
            <Zap class="w-4 h-4" />
            <span>Active Strategies</span>
            <Badge variant="outline" class="text-xs transition-all duration-300">
              <div class="w-1.5 h-1.5 rounded-full mr-1 transition-all duration-300" :class="tradesPending || positionsPending ? 'bg-yellow-500 animate-pulse' : 'bg-orange-500 animate-pulse'"></div>
              <span class="transition-all duration-300">{{ tradesPending || positionsPending ? 'Updating' : 'Live' }}</span>
            </Badge>
          </CardTitle>
          <Button variant="outline" size="sm" @click="refreshStrategies">
            <RefreshCw class="w-3 h-3 mr-1" :class="{ 'animate-spin': isRefreshing }" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent class="overflow-y-auto h-[720px] p-0 min-h-[400px]">
        <!-- Strategy List with Skeleton Loading -->
        <TransitionGroup name="strategy" tag="div" class="divide-y divide-border">
          <!-- Show skeleton loaders during initial load only -->
          <template v-if="shouldShowSkeleton">
            <div v-for="i in 3" :key="`skeleton-${i}`" class="p-4 animate-pulse">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-gray-200"></div>
                  <div>
                    <div class="h-4 w-32 bg-gray-200 rounded mb-1"></div>
                    <div class="h-3 w-20 bg-gray-200 rounded"></div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <div class="h-5 w-16 bg-gray-200 rounded"></div>
                  <div class="h-6 w-6 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4 mb-3">
                <div v-for="j in 4" :key="j" class="space-y-1">
                  <div class="h-3 w-16 bg-gray-200 rounded"></div>
                  <div class="h-4 w-12 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          </template>

          <!-- Error State -->
          <div v-else-if="tradesError || positionsError" key="error" class="flex items-center justify-center h-32">
            <div class="text-sm text-red-600">Error loading strategy data</div>
          </div>

          <!-- Strategy List -->
          <template v-else-if="strategies.length > 0">
            <div v-for="strategy in strategies" :key="strategy.id" class="p-4 hover:bg-accent/50 transition-all duration-200">
              <!-- Strategy Header -->
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors duration-200" :class="getStrategyStatusColor(strategy.status)">
                    <span class="text-sm">{{ getCurrencyFlag(strategy.instruments[0]) }}</span>
                  </div>
                  <div>
                    <div class="font-medium text-sm">{{ strategy.name }}</div>
                    <div class="text-xs text-muted-foreground">{{ strategy.instruments.join(', ') }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <Badge :variant="getStrategyStatusVariant(strategy.status)" class="text-xs transition-colors duration-200">
                    {{ strategy.status }}
                  </Badge>
                  <Button variant="ghost" size="sm" class="h-6 w-6 p-0 transition-opacity duration-200" @click="toggleStrategy(strategy)">
                    <Play v-if="strategy.status === 'stopped'" class="h-3 w-3" />
                    <Pause v-else class="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <!-- Performance Metrics -->
              <div class="grid grid-cols-2 gap-4 mb-3">
                <div class="space-y-1">
                  <div class="text-xs text-muted-foreground">P&L Today</div>
                  <div class="text-sm font-medium transition-colors duration-300" :class="strategy.pnlToday >= 0 ? 'text-green-500' : 'text-red-500'">
                    {{ strategy.pnlToday >= 0 ? '+' : '' }}${{ strategy.pnlToday.toFixed(2) }}
                  </div>
                </div>
                <div class="space-y-1">
                  <div class="text-xs text-muted-foreground">Win Rate</div>
                  <div class="text-sm font-medium">{{ strategy.winRate.toFixed(1) }}%</div>
                </div>
                <div class="space-y-1">
                  <div class="text-xs text-muted-foreground">Trades</div>
                  <div class="text-sm font-medium">{{ strategy.tradesCount }}</div>
                </div>
                <div class="space-y-1">
                  <div class="text-xs text-muted-foreground">Risk</div>
                  <div class="text-sm font-medium">{{ strategy.riskLevel.toFixed(1) }}%</div>
                </div>
              </div>

              <!-- Current Positions -->
              <div v-if="strategy.positions.length > 0" class="space-y-2">
                <div class="text-xs text-muted-foreground font-medium">Open Positions</div>
                <div class="space-y-1">
                  <TransitionGroup name="position" tag="div" class="space-y-1">
                    <div v-for="position in strategy.positions" :key="position.id" class="flex items-center justify-between text-xs bg-accent/30 rounded p-2 transition-all duration-200">
                      <div class="flex items-center gap-2">
                        <Badge :variant="position.side === 'LONG' ? 'default' : 'destructive'" class="text-xs px-1 py-0">
                          {{ position.side }}
                        </Badge>
                        <span>{{ position.instrument }}</span>
                        <span class="text-muted-foreground">{{ position.units }} units</span>
                      </div>
                      <div class="flex items-center gap-2">
                        <span>{{ position.entryPrice }}</span>
                        <span class="transition-colors duration-300" :class="position.pnl >= 0 ? 'text-green-500' : 'text-red-500'">
                          {{ position.pnl >= 0 ? '+' : '' }}${{ position.pnl.toFixed(2) }}
                        </span>
                      </div>
                    </div>
                  </TransitionGroup>
                </div>
              </div>

              <!-- Recent Activity -->
              <div v-if="strategy.recentTrades.length > 0" class="mt-3 pt-3 border-t">
                <div class="text-xs text-muted-foreground font-medium mb-2">Recent Activity</div>
                <div class="space-y-1">
                  <TransitionGroup name="trade" tag="div" class="space-y-1">
                    <div v-for="trade in strategy.recentTrades.slice(0, 3)" :key="trade.id" class="flex items-center justify-between text-xs transition-all duration-200">
                      <div class="flex items-center gap-2">
                        <span class="text-muted-foreground">{{ formatTime(trade.timestamp) }}</span>
                        <Badge :variant="trade.type === 'BUY' ? 'default' : 'destructive'" class="text-xs px-1 py-0">
                          {{ trade.type }}
                        </Badge>
                        <span>{{ trade.instrument }}</span>
                      </div>
                      <span class="transition-colors duration-300" :class="trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'">
                        {{ trade.pnl >= 0 ? '+' : '' }}${{ trade.pnl.toFixed(2) }}
                      </span>
                    </div>
                  </TransitionGroup>
                </div>
              </div>
            </div>
          </template>

          <!-- Empty State -->
          <div v-else key="empty" class="flex flex-col items-center justify-center h-32 text-center">
            <Zap class="w-8 h-8 text-muted-foreground mb-2" />
            <p class="text-sm text-muted-foreground">No active strategies</p>
            <p class="text-xs text-muted-foreground mt-1">Open trades to see live strategies</p>
          </div>
        </TransitionGroup>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Zap, RefreshCw, Play, Pause } from 'lucide-vue-next'
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import type { OandaTrade, OandaPosition } from '@/types/Oanda'
import { useOandaStore } from '@/stores/oanda'

// Use centralized OANDA store instead of individual composables
const {
  account: accountData,
  trades: tradesData,
  positions: positionsData,
  accountError,
  tradesError,
  positionsError,
  isTradesLoading: tradesPending,
  isPositionsLoading: positionsPending,
  refreshTrades,
  refreshPositions,
  isRefreshing: storeRefreshing
} = useOandaStore()

// State
const isRefreshing = ref(false)
const isInitialLoad = ref(true)

// Computed property to determine if we should show skeleton loading
const shouldShowSkeleton = computed(() => {
  return isInitialLoad.value && (tradesPending.value || positionsPending.value)
})

// Watch for data changes to update initial load state
watch([tradesData, positionsData], () => {
  if (tradesData.value || positionsData.value) {
    isInitialLoad.value = false
  }
})

// Helper functions
const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getCurrencyFlag = (instrument: string): string => {
  const flags: Record<string, string> = {
    'EUR_USD': '🇪🇺🇺🇸',
    'GBP_USD': '🇬🇧🇺🇸',
    'USD_JPY': '🇺🇸🇯🇵',
    'AUD_USD': '🇦🇺🇺🇸',
    'USD_CAD': '🇺🇸🇨🇦',
    'USD_CHF': '🇺🇸🇨🇭',
    'NZD_USD': '🇳🇿🇺🇸',
    'EUR_GBP': '🇪🇺🇬🇧',
    'EUR_JPY': '🇪🇺🇯🇵',
    'GBP_JPY': '🇬🇧🇯🇵',
    'XAU_USD': '🥇🇺🇸',
    'XAG_USD': '🥈🇺🇸'
  }
  return flags[instrument] || '💱'
}

const getTradeSide = (units: string): 'LONG' | 'SHORT' => {
  return parseFloat(units) > 0 ? 'LONG' : 'SHORT'
}

const formatUnits = (units: string): string => {
  const num = Math.abs(parseFloat(units))
  return num.toLocaleString()
}

// Transform real OANDA data into "strategies" grouped by instrument
const strategies = computed(() => {
  if (!tradesData.value?.trades && !positionsData.value?.positions) return []

  const trades = tradesData.value?.trades || []
  const positions = positionsData.value?.positions || []

  // Debug logging
  if (process.client) {
    console.log('ActiveStrategiesPanel - Trades data:', trades)
    console.log('ActiveStrategiesPanel - Positions data:', positions)
  }

  // Group trades and positions by instrument to create "strategies"
  const instrumentGroups: Record<string, any> = {}

  // Process trades
  trades.forEach((trade: OandaTrade) => {
    if (!instrumentGroups[trade.instrument]) {
      instrumentGroups[trade.instrument] = {
        id: trade.instrument,
        name: `${trade.instrument.replace('_', '/')} Strategy`,
        status: 'running', // All active trades are "running"
        instruments: [trade.instrument],
        trades: [],
        positions: [],
        pnlToday: 0,
        totalPnl: 0,
        tradesCount: 0,
        winningTrades: 0
      }
    }

    const strategy = instrumentGroups[trade.instrument]
    strategy.trades.push(trade)
    strategy.tradesCount++
    strategy.totalPnl += parseFloat(trade.unrealizedPL)

    // Check if trade was opened today
    const today = new Date().toDateString()
    const tradeDate = new Date(trade.openTime).toDateString()
    if (today === tradeDate) {
      strategy.pnlToday += parseFloat(trade.unrealizedPL)
    }

    // Count winning trades
    if (parseFloat(trade.unrealizedPL) > 0) {
      strategy.winningTrades++
    }

    // Convert trade to position format for display
    const side = getTradeSide(trade.currentUnits)
    strategy.positions.push({
      id: trade.id,
      instrument: trade.instrument,
      side,
      units: formatUnits(trade.currentUnits),
      entryPrice: parseFloat(trade.price).toFixed(5),
      pnl: parseFloat(trade.unrealizedPL),
      openTime: trade.openTime
    })
  })

  // Process positions for additional context
  positions.forEach((position: OandaPosition) => {
    if (!instrumentGroups[position.instrument]) {
      instrumentGroups[position.instrument] = {
        id: position.instrument,
        name: `${position.instrument.replace('_', '/')} Strategy`,
        status: 'stopped', // Positions without active trades are "stopped"
        instruments: [position.instrument],
        trades: [],
        positions: [],
        pnlToday: 0,
        totalPnl: 0,
        tradesCount: 0,
        winningTrades: 0
      }
    }

    const strategy = instrumentGroups[position.instrument]
    if (strategy.trades.length === 0) {
      // Only add position info if no active trades
      strategy.totalPnl += parseFloat(position.unrealizedPL)
      strategy.pnlToday += parseFloat(position.unrealizedPL) // Assume all position P&L is from today for simplicity
    }
  })

  // Convert to array and calculate additional metrics
  return Object.values(instrumentGroups).map((strategy: any) => ({
    ...strategy,
    winRate: strategy.tradesCount > 0 ? (strategy.winningTrades / strategy.tradesCount) * 100 : 0,
    riskLevel: Math.min(Math.abs(strategy.totalPnl) / 100, 5.0), // Risk level 0-5%
    recentTrades: strategy.trades
      .sort((a: OandaTrade, b: OandaTrade) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime())
      .slice(0, 5)
      .map((trade: OandaTrade) => ({
        id: trade.id,
        timestamp: trade.openTime,
        type: getTradeSide(trade.currentUnits) === 'LONG' ? 'BUY' : 'SELL',
        instrument: trade.instrument,
        pnl: parseFloat(trade.unrealizedPL)
      }))
  })).sort((a, b) => b.totalPnl - a.totalPnl) // Sort by P&L descending
})

const getStrategyStatusColor = (status: string) => {
  switch (status) {
    case 'running': return 'bg-green-500 text-white'
    case 'stopped': return 'bg-gray-500 text-white'
    case 'error': return 'bg-red-500 text-white'
    default: return 'bg-gray-500 text-white'
  }
}

const getStrategyStatusVariant = (status: string) => {
  switch (status) {
    case 'running': return 'default'
    case 'stopped': return 'secondary'
    case 'error': return 'destructive'
    default: return 'secondary'
  }
}

// Debounce mechanism to prevent rapid successive calls
let refreshTimeout: NodeJS.Timeout | null = null

const refreshStrategies = async () => {
  // Clear any pending refresh
  if (refreshTimeout) {
    clearTimeout(refreshTimeout)
  }

  // Debounce rapid calls
  refreshTimeout = setTimeout(async () => {
    try {
      isRefreshing.value = true

      // Refresh all OANDA data
      await Promise.all([
        refreshTrades(),
        refreshPositions()
      ])

    } catch (error) {
      console.error('Failed to refresh strategies:', error)
    } finally {
      // Add a small delay to prevent flashing
      setTimeout(() => {
        isRefreshing.value = false
      }, 300)
    }
  }, 100) // 100ms debounce
}

const toggleStrategy = async (strategy: any) => {
  try {
    // In a real implementation, this would interact with trading bot controls
    // For now, we just show this is a demo
    console.log(`Toggle strategy: ${strategy.name}`)
    // strategy.status = strategy.status === 'running' ? 'stopped' : 'running'
  } catch (error) {
    console.error(`Failed to toggle strategy:`, error)
  }
}

// Auto-refresh every 30 seconds
let refreshInterval: NodeJS.Timeout | null = null

onMounted(() => {
  // Initial refresh
  refreshStrategies()
  // Set up interval
  refreshInterval = setInterval(refreshStrategies, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>

<style scoped>
/* Strategy list transition animations */
.strategy-enter-active,
.strategy-leave-active {
  transition: all 0.3s ease;
}

.strategy-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.strategy-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.strategy-move {
  transition: transform 0.3s ease;
}

/* Position transition animations */
.position-enter-active,
.position-leave-active {
  transition: all 0.2s ease;
}

.position-enter-from {
  opacity: 0;
  transform: translateX(-10px);
}

.position-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

/* Trade transition animations */
.trade-enter-active,
.trade-leave-active {
  transition: all 0.2s ease;
}

.trade-enter-from {
  opacity: 0;
  transform: scale(0.95);
}

.trade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}

/* Smooth color transitions for P&L values */
.text-green-500,
.text-red-500 {
  transition: color 0.3s ease;
}

/* Prevent layout shift during loading */
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

/* Skeleton loading styles */
.bg-gray-200 {
  background-color: rgb(229 231 235);
}

@media (prefers-color-scheme: dark) {
  .bg-gray-200 {
    background-color: rgb(55 65 81);
  }
}
</style>
