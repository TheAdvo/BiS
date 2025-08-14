<template>
  <Card class="w-full max-w-md mx-auto p-4">
    <CardHeader class="pb-2">
      <CardTitle class="text-lg font-bold flex items-center gap-2">
        <span>SMA Crossover Bot</span>
        <Badge v-if="isTrading" variant="default" class="text-xs px-2 py-0.5">● Live</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent class="flex flex-col gap-2">
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-2">
        <div class="flex flex-col">
          <Label class="text-xs mb-1">Granularity</Label>
          <Select v-model="granularity">
            <SelectTrigger class="w-full h-8 text-xs">
              <SelectValue :placeholder="granularity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="g in availableGranularities" :key="g" :value="g">
                <SelectItemText>{{ g }}</SelectItemText>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex flex-col">
          <Label class="text-xs mb-1">Instrument</Label>
          <Select v-model="instrument">
            <SelectTrigger class="w-full h-8 text-xs">
              <SelectValue :placeholder="instrument" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="inst in availableInstruments" :key="inst" :value="inst">
                <SelectItemText>{{ inst }}</SelectItemText>
              </SelectItem>
            </SelectContent>
          </Select>
          <span class="text-xs mt-1 text-muted-foreground">
            Live Price: <b>
              {{
                price && price.bids?.[0]?.price && price.asks?.[0]?.price
                  ? ((parseFloat(price.bids[0].price) + parseFloat(price.asks[0].price)) / 2).toFixed(5)
                  : '-'
              }}
            </b>
          </span>
        </div>
        <div class="flex flex-col">
          <Label class="text-xs mb-1">Fast SMA</Label>
          <NumberField v-model="fastPeriod" :min="2" :max="50" class="w-full text-xs" :disabled="isTrading">
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
        </div>
        <div class="flex flex-col">
          <Label class="text-xs mb-1">Slow SMA</Label>
          <NumberField v-model="slowPeriod" :min="3" :max="100" class="w-full text-xs" :disabled="isTrading">
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
        </div>
        <div class="flex flex-col">
          <Label class="text-xs mb-1">Trade Size</Label>
          <NumberField v-model="tradeSize" :min="1" :step="1" class="w-full text-xs" :disabled="isTrading">
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
        </div>
        <div class="flex flex-col">
          <Label class="text-xs mb-1">TP (pips)</Label>
          <NumberField v-model="takeProfitSafe" :min="0" :step="1" class="w-full text-xs" :disabled="isTrading">
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
        </div>
        <div class="flex flex-col">
          <Label class="text-xs mb-1">SL (pips)</Label>
          <NumberField v-model="stopLossSafe" :min="0" :step="1" class="w-full text-xs" :disabled="isTrading">
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <Button size="sm" :variant="isTrading ? 'destructive' : 'default'" @click="toggleTrading">
          {{ isTrading ? 'Stop' : 'Start' }} Bot
        </Button>
        <span v-if="tradeStatus" class="text-xs" :class="tradeStatus.startsWith('Error') ? 'text-destructive' : 'text-success'">{{ tradeStatus }}</span>
        <span v-else>No status yet</span>
      </div>
      <div class="text-xs">
        <span>Fast SMA: <b>{{ fastSMA !== undefined && fastSMA !== null ? fastSMA.toFixed(5) : '-' }}</b></span> |
        <span>Slow SMA: <b>{{ slowSMA !== undefined && slowSMA !== null ? slowSMA.toFixed(5) : '-' }}</b></span>
      </div>
      <div class="text-xs">
        <span>Signal: <b :class="signal === 'buy' ? 'text-success' : signal === 'sell' ? 'text-destructive' : 'text-muted-foreground'">{{ signal || '-' }}</b></span>
      </div>
      <div class="text-xs">
        <span>Current Position: <b>{{ positionStatus }}</b></span>
      </div>
      <div class="text-xs mt-2">
        <span class="font-semibold">Open Trades for {{ instrument }}:</span>
        <ul v-if="openTrades.length" class="list-disc ml-4">
          <li v-for="trade in openTrades" :key="trade.instrument">
            <span>
              {{ trade.instrument }} -
              <span v-if="parseFloat(trade.long?.units || '0') > 0">Long ({{ trade.long.units }})</span>
              <span v-else-if="parseFloat(trade.short?.units || '0') < 0">Short ({{ trade.short.units }})</span>
              <span v-else>Flat</span>
            </span>
          </li>
        </ul>
        <span v-else class="text-muted-foreground">No open trades for {{ instrument }}</span>
      </div>
      <div class="text-xs text-muted-foreground">Last trade: {{ lastTrade || 'No Trades Placed' }}</div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">

