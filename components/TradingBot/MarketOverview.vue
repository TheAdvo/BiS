<template>
  <Card class="h-[460px] flex flex-col">
    <CardHeader class="pb-2 flex-shrink-0">
      <CardTitle class="text-base font-medium flex items-center gap-2">
        <TrendingUp class="w-4 h-4" />
        <span>Market Overview</span>
        <Badge variant="outline" class="text-xs">
          <div class="w-1.5 h-1.5 bg-green-600 rounded-full mr-1 animate-pulse"/>
          Live
        </Badge>
      </CardTitle>
    </CardHeader>
    <CardContent class="flex-1 overflow-y-auto space-y-3 px-4 pb-4">
      <!-- Quick Market Stats -->
      <div class="grid grid-cols-2 gap-3">
        <div class="space-y-1">
          <div class="text-xs text-muted-foreground">Market Sentiment</div>
          <div class="flex items-center gap-2">
            <Badge :variant="sentiment.type === 'bullish' ? 'default' : sentiment.type === 'bearish' ? 'destructive' : 'secondary'" class="text-xs">
              {{ sentiment.label }}
            </Badge>
            <span class="text-sm font-medium font-mono">{{ sentiment.value }}%</span>
          </div>
        </div>

        <div class="space-y-1">
          <div class="text-xs text-muted-foreground">Active Signals</div>
          <div class="flex items-center gap-2">
            <Badge :variant="activeSignalsCount > 0 ? 'default' : 'secondary'" class="text-xs font-mono">
              {{ activeSignalsCount }} signals
            </Badge>
          </div>
        </div>
      </div>

      <!-- Current Price & Change -->
      <div class="border-t pt-3">
        <div class="flex items-center justify-between mb-1">
          <Select v-model="selectedCurrency">
            <SelectTrigger class="w-[120px] h-7 text-sm">
              <SelectValue :placeholder="selectedCurrency" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Major Pairs</SelectLabel>
                <SelectItem v-for="pair in majorPairs" :key="pair.value" :value="pair.value">
                  <SelectItemText>{{ pair.label }}</SelectItemText>
                </SelectItem>
              </SelectGroup>
              <SelectGroup>
                <SelectLabel>Minor Pairs</SelectLabel>
                <SelectItem v-for="pair in minorPairs" :key="pair.value" :value="pair.value">
                  <SelectItemText>{{ pair.label }}</SelectItemText>
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" :disabled="loading" class="h-6 w-6 p-0" @click="refreshData">
            <RefreshCw :class="{ 'animate-spin': loading }" class="w-3 h-3" />
          </Button>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-lg font-bold font-mono">{{ currentPrice }}</span>
          <Badge :variant="priceChange >= 0 ? 'default' : 'destructive'" class="text-xs font-mono">
            {{ priceChange >= 0 ? '+' : '' }}{{ priceChangePercent }}%
          </Badge>
        </div>
      </div>

      <!-- Quick Technical Indicators -->
      <div class="border-t pt-3 space-y-2">
        <div class="text-sm font-medium">Technical Overview</div>
        <div class="grid grid-cols-3 gap-2 text-xs">
          <div class="text-center p-2 rounded bg-muted/30">
            <div class="text-muted-foreground mb-1">RSI</div>
            <div class="font-medium font-mono" :class="rsi > 70 ? 'text-destructive' : rsi < 30 ? 'text-green-600' : 'text-muted-foreground'">
              {{ rsi.toFixed(0) }}
            </div>
          </div>

          <div class="text-center p-2 rounded bg-muted/30">
            <div class="text-muted-foreground mb-1">MACD</div>
            <div class="font-medium text-xs font-mono" :class="macdSignal === 'bullish' ? 'text-green-600' : macdSignal === 'bearish' ? 'text-destructive' : 'text-muted-foreground'">
              {{ macdSignal }}
            </div>
          </div>

          <div class="text-center p-2 rounded bg-muted/30">
            <div class="text-muted-foreground mb-1">Trend</div>
            <div class="font-medium font-mono" :class="trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-destructive' : 'text-muted-foreground'">
              {{ trend }}
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Signals -->
      <div class="border-t pt-3">
        <div class="text-sm font-medium mb-2">Recent Signals</div>
        <div v-if="recentSignals.length === 0" class="text-xs text-muted-foreground text-center py-2">
          No recent signals
        </div>
        <div v-else class="space-y-1">
          <div v-for="signal in recentSignals.slice(0, 2)" :key="signal.id" class="flex items-center justify-between p-2 rounded text-xs" :class="signal.type === 'buy' ? 'bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200' : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'">
            <div class="flex items-center gap-1">
              <ArrowUp v-if="signal.type === 'buy'" class="w-3 h-3" />
              <ArrowDown v-else class="w-3 h-3" />
              <span class="font-medium">{{ signal.type.toUpperCase() }}</span>
            </div>
            <span class="font-mono">{{ signal.confidence }}%</span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
