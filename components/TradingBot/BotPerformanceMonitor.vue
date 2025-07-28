<template>
  <div class="w-full h-[400px]">
    <Card class="h-full">
      <CardHeader class="pb-3 border-b">
        <div class="flex items-center justify-between">
          <CardTitle class="text-base font-bold flex items-center gap-2">
            <Activity class="w-4 h-4" />
            <span>Performance Monitor</span>
            <Badge variant="outline" class="text-xs">
              <div class="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
              Live
            </Badge>
          </CardTitle>
          <div class="flex items-center gap-2">
            <Select v-model="selectedPeriod">
              <SelectTrigger class="w-24 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1H</SelectItem>
                <SelectItem value="24h">24H</SelectItem>
                <SelectItem value="7d">7D</SelectItem>
                <SelectItem value="30d">30D</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" @click="refreshPerformance">
              <RefreshCw class="w-3 h-3 mr-1" :class="{ 'animate-spin': isRefreshing }" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent class="overflow-y-auto h-[320px] p-4">
        <!-- Performance Summary -->
        <div class="grid grid-cols-3 gap-4 mb-6">
          <div class="text-center p-3 bg-accent/30 rounded-lg">
            <div class="text-xs text-muted-foreground mb-1">Total P&L</div>
            <div class="text-lg font-bold" :class="performanceSummary.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'">
              {{ performanceSummary.totalPnL >= 0 ? '+' : '' }}${{ performanceSummary.totalPnL.toFixed(2) }}
            </div>
          </div>
          <div class="text-center p-3 bg-accent/30 rounded-lg">
            <div class="text-xs text-muted-foreground mb-1">Win Rate</div>
            <div class="text-lg font-bold">{{ performanceSummary.winRate.toFixed(1) }}%</div>
          </div>
          <div class="text-center p-3 bg-accent/30 rounded-lg">
            <div class="text-xs text-muted-foreground mb-1">Profit Factor</div>
            <div class="text-lg font-bold">{{ performanceSummary.profitFactor.toFixed(2) }}</div>
          </div>
        </div>

        <!-- Performance Chart Placeholder -->
        <div class="mb-6">
          <div class="text-sm font-medium mb-3">P&L Chart ({{ selectedPeriod }})</div>
          <div class="h-32 bg-accent/30 rounded-lg flex items-center justify-center">
            <div class="text-sm text-muted-foreground">
              📈 Performance chart would render here
            </div>
          </div>
        </div>

        <!-- Bot Performance Breakdown -->
        <div class="space-y-3">
          <div class="text-sm font-medium">Bot Performance</div>
          <div class="space-y-2">
            <div v-for="bot in botPerformance" :key="bot.id" class="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
              <div class="flex items-center gap-3">
                <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium" :class="getBotStatusColor(bot.status)">
                  <Bot class="w-3 h-3" />
                </div>
                <div>
                  <div class="font-medium text-sm">{{ bot.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ bot.runtime }}</div>
                </div>
              </div>

              <div class="grid grid-cols-4 gap-4 text-center text-xs">
                <div>
                  <div class="text-muted-foreground">P&L</div>
                  <div class="font-medium" :class="bot.pnl >= 0 ? 'text-green-500' : 'text-red-500'">
                    {{ bot.pnl >= 0 ? '+' : '' }}${{ bot.pnl.toFixed(2) }}
                  </div>
                </div>
                <div>
                  <div class="text-muted-foreground">Trades</div>
                  <div class="font-medium">{{ bot.trades }}</div>
                </div>
                <div>
                  <div class="text-muted-foreground">Win%</div>
                  <div class="font-medium">{{ bot.winRate.toFixed(0) }}%</div>
                </div>
                <div>
                  <div class="text-muted-foreground">DD</div>
                  <div class="font-medium text-red-500">{{ bot.maxDrawdown.toFixed(1) }}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Metrics -->
        <div class="mt-6 pt-4 border-t">
          <div class="text-sm font-medium mb-3">Risk Metrics</div>
          <div class="grid grid-cols-2 gap-4 text-xs">
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Sharpe Ratio</span>
                <span class="font-medium">{{ riskMetrics.sharpeRatio.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Max Drawdown</span>
                <span class="font-medium text-red-500">{{ riskMetrics.maxDrawdown.toFixed(1) }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Calmar Ratio</span>
                <span class="font-medium">{{ riskMetrics.calmarRatio.toFixed(2) }}</span>
              </div>
            </div>
            <div class="space-y-2">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Avg Trade</span>
                <span class="font-medium">{{ riskMetrics.avgTrade.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Best Trade</span>
                <span class="font-medium text-green-500">${{ riskMetrics.bestTrade.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Worst Trade</span>
                <span class="font-medium text-red-500">-${{ riskMetrics.worstTrade.toFixed(2) }}</span>
              </div>
            </div>
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Activity, RefreshCw, Bot } from 'lucide-vue-next'
import { ref, onMounted } from 'vue'

// State
const selectedPeriod = ref('24h')
const isRefreshing = ref(false)

const performanceSummary = ref({
  totalPnL: 156.78,
  winRate: 68.4,
  profitFactor: 1.42
})

const botPerformance = ref([
  {
    id: '1',
    name: 'Scalper Pro',
    status: 'running',
    runtime: '2h 34m',
    pnl: 89.23,
    trades: 15,
    winRate: 73.3,
    maxDrawdown: 2.1
  },
  {
    id: '2',
    name: 'Trend Rider',
    status: 'running',
    runtime: '1h 12m',
    pnl: 67.55,
    trades: 8,
    winRate: 62.5,
    maxDrawdown: 3.8
  },
  {
    id: '3',
    name: 'Range Bot',
    status: 'stopped',
    runtime: '45m',
    pnl: -23.12,
    trades: 12,
    winRate: 41.7,
    maxDrawdown: 5.2
  }
])

const riskMetrics = ref({
  sharpeRatio: 1.23,
  maxDrawdown: 5.2,
  calmarRatio: 0.87,
  avgTrade: 12.45,
  bestTrade: 45.67,
  worstTrade: 23.12
})

// Methods
const getBotStatusColor = (status: string) => {
  switch (status) {
    case 'running': return 'bg-green-500 text-white'
    case 'stopped': return 'bg-gray-500 text-white'
    case 'error': return 'bg-red-500 text-white'
    default: return 'bg-gray-500 text-white'
  }
}

const refreshPerformance = async () => {
  try {
    isRefreshing.value = true

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600))

    // Update performance data (would be real API data)
    performanceSummary.value.totalPnL += (Math.random() - 0.5) * 20
    performanceSummary.value.winRate = Math.max(40, Math.min(90, performanceSummary.value.winRate + (Math.random() - 0.5) * 5))

  } catch (error) {
    console.error('Failed to refresh performance:', error)
  } finally {
    isRefreshing.value = false
  }
}

// Auto-refresh every 15 seconds
let refreshInterval: NodeJS.Timeout | null = null

onMounted(() => {
  refreshInterval = setInterval(refreshPerformance, 15000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>