/**
 * SMA Crossover Bot Component
 * - Uses useOandaCandles for candle data and SMA calculation
 * - Uses useOandaStore for trade execution
 * - Detects SMA crossovers and places trades accordingly
 * - Uses shadcn-vue UI components for all controls and status
 * - Minimal, well-documented, and type-safe
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useOandaCandles } from '@/composables/useOandaCandles'
import { useOandaPricing } from '@/composables/useOandaPricing'
import { useOandaStore } from '@/stores/oanda'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NumberField } from '@/components/ui/number-field'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectItemText, SelectValue } from '@/components/ui/select'

// --- Position management ---
import { computed as vueComputed } from 'vue'

// --- Configurable instruments, SMA periods, and granularity ---
const availableInstruments = [
  'EUR_USD', 'GBP_USD', 'USD_JPY', 'AUD_USD', 'USD_CAD', 'USD_CHF', 'NZD_USD', 'XAU_USD'
]
const availableGranularities = [
  'M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D', 'W'
]
const instrument = ref('GBP_USD')
const granularity = ref('M1')
const fastPeriod = ref(9)
const slowPeriod = ref(21)

// --- Bot state ---
const isTrading = ref(false)
const tradeStatus = ref('')
const lastTrade = ref('')
const tradeSize = ref(1000)
const takeProfit = ref<number | null>(null)
const stopLoss = ref<number | null>(null)
const fifoViolated = ref(false)
// Safe values for shadcn-vue Input (never null)
const takeProfitSafe = computed({
  get: () => takeProfit.value ?? 0,
  set: v => takeProfit.value = v
})
const stopLossSafe = computed({
  get: () => stopLoss.value ?? 0,
  set: v => stopLoss.value = v
})
let interval: ReturnType<typeof setInterval> | null = null

// --- Live pricing subscription ---
const { price, subscribe, unsubscribe } = useOandaPricing(instrument)

// --- OANDA store and candle data ---
const oanda = useOandaStore()
// Pass instrument.value and granularity.value so useOandaCandles receives strings
const { candles, calculateSMA, refresh } = useOandaCandles(instrument, granularity, 100, price)


const positions = vueComputed(() => {
  // OANDA store positions shape: { positions: OandaPosition[] }
  return oanda.getPositions?.positions || []
})

// All open trades for selected instrument
const openTrades = computed(() => {
  return positions.value.filter((p: any) => p.instrument === instrument.value && (
    parseFloat(p.long?.units || '0') !== 0 ||
    parseFloat(p.short?.units || '0') !== 0
  ))
})

const currentPosition = vueComputed(() => {
  // Find position for selected instrument
  return positions.value.find((p: any) => p.instrument === instrument.value)
})

const positionStatus = vueComputed(() => {
  if (!currentPosition.value) return 'None'
  const longUnits = parseFloat(currentPosition.value.long?.units || '0')
  const shortUnits = parseFloat(currentPosition.value.short?.units || '0')
  if (longUnits > 0) return `Long (${longUnits})`
  if (shortUnits < 0) return `Short (${shortUnits})`
  return 'Flat'
})

// --- SMA values ---
const fastSMA = computed(() => calculateSMA(fastPeriod.value))
const slowSMA = computed(() => calculateSMA(slowPeriod.value))

/**
 * Detect SMA crossover signal
 * Returns 'buy', 'sell', or null
 */
