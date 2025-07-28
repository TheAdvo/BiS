<template>
  <div class="w-full h-[400px]">
    <Card class="h-full">
      <CardHeader class="pb-3 border-b">
        <div class="flex items-center justify-between">
          <CardTitle class="text-base font-bold flex items-center gap-2">
            <BarChart3 class="w-4 h-4" />
            <span>Market Analysis</span>
            <Badge variant="outline" class="text-xs">
              <div class="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
              Real-time
            </Badge>
          </CardTitle>
          <div class="flex items-center gap-2">
            <Select v-model="selectedTimeframe">
              <SelectTrigger class="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">1m</SelectItem>
                <SelectItem value="5m">5m</SelectItem>
                <SelectItem value="15m">15m</SelectItem>
                <SelectItem value="1h">1h</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" @click="refreshAnalysis">
              <RefreshCw class="w-3 h-3 mr-1" :class="{ 'animate-spin': isRefreshing }" />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent class="overflow-y-auto h-[320px] p-4">
        <!-- Market Overview -->
        <div class="grid grid-cols-2 gap-4 mb-6">
          <div class="space-y-3">
            <div>
              <div class="text-xs text-muted-foreground mb-1">Market Sentiment</div>
              <div class="flex items-center gap-2">
                <Badge :variant="marketSentiment.value > 50 ? 'default' : 'destructive'" class="text-xs">
                  {{ marketSentiment.label }}
                </Badge>
                <span class="text-sm">{{ marketSentiment.value }}%</span>
              </div>
            </div>
            <div>
              <div class="text-xs text-muted-foreground mb-1">Volatility Index</div>
              <div class="flex items-center gap-2">
                <div class="flex-1 bg-accent rounded-full h-2">
                  <div class="h-2 rounded-full" :class="volatility.level === 'HIGH' ? 'bg-red-500' : volatility.level === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'" :style="{ width: `${volatility.value}%` }"></div>
                </div>
                <span class="text-xs">{{ volatility.level }}</span>
              </div>
            </div>
          </div>

          <div class="space-y-3">
            <div>
              <div class="text-xs text-muted-foreground mb-1">Active Signals</div>
              <div class="text-2xl font-bold text-green-500">{{ activeSignals }}</div>
            </div>
            <div>
              <div class="text-xs text-muted-foreground mb-1">Success Rate</div>
              <div class="text-2xl font-bold">{{ successRate }}%</div>
            </div>
          </div>
        </div>

        <!-- Currency Pair Analysis -->
        <div class="space-y-3">
          <div class="text-sm font-medium">Currency Pair Signals</div>
          <div class="space-y-2">
            <div v-for="pair in pairAnalysis" :key="pair.instrument" class="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
              <div class="flex items-center gap-3">
                <span class="text-lg">{{ pair.flag }}</span>
                <div>
                  <div class="font-medium text-sm">{{ pair.name }}</div>
                  <div class="text-xs text-muted-foreground">{{ pair.price }}</div>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <div class="text-right">
                  <div class="text-xs text-muted-foreground">Signal</div>
                  <Badge :variant="getSignalVariant(pair.signal)" class="text-xs">
                    {{ pair.signal }}
                  </Badge>
                </div>
                <div class="text-right">
                  <div class="text-xs text-muted-foreground">Strength</div>
                  <div class="text-sm font-medium">{{ pair.strength }}/10</div>
                </div>
                <div class="text-right">
                  <div class="text-xs text-muted-foreground">Trend</div>
                  <div class="flex items-center gap-1">
                    <TrendingUp v-if="pair.trend === 'UP'" class="w-3 h-3 text-green-500" />
                    <TrendingDown v-else-if="pair.trend === 'DOWN'" class="w-3 h-3 text-red-500" />
                    <Minus v-else class="w-3 h-3 text-gray-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Technical Indicators -->
        <div class="mt-6 pt-4 border-t">
          <div class="text-sm font-medium mb-3">Technical Indicators</div>
          <div class="grid grid-cols-2 gap-4 text-xs">
            <div v-for="indicator in technicalIndicators" :key="indicator.name" class="flex items-center justify-between">
              <span class="text-muted-foreground">{{ indicator.name }}</span>
              <div class="flex items-center gap-1">
                <span class="font-medium">{{ indicator.value }}</span>
                <Badge :variant="getIndicatorVariant(indicator.signal)" class="text-xs px-1">
                  {{ indicator.signal }}
                </Badge>
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
import { BarChart3, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'
import { ref, onMounted } from 'vue'

// State
const selectedTimeframe = ref('5m')
const isRefreshing = ref(false)

const marketSentiment = ref({
  label: 'Bullish',
  value: 67
})

const volatility = ref({
  level: 'MEDIUM',
  value: 45
})

const activeSignals = ref(12)
const successRate = ref(73)

const pairAnalysis = ref([
  {
    instrument: 'EUR_USD',
    name: 'EUR/USD',
    flag: '🇪🇺',
    price: '1.17425',
    signal: 'BUY',
    strength: 8,
    trend: 'UP'
  },
  {
    instrument: 'GBP_USD',
    name: 'GBP/USD',
    flag: '🇬🇧',
    price: '1.26341',
    signal: 'HOLD',
    strength: 5,
    trend: 'SIDEWAYS'
  },
  {
    instrument: 'USD_JPY',
    name: 'USD/JPY',
    flag: '🇺🇸',
    price: '149.325',
    signal: 'SELL',
    strength: 7,
    trend: 'DOWN'
  },
  {
    instrument: 'XAU_USD',
    name: 'XAU/USD',
    flag: '🥇',
    price: '2045.30',
    signal: 'BUY',
    strength: 9,
    trend: 'UP'
  }
])

const technicalIndicators = ref([
  { name: 'RSI (14)', value: '34.2', signal: 'OVERSOLD' },
  { name: 'MACD', value: '0.0012', signal: 'BULLISH' },
  { name: 'BB %B', value: '0.23', signal: 'NEUTRAL' },
  { name: 'Stoch', value: '28.1', signal: 'OVERSOLD' },
  { name: 'ADX', value: '42.8', signal: 'TRENDING' },
  { name: 'ATR', value: '0.0034', signal: 'MEDIUM' }
])

// Methods
const getSignalVariant = (signal: string) => {
  switch (signal) {
    case 'BUY': return 'default'
    case 'SELL': return 'destructive'
    case 'HOLD': return 'secondary'
    default: return 'secondary'
  }
}

const getIndicatorVariant = (signal: string) => {
  switch (signal) {
    case 'BULLISH':
    case 'OVERSOLD':
    case 'TRENDING': return 'default'
    case 'BEARISH':
    case 'OVERBOUGHT': return 'destructive'
    case 'NEUTRAL':
    case 'MEDIUM': return 'secondary'
    default: return 'secondary'
  }
}

const refreshAnalysis = async () => {
  try {
    isRefreshing.value = true

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800))

    // Update with new mock data (would be real API data)
    marketSentiment.value.value = Math.floor(Math.random() * 40) + 30
    marketSentiment.value.label = marketSentiment.value.value > 50 ? 'Bullish' : 'Bearish'

    volatility.value.value = Math.floor(Math.random() * 60) + 20
    if (volatility.value.value > 70) volatility.value.level = 'HIGH'
    else if (volatility.value.value > 40) volatility.value.level = 'MEDIUM'
    else volatility.value.level = 'LOW'

    activeSignals.value = Math.floor(Math.random() * 20) + 5
    successRate.value = Math.floor(Math.random() * 30) + 60

  } catch (error) {
    console.error('Failed to refresh analysis:', error)
  } finally {
    isRefreshing.value = false
  }
}

// Auto-refresh every 30 seconds
let refreshInterval: NodeJS.Timeout | null = null

onMounted(() => {
  refreshInterval = setInterval(refreshAnalysis, 30000)
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>