// ---
// MarketOverview.vue
//
// Composables and Stores Used:
// - useTradingSignals (from @/composables/useTradingSignals):
//     Provides activeSignals, used for signal counts and recent signals display.
// - useOandaStore (Pinia store, from @/stores/oanda):
//     Provides getCandlesData and getPricingData for fetching OANDA market data.
// - useDebounceFn (from @vueuse/core):
//     Used for debounced currency data fetching.
//
// This component displays a live market overview, including:
// - Market sentiment (bullish/bearish/neutral)
// - Active trading signals
// - Current price and price change
// - Quick technical indicators (RSI, MACD, Trend)
// - Recent signals
//
// All data is fetched via composables and Pinia stores, following project conventions.
// ---

import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core' // Debounced async fetching
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectGroup, SelectItem, SelectItemText, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrendingUp, RefreshCw, ArrowUp, ArrowDown } from 'lucide-vue-next'
import type { PriceMessage, OandaCandlesResponse } from '@/types/Oanda'
import { useOandaStore } from '@/stores/oanda' // Centralized OANDA Pinia store
import { useTradingSignals } from '@/composables/useTradingSignals' // Trading signals composable

// --- Currency selection state ---
const selectedCurrency = ref('EUR_USD')

// --- Available currency pairs (major/minor) ---
const majorPairs = [
  { value: 'EUR_USD', label: 'EUR/USD' },
  { value: 'GBP_USD', label: 'GBP/USD' },
  { value: 'USD_JPY', label: 'USD/JPY' },
  { value: 'AUD_USD', label: 'AUD/USD' },
  { value: 'USD_CAD', label: 'USD/CAD' },
  { value: 'USD_CHF', label: 'USD/CHF' },
  { value: 'NZD_USD', label: 'NZD/USD' }
]

const minorPairs = [
  { value: 'EUR_GBP', label: 'EUR/GBP' },
  { value: 'EUR_JPY', label: 'EUR/JPY' },
  { value: 'GBP_JPY', label: 'GBP/JPY' },
  { value: 'AUD_JPY', label: 'AUD/JPY' },
  { value: 'CHF_JPY', label: 'CHF/JPY' },
  { value: 'EUR_CHF', label: 'EUR/CHF' }
]

// --- Reactive data refs for market/pricing data ---
const pricingData = ref<{ prices: PriceMessage[] } | null>(null)
const candleData = ref<OandaCandlesResponse | null>(null)

// --- Trading signals composable ---
// Provides activeSignals (array of current signals)
const { activeSignals } = useTradingSignals()

// --- Centralized OANDA store methods ---
// Used for all market data fetching
const { getCandlesData, getPricingData } = useOandaStore()

// --- Fetch data for the selected currency ---
// Uses Pinia store methods for pricing and candles
const fetchCurrencyData = async (currency: string) => {
  try {
    const [pricingResponse, candleResponse] = await Promise.all([
      getPricingData(currency),
      getCandlesData(currency, 'M5', 50)
    ])
    pricingData.value = pricingResponse
    candleData.value = candleResponse
  } catch (error) {
    console.error('Error fetching currency data:', error)
  }
}

// --- Watch for currency changes and fetch new data with debouncing ---
const debouncedFetch = useDebounceFn(fetchCurrencyData, 300)
watch(selectedCurrency, async (newCurrency) => {
  await debouncedFetch(newCurrency)
}, { immediate: true })

// --- Get display label for selected currency ---
const selectedCurrencyLabel = computed(() => {
  const allPairs = [...majorPairs, ...minorPairs]
  const pair = allPairs.find(p => p.value === selectedCurrency.value)
  return pair?.label || selectedCurrency.value
})

// --- Loading state for refresh button ---
const loading = ref(false)

// --- Simplified market sentiment calculation (last 10 candles) ---
const sentiment = computed(() => {
  if (!candleData.value?.candles || candleData.value.candles.length < 10) {
    return { type: 'neutral', label: 'Neutral', value: 50 }
  }

  const candles = candleData.value.candles.slice(-10)
  let bullishCount = 0

  candles.forEach((candle, index) => {
    if (index === 0) return
    const prev = candles[index - 1]
    if (candle.complete && prev.complete && candle.mid && prev.mid) {
      const currentClose = parseFloat(candle.mid.c)
      const prevClose = parseFloat(prev.mid.c)
      if (currentClose > prevClose) bullishCount++
    }
  })

  const bullishPercent = Math.round((bullishCount / (candles.length - 1)) * 100)

  if (bullishPercent > 60) return { type: 'bullish', label: 'Bullish', value: bullishPercent }
  if (bullishPercent < 40) return { type: 'bearish', label: 'Bearish', value: bullishPercent }
  return { type: 'neutral', label: 'Neutral', value: bullishPercent }
})

