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
// ---[ UI Components and Icons ]---
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Activity, RefreshCw, Bot } from 'lucide-vue-next'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useOandaStore } from '@/stores/oanda'

// ---[ State: Selected period and refresh status ]---
const selectedPeriod = ref('24h')
const isRefreshing = ref(false)

// ---[ Pinia Store: OANDA trading data ]---
const oanda = useOandaStore()

// ---[ Computed: Performance summary metrics from trades ]---
const performanceSummary = computed(() => {
  // OANDA trades response shape: { trades: Trade[], lastTransactionID: string }
  const tradesArr = Array.isArray(oanda.getTrades?.trades) ? oanda.getTrades.trades : [];
  if (!tradesArr.length) {
    return { totalPnL: 0, winRate: 0, profitFactor: 0 };
  }
  const totalPnL = tradesArr.reduce((sum: number, t: any) => sum + (parseFloat(t.unrealizedPL ?? '0')), 0);
  const wins = tradesArr.filter((t: any) => parseFloat(t.unrealizedPL ?? '0') > 0).length;
  const losses = tradesArr.filter((t: any) => parseFloat(t.unrealizedPL ?? '0') < 0).length;
  const winRate = tradesArr.length ? (wins / tradesArr.length) * 100 : 0;
  const grossProfit = tradesArr.filter((t: any) => parseFloat(t.unrealizedPL ?? '0') > 0).reduce((sum: number, t: any) => sum + parseFloat(t.unrealizedPL ?? '0'), 0);
  const grossLoss = tradesArr.filter((t: any) => parseFloat(t.unrealizedPL ?? '0') < 0).reduce((sum: number, t: any) => sum + Math.abs(parseFloat(t.unrealizedPL ?? '0')), 0);
  const profitFactor = grossLoss ? grossProfit / grossLoss : 0;
  return { totalPnL, winRate, profitFactor };
});

// ---[ Computed: Bot performance breakdown from positions ]---
const botPerformance = computed(() => {
  // OANDA positions response shape: { positions: Position[], ... }
  const positionsArr = Array.isArray(oanda.getPositions?.positions) ? oanda.getPositions.positions : [];
  return positionsArr.map((pos: any) => ({
    id: pos.instrument,
    name: pos.instrument.replace('_', '/'),
    status: parseFloat(pos.unrealizedPL ?? '0') !== 0 ? 'running' : 'stopped',
    runtime: 'N/A', // Could be computed if you track open time
    pnl: parseFloat(pos.unrealizedPL ?? '0'),
    trades: Array.isArray(pos.tradeIDs) ? pos.tradeIDs.length : 0,
    winRate: 0, // Could be computed if you map trades to positions
    maxDrawdown: 0 // Placeholder, needs historical data
  }));
});

// ---[ Computed: Risk metrics from trades ]---
const riskMetrics = computed(() => {
  const tradesArr = Array.isArray(oanda.getTrades?.trades) ? oanda.getTrades.trades : [];
  if (!tradesArr.length) {
    return { sharpeRatio: 0, maxDrawdown: 0, calmarRatio: 0, avgTrade: 0, bestTrade: 0, worstTrade: 0 };
  }
  const returns = tradesArr.map((t: any) => parseFloat(t.unrealizedPL ?? '0'));
  const avgTrade = returns.reduce((sum: number, v: number) => sum + v, 0) / returns.length;
  const bestTrade = Math.max(...returns);
  const worstTrade = Math.min(...returns);
  // Sharpe/Calmar/Drawdown are placeholders, real calculation needs more data
  return {
    sharpeRatio: 0,
    maxDrawdown: 0,
    calmarRatio: 0,
    avgTrade,
    bestTrade,
    worstTrade: Math.abs(worstTrade)
  };
});

// ---[ UI Helper: Bot status color ]---
const getBotStatusColor = (status: string) => {
  switch (status) {
    case 'running': return 'bg-green-500 text-white'
    case 'stopped': return 'bg-gray-500 text-white'
    case 'error': return 'bg-red-500 text-white'
    default: return 'bg-gray-500 text-white'
  }
}

// ---[ Refresh logic: Calls Pinia store actions to refresh data ]---
const refreshPerformance = async () => {
  try {
    isRefreshing.value = true
    await Promise.all([
      oanda.refreshTrades(true),
      oanda.refreshPositions(true)
    ])
  } catch (error) {
    console.error('Failed to refresh performance:', error)
  } finally {
    isRefreshing.value = false
  }
}

// ---[ Lifecycle: Auto-refresh every 15 seconds ]---
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
