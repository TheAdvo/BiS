<template>
  <div class="w-full h-[400px]">
    <Card class="h-full">
      <CardHeader class="pb-3 border-b">
        <CardTitle class="text-base font-bold flex items-center gap-2">
          <Activity class="w-4 h-4" />
          <span>Strategy Metrics</span>
        </CardTitle>
      </CardHeader>
      <CardContent class="overflow-y-auto h-[320px] p-4">
        <div class="space-y-4">
          <!-- Active Strategies Summary -->
          <div class="grid grid-cols-1 gap-3">
            <div v-for="strategy in strategyMetrics" :key="strategy.name" class="p-3 border border-border rounded-lg bg-accent/20">
              <div class="flex items-center justify-between mb-2">
                <div class="font-medium text-sm">{{ strategy.name }}</div>
                <Badge :variant="strategy.status === 'Active' ? 'default' : 'secondary'" class="text-xs">
                  {{ strategy.status }}
                </Badge>
              </div>

              <div class="text-xs text-muted-foreground mb-2">{{ strategy.description }}</div>

              <div class="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <div class="text-muted-foreground">Win Rate</div>
                  <div class="font-medium" :class="strategy.winRate >= 60 ? 'text-green-500' : strategy.winRate >= 50 ? 'text-yellow-500' : 'text-red-500'">
                    {{ strategy.winRate }}%
                  </div>
                </div>
                <div>
                  <div class="text-muted-foreground">P&L Today</div>
                  <div class="font-medium" :class="strategy.dailyPnL >= 0 ? 'text-green-500' : 'text-red-500'">
                    {{ strategy.dailyPnL >= 0 ? '+' : '' }}${{ strategy.dailyPnL.toFixed(2) }}
                  </div>
                </div>
                <div>
                  <div class="text-muted-foreground">Trades</div>
                  <div class="font-medium">{{ strategy.tradesCount }}</div>
                </div>
                <div>
                  <div class="text-muted-foreground">Avg Hold</div>
                  <div class="font-medium">{{ strategy.avgHoldTime }}</div>
                </div>
              </div>

              <!-- Strategy Performance Bar -->
              <div class="mt-3">
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="text-muted-foreground">Performance</span>
                  <span :class="strategy.performance >= 0 ? 'text-green-500' : 'text-red-500'">
                    {{ strategy.performance >= 0 ? '+' : '' }}{{ strategy.performance.toFixed(1) }}%
                  </span>
                </div>
                <div class="w-full bg-muted rounded-full h-2">
                  <div class="h-2 rounded-full transition-all duration-500" :class="strategy.performance >= 0 ? 'bg-green-500' : 'bg-red-500'" :style="{ width: `${Math.min(Math.abs(strategy.performance) * 2, 100)}%` }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Risk Distribution -->
          <div class="mt-6 p-3 border border-border rounded-lg">
            <h4 class="text-sm font-medium mb-3">Risk Distribution</h4>
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span>Conservative (1-2%)</span>
                <span class="text-green-500">45%</span>
              </div>
              <div class="w-full bg-muted rounded-full h-1.5">
                <div class="w-[45%] h-1.5 bg-green-500 rounded-full"></div>
              </div>

              <div class="flex items-center justify-between text-xs">
                <span>Moderate (2-3%)</span>
                <span class="text-yellow-500">35%</span>
              </div>
              <div class="w-full bg-muted rounded-full h-1.5">
                <div class="w-[35%] h-1.5 bg-yellow-500 rounded-full"></div>
              </div>

              <div class="flex items-center justify-between text-xs">
                <span>Aggressive (3%+)</span>
                <span class="text-red-500">20%</span>
              </div>
              <div class="w-full bg-muted rounded-full h-1.5">
                <div class="w-[20%] h-1.5 bg-red-500 rounded-full"></div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="flex gap-2">
            <Button variant="outline" size="sm" class="flex-1">
              Pause All
            </Button>
            <Button variant="outline" size="sm" class="flex-1">
              Optimize
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
import { Activity } from 'lucide-vue-next'
import { ref } from 'vue'

// Mock strategy metrics data
const strategyMetrics = ref([
  {
    name: 'EUR/USD Scalper',
    description: '5m RSI + MACD',
    status: 'Active',
    winRate: 68.5,
    dailyPnL: 342.80,
    tradesCount: 24,
    avgHoldTime: '3.2m',
    performance: 12.4
  },
  {
    name: 'GBP/USD Trend',
    description: '1h EMA Cross',
    status: 'Active',
    winRate: 72.1,
    dailyPnL: 185.20,
    tradesCount: 8,
    avgHoldTime: '2.1h',
    performance: 8.7
  },
  {
    name: 'USD/JPY Range',
    description: '15m S/R Levels',
    status: 'Paused',
    winRate: 55.3,
    dailyPnL: -45.60,
    tradesCount: 12,
    avgHoldTime: '45m',
    performance: -2.3
  }
])
</script>