const signal = computed(() => {
  if (fastSMA.value == null || slowSMA.value == null) return null
  // Defensive: Only use candles with valid close
  const closes = candles.value
    .filter(c => c.mid && typeof c.mid.c === 'string')
    .map(c => parseFloat(c.mid!.c))
  if (closes.length < Math.max(fastPeriod.value, slowPeriod.value) + 2) return null
  // Calculate previous SMAs using previous candle set
  // Remove the last candle for previous SMA calculation
  const prevCloses = closes.slice(0, -1)
  // Helper to calculate SMA from closes array
  const sma = (arr: number[], period: number) => {
    if (arr.length < period) return null
    return arr.slice(-period).reduce((a, b) => a + b, 0) / period
  }
  const prevFast = sma(prevCloses, fastPeriod.value)
  const prevSlow = sma(prevCloses, slowPeriod.value)
  if (prevFast == null || prevSlow == null) return null
  // Current SMAs
  const currFast = sma(closes, fastPeriod.value)
  const currSlow = sma(closes, slowPeriod.value)
  if (currFast == null || currSlow == null) return null
  // True crossover detection
  if (prevFast < prevSlow && currFast >= currSlow) return 'buy'
  if (prevFast > prevSlow && currFast <= currSlow) return 'sell'
  return null
})

/**
 * Check for a trade signal and place a trade if needed
 * Uses oanda.placeOrder (must be implemented in your store)
 */
const checkAndTrade = async () => {
  await refresh()
  await oanda.refreshPositions?.()
  if (!isTrading.value || !signal.value) return
  // Detect if FIFO violation is currently active
  const hasOpenPosition = currentPosition.value && (
    parseFloat(currentPosition.value.long?.units || '0') !== 0 ||
    parseFloat(currentPosition.value.short?.units || '0') !== 0
  )
  if (fifoViolated.value) {
    // If violation is active, check if position is now closed
    if (!hasOpenPosition) {
      fifoViolated.value = false
      tradeStatus.value = 'FIFO violation resolved. Bot resumed.'
    } else {
      tradeStatus.value = 'FIFO violation: Open position exists. No further trades until resolved.'
      return
    }
  }
  // If not violated, but open position exists, set violation
  if (hasOpenPosition) {
    tradeStatus.value = 'FIFO violation: Open position exists. No further trades until resolved.'
    fifoViolated.value = true
    return
  }
  try {
    // Prepare order object with optional TP/SL
    const orderBase = {
      instrument: instrument.value,
      units: tradeSize.value,
      side: signal.value as 'buy' | 'sell'
    }
    const order: any = { ...orderBase }
    if (takeProfit.value && takeProfit.value > 0) order.takeProfit = takeProfit.value
    if (stopLoss.value && stopLoss.value > 0) order.stopLoss = stopLoss.value

    if (typeof oanda.placeOrder === 'function') {
      await oanda.placeOrder(order)
      tradeStatus.value = `${signal.value === 'buy' ? 'Buy' : 'Sell'} order placed`
      lastTrade.value = `${signal.value === 'buy' ? 'Buy' : 'Sell'} @ ${new Date().toLocaleTimeString()}`
    } else {
      tradeStatus.value = 'Error: placeOrder not implemented'
    }
  } catch (e: any) {
    tradeStatus.value = 'Error: ' + (e?.message || e)
    isTrading.value = false // Auto-stop on error
  }
}

/**
 * Start or stop the bot
 * Sets up or clears the trading interval
 */
const toggleTrading = () => {
  isTrading.value = !isTrading.value
  tradeStatus.value = isTrading.value ? 'Bot started' : 'Bot stopped'
  // Reset FIFO violation when toggling bot off
  if (!isTrading.value) fifoViolated.value = false
  if (isTrading.value) {
    checkAndTrade()
    interval = setInterval(checkAndTrade, 60 * 1000)
  } else if (interval) {
    clearInterval(interval)
    interval = null
  }
}

// --- Reactivity: Refresh candles on param change ---
watch([instrument, fastPeriod, slowPeriod, granularity], () => {
  refresh()
})

// --- Lifecycle: Initial refresh and cleanup ---
onMounted(() => {
  refresh()
  subscribe()
})
onUnmounted(() => {
  if (interval) clearInterval(interval)
  unsubscribe()
})

// --- Reactivity: Refresh candles and check trade on live price update ---
watch(price, async () => {
  // If useOandaCandles supports injecting the latest price, this will ensure the bot logic is always using the freshest tick
  await refresh()
  if (isTrading.value) await checkAndTrade()
})
</script>