// --- Current price and price change calculations ---
const currentPrice = computed(() => {
  if (!pricingData.value?.prices || pricingData.value.prices.length === 0) return '1.0000'
  const price = pricingData.value.prices[0]
  return price.bids?.[0]?.price || price.asks?.[0]?.price || '1.0000'
})

const priceChange = computed(() => {
  if (!candleData.value?.candles || candleData.value.candles.length < 2) return 0

  const candles = candleData.value.candles
  const current = candles[candles.length - 1]
  const previous = candles[candles.length - 2]

  if (current.complete && previous.complete && current.mid && previous.mid) {
    return parseFloat(current.mid.c) - parseFloat(previous.mid.c)
  }
  return 0
})

const priceChangePercent = computed(() => {
  if (!candleData.value?.candles || candleData.value.candles.length < 2) return '0.00'

  const candles = candleData.value.candles
  const current = candles[candles.length - 1]
  const previous = candles[candles.length - 2]

  if (current.complete && previous.complete && current.mid && previous.mid) {
    const currentPrice = parseFloat(current.mid.c)
    const previousPrice = parseFloat(previous.mid.c)
    const change = ((currentPrice - previousPrice) / previousPrice) * 100
    return change.toFixed(2)
  }
  return '0.00'
})

// --- Simplified technical indicators (RSI, MACD, Trend) ---
// All calculated from last N candles for performance
const rsi = computed(() => {
  if (!candleData.value?.candles || candleData.value.candles.length < 14) return 50

  const prices = candleData.value.candles
    .filter(c => c.complete && c.mid?.c)
    .map(c => parseFloat(c.mid!.c))
    .slice(-14)

  if (prices.length < 14) return 50

  // Simplified RSI calculation - reduced iterations
  let gains = 0
  let losses = 0
  const changeCount = Math.min(13, prices.length - 1)

  for (let i = 1; i <= changeCount; i++) {
    const change = prices[i] - prices[i - 1]
    if (change > 0) gains += change
    else losses += Math.abs(change)
  }

  const avgGain = gains / changeCount
  const avgLoss = losses / changeCount

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
})

const macdSignal = computed(() => {
  if (!candleData.value?.candles || candleData.value.candles.length < 26) return 'neutral'

  const candles = candleData.value.candles.filter(c => c.complete && c.mid?.c)
  if (candles.length < 26) return 'neutral'

  // Optimized MACD calculation - use last 26 prices only
  const prices = candles.slice(-26).map(c => parseFloat(c.mid!.c))

  // Simple moving averages for MACD approximation (more efficient)
  const sum12 = prices.slice(-12).reduce((a, b) => a + b, 0)
  const sum26 = prices.reduce((a, b) => a + b, 0)
  const ema12 = sum12 / 12
  const ema26 = sum26 / 26
  const macd = ema12 - ema26

  return macd > 0 ? 'bullish' : 'bearish'
})

const trend = computed(() => {
  if (!candleData.value?.candles || candleData.value.candles.length < 20) return 'neutral'

  const prices = candleData.value.candles
    .filter(c => c.complete && c.mid?.c)
    .map(c => parseFloat(c.mid!.c))
    .slice(-20)

  if (prices.length < 20) return 'neutral'

  const firstHalf = prices.slice(0, 10).reduce((a, b) => a + b) / 10
  const secondHalf = prices.slice(-10).reduce((a, b) => a + b) / 10

  if (secondHalf > firstHalf * 1.001) return 'up'
  if (secondHalf < firstHalf * 0.999) return 'down'
  return 'neutral'
})

// --- Active signals count (from useTradingSignals) ---
const activeSignalsCount = computed(() => {
  return activeSignals.value?.length || 0
})

// --- Recent signals (from useTradingSignals) ---
const recentSignals = computed(() => {
  return activeSignals.value?.slice(0, 3) || []
})

// --- Manual refresh for all data (used by refresh button) ---
const refreshData = async () => {
  loading.value = true
  try {
    // Refresh data for current currency
    await fetchCurrencyData(selectedCurrency.value)
  } finally {
    loading.value = false
  }
}

// --- Auto-refresh is now managed by dashboard or parent - no individual interval needed ---
</script>
