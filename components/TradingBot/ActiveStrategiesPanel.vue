<template>
  <div class="w-full h-[800px]">
    <Card class="h-full">
      <CardHeader class="pb-3 border-b">
        <div class="flex items-center justify-between">
          <CardTitle class="text-base font-bold flex items-center gap-2">
            <Zap class="w-4 h-4" />
            <span>Active Strategies</span>
            <Badge variant="outline" class="text-xs">
              <div class="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1 animate-pulse"></div>
              Live
            </Badge>
          </CardTitle>
          <Button variant="outline" size="sm" @click="refreshStrategies">
            <RefreshCw class="w-3 h-3 mr-1" :class="{ 'animate-spin': isRefreshing }" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent class="overflow-y-auto h-[720px] p-0">
        <!-- Strategy List -->
        <div v-if="strategies.length > 0" class="divide-y divide-border">
          <div v-for="strategy in strategies" :key="strategy.id" class="p-4 hover:bg-accent/50 transition-colors">
            <!-- Strategy Header -->
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium" :class="getStrategyStatusColor(strategy.status)">
                  <Zap class="w-3 h-3" />
                </div>
                <div>
                  <div class="font-medium text-sm">{{ strategy.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ strategy.instruments.join(', ') }}</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <Badge :variant="getStrategyStatusVariant(strategy.status)" class="text-xs">
                  {{ strategy.status }}
                </Badge>
                <Button variant="ghost" size="sm" class="h-6 w-6 p-0" @click="toggleStrategy(strategy)">
                  <Play v-if="strategy.status === 'stopped'" class="h-3 w-3" />
                  <Pause v-else class="h-3 w-3" />
                </Button>
              </div>
            </div>

            <!-- Performance Metrics -->
            <div class="grid grid-cols-2 gap-4 mb-3">
              <div class="space-y-1">
                <div class="text-xs text-muted-foreground">P&L Today</div>
                <div class="text-sm font-medium" :class="strategy.pnlToday >= 0 ? 'text-green-500' : 'text-red-500'">
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
                <div class="text-sm font-medium">{{ strategy.riskLevel }}%</div>
              </div>
            </div>

            <!-- Current Positions -->
            <div v-if="strategy.positions.length > 0" class="space-y-2">
              <div class="text-xs text-muted-foreground font-medium">Open Positions</div>
              <div class="space-y-1">
                <div v-for="position in strategy.positions" :key="position.id" class="flex items-center justify-between text-xs bg-accent/30 rounded p-2">
                  <div class="flex items-center gap-2">
                    <Badge :variant="position.side === 'LONG' ? 'default' : 'destructive'" class="text-xs px-1 py-0">
                      {{ position.side }}
                    </Badge>
                    <span>{{ position.instrument }}</span>
                    <span class="text-muted-foreground">{{ position.units }} units</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <span>{{ position.entryPrice }}</span>
                    <span :class="position.pnl >= 0 ? 'text-green-500' : 'text-red-500'">
                      {{ position.pnl >= 0 ? '+' : '' }}${{ position.pnl.toFixed(2) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Recent Activity -->
            <div v-if="strategy.recentTrades.length > 0" class="mt-3 pt-3 border-t">
              <div class="text-xs text-muted-foreground font-medium mb-2">Recent Activity</div>
              <div class="space-y-1">
                <div v-for="trade in strategy.recentTrades.slice(0, 3)" :key="trade.id" class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-2">
                    <span class="text-muted-foreground">{{ formatTime(trade.timestamp) }}</span>
                    <Badge :variant="trade.type === 'BUY' ? 'default' : 'destructive'" class="text-xs px-1 py-0">
                      {{ trade.type }}
                    </Badge>
                    <span>{{ trade.instrument }}</span>
                  </div>
                  <span :class="trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'">
                    {{ trade.pnl >= 0 ? '+' : '' }}${{ trade.pnl.toFixed(2) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex flex-col items-center justify-center h-32 text-center">
          <Zap class="w-8 h-8 text-muted-foreground mb-2" />
          <p class="text-sm text-muted-foreground">No active strategies</p>
          <p class="text-xs text-muted-foreground mt-1">Deploy a bot to see live strategies</p>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Zap, RefreshCw, Play, Pause } from 'lucide-vue-next'
import { ref, onMounted } from 'vue'

// Types
interface Position {
  id: string
  instrument: string
  side: 'LONG' | 'SHORT'
  units: number
  entryPrice: string
  pnl: number
}

interface Trade {
  id: string
  timestamp: string
  type: 'BUY' | 'SELL'
  instrument: string
  pnl: number
}

interface Strategy {
  id: string
  name: string
  status: 'running' | 'stopped' | 'error'
  instruments: string[]
  pnlToday: number
  winRate: number
  tradesCount: number
  riskLevel: number
  positions: Position[]
  recentTrades: Trade[]
}

// State
const strategies = ref<Strategy[]>([])
const isRefreshing = ref(false)

// Methods
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

const formatTime = (timestamp: string) => {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  })
}

const refreshStrategies = async () => {
  try {
    isRefreshing.value = true
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))
    // In real implementation, fetch from API
  } catch (error) {
    console.error('Failed to refresh strategies:', error)
  } finally {
    isRefreshing.value = false
  }
}

const toggleStrategy = async (strategy: Strategy) => {
  try {
    const action = strategy.status === 'running' ? 'stop' : 'start'
    // API call would go here
    strategy.status = action === 'start' ? 'running' : 'stopped'
  } catch (error) {
    console.error(`Failed to ${strategy.status === 'running' ? 'stop' : 'start'} strategy:`, error)
  }
}

// Load mock data
const loadMockData = () => {
  strategies.value = [
    {
      id: '1',
      name: 'Scalper Pro',
      status: 'running',
      instruments: ['EUR_USD', 'GBP_USD'],
      pnlToday: 127.45,
      winRate: 72.3,
      tradesCount: 15,
      riskLevel: 1.5,
      positions: [
        {
          id: 'pos1',
          instrument: 'EUR_USD',
          side: 'LONG',
          units: 10000,
          entryPrice: '1.17420',
          pnl: 23.45
        }
      ],
      recentTrades: [
        {
          id: 'trade1',
          timestamp: '2025-07-28T14:30:00Z',
          type: 'BUY',
          instrument: 'EUR_USD',
          pnl: 12.34
        },
        {
          id: 'trade2',
          timestamp: '2025-07-28T14:25:00Z',
          type: 'SELL',
          instrument: 'GBP_USD',
          pnl: -5.67
        }
      ]
    },
    {
      id: '2',
      name: 'Trend Rider',
      status: 'stopped',
      instruments: ['USD_JPY'],
      pnlToday: -23.12,
      winRate: 45.8,
      tradesCount: 8,
      riskLevel: 2.0,
      positions: [],
      recentTrades: [
        {
          id: 'trade3',
          timestamp: '2025-07-28T13:45:00Z',
          type: 'SELL',
          instrument: 'USD_JPY',
          pnl: -23.12
        }
      ]
    }
  ]
}

// Auto-refresh every 10 seconds
let refreshInterval: NodeJS.Timeout | null = null

onMounted(() => {
  loadMockData()
  refreshInterval = setInterval(refreshStrategies, 10000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>
