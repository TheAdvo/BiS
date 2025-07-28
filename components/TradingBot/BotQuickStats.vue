<template>
  <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
    <!-- Active Bots -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Active Bots</CardTitle>
        <Bot class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold">{{ stats.activeBots }}</div>
        <p class="text-xs text-muted-foreground">
          <span class="text-green-500">+{{ stats.botsStartedToday }}</span> started today
        </p>
      </CardContent>
    </Card>

    <!-- Total P&L -->
    <Card>
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="text-sm font-medium">Total P&L</CardTitle>
        <TrendingUp class="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div class="text-2xl font-bold" :class="stats.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'">
          {{ stats.totalPnL >= 0 ? '+' : '' }}${{ stats.totalPnL.toFixed(2) }}
        </div>
        <p class="text-xs text-muted-foreground">
          <span :class="stats.pnlChange >= 0 ? 'text-green-500' : 'text-red-500'">
            {{ stats.pnlChange >= 0 ? '+' : '' }}{{ stats.pnlChange.toFixed(1) }}%
          </span> from yesterday
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
        <div class="text-2xl font-bold">{{ stats.tradesToday }}</div>
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
            <div class="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
            Connected
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
              <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span class="text-sm font-medium">Trading Engine Online</span>
            </div>
            <div class="text-sm text-muted-foreground">
              {{ stats.engineUptime }} uptime
            </div>
          </div>

          <div class="flex items-center gap-6">
            <div class="text-sm">
              <span class="text-muted-foreground">Market:</span>
              <Badge variant="outline" class="ml-1">
                {{ stats.marketStatus }}
              </Badge>
            </div>
            <div class="text-sm">
              <span class="text-muted-foreground">CPU:</span>
              <span class="ml-1">{{ stats.cpuUsage }}%</span>
            </div>
            <div class="text-sm">
              <span class="text-muted-foreground">Memory:</span>
              <span class="ml-1">{{ stats.memoryUsage }}%</span>
            </div>
            <Button variant="outline" size="sm" @click="refreshStats">
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
import { ref, onMounted } from 'vue'

// State
const isRefreshing = ref(false)

const stats = ref({
  activeBots: 2,
  botsStartedToday: 1,
  totalPnL: 233.33,
  pnlChange: 12.5,
  tradesToday: 47,
  winRate: 68.1,
  apiLatency: 45,
  uptime: 99.9,
  engineUptime: '2d 14h 32m',
  marketStatus: 'OPEN',
  cpuUsage: 23,
  memoryUsage: 41
})

// Methods
const refreshStats = async () => {
  try {
    isRefreshing.value = true

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500))

    // Update with mock data (would be real API call)
    stats.value = {
      ...stats.value,
      apiLatency: Math.floor(Math.random() * 100) + 20,
      cpuUsage: Math.floor(Math.random() * 30) + 15,
      memoryUsage: Math.floor(Math.random() * 20) + 35
    }
  } catch (error) {
    console.error('Failed to refresh stats:', error)
  } finally {
    isRefreshing.value = false
  }
}

// Auto-refresh stats every 30 seconds
let statsInterval: NodeJS.Timeout | null = null

onMounted(() => {
  statsInterval = setInterval(refreshStats, 30000)
})

onUnmounted(() => {
  if (statsInterval) {
    clearInterval(statsInterval)
  }
})
</script>
