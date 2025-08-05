<template>
  <div class="w-full max-w-md mx-auto p-4 bg-card rounded shadow">
    <h2 class="text-lg font-bold mb-2 flex items-center gap-2">
      <span>SMA Crossover Bot</span>
      <span v-if="isTrading" class="text-green-500 text-xs">● Live</span>
    </h2>
    <div class="mb-4 flex flex-wrap gap-2 items-center">
      <label class="text-xs">Instrument:</label>
      <select v-model="instrument" class="border rounded px-2 py-1 text-xs">
        <option v-for="inst in availableInstruments" :key="inst" :value="inst">{{ inst }}</option>
      </select>
      <label class="text-xs ml-2">Fast SMA:</label>
      <input v-model.number="fastPeriod" type="number" min="2" max="50" class="w-12 border rounded px-1 text-xs" />
      <label class="text-xs ml-2">Slow SMA:</label>
      <input v-model.number="slowPeriod" type="number" min="3" max="100" class="w-12 border rounded px-1 text-xs" />
      <label class="text-xs ml-2">Trade Size:</label>
      <input v-model.number="tradeSize" type="number" min="1" step="1" class="w-16 border rounded px-1 text-xs" />
      <label class="text-xs ml-2">TP (pips):</label>
      <input v-model.number="takeProfit" type="number" min="0" step="1" class="w-14 border rounded px-1 text-xs" />
      <label class="text-xs ml-2">SL (pips):</label>
      <input v-model.number="stopLoss" type="number" min="0" step="1" class="w-14 border rounded px-1 text-xs" />
    </div>
    <div class="mb-2 flex items-center gap-2">
      <button class="btn btn-sm" :class="isTrading ? 'bg-red-500 text-white' : 'bg-green-500 text-white'" @click="toggleTrading">
        {{ isTrading ? 'Stop' : 'Start' }} Bot
      </button>
      <span v-if="tradeStatus" class="text-xs" :class="tradeStatus.startsWith('Error') ? 'text-red-500' : 'text-green-600'">{{ tradeStatus }}</span>
    </div>
    <div class="mb-2 text-xs">
      <span>Fast SMA: <b>{{ fastSMA !== undefined && fastSMA !== null ? fastSMA.toFixed(5) : '-' }}</b></span> |
      <span>Slow SMA: <b>{{ slowSMA !== undefined && slowSMA !== null ? slowSMA.toFixed(5) : '-' }}</b></span>
    </div>
    <div class="mb-2 text-xs">
      <span>Signal: <b :class="signal === 'buy' ? 'text-green-600' : signal === 'sell' ? 'text-red-600' : 'text-muted-foreground'">{{ signal || '-' }}</b></span>
    </div>
    <div class="mb-2 text-xs">
      <span>Current Position: <b>{{ positionStatus }}</b></span>
    </div>
    <div class="text-xs text-muted-foreground">Last trade: {{ lastTrade || '-' }}</div>
  </div>
</template>

<script setup lang="ts">
/**
 * SMA Crossover Bot Component
 * - Uses useOandaCandles for candle data and SMA calculation
 * - Uses useOandaStore for trade execution
 * - Detects SMA crossovers and places trades accordingly
 * - Minimal, well-documented, and type-safe
 */
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useOandaCandles } from '@/composables/useOandaCandles'
import { useOandaStore } from '@/stores/oanda'

// --- Configurable instruments and SMA periods ---
const availableInstruments = [
  'EUR_USD', 'GBP_USD', 'USD_JPY', 'AUD_USD', 'USD_CAD', 'USD_CHF', 'NZD_USD', 'XAU_USD'
]
const instrument = ref('EUR_USD')
const fastPeriod = ref(9)
const slowPeriod = ref(21)

// --- Bot state ---
const isTrading = ref(false)
const tradeStatus = ref('')
const lastTrade = ref('')
const tradeSize = ref(1000)
const takeProfit = ref<number | null>(null)
const stopLoss = ref<number | null>(null)
let interval: ReturnType<typeof setInterval> | null = null

// --- OANDA store and candle data ---
const oanda = useOandaStore()
const { candles, calculateSMA, refresh } = useOandaCandles(instrument.value, 'M5', 100)

// --- Position management ---
import { computed as vueComputed } from 'vue'
const positions = vueComputed(() => {
  // OANDA store positions shape: { positions: OandaPosition[] }
  return oanda.getPositions?.positions || []
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
  // Calculate previous SMAs for last candle
  const prevFast = calculateSMA(fastPeriod.value)
  const prevSlow = calculateSMA(slowPeriod.value)
  if (prevFast == null || prevSlow == null) return null
  // Simple crossover logic (current vs previous)
  if (prevFast > prevSlow && fastSMA.value <= slowSMA.value) return 'sell'
  if (prevFast < prevSlow && fastSMA.value >= slowSMA.value) return 'buy'
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
  // Prevent duplicate trades in same direction
  const longUnits = parseFloat(currentPosition.value?.long?.units || '0')
  const shortUnits = parseFloat(currentPosition.value?.short?.units || '0')
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

    if (signal.value === 'buy' && typeof oanda.placeOrder === 'function') {
      if (longUnits > 0) {
        tradeStatus.value = 'Already in long position'
        return
      }
      await oanda.placeOrder(order)
      tradeStatus.value = 'Buy order placed'
      lastTrade.value = `Buy @ ${new Date().toLocaleTimeString()}`
    } else if (signal.value === 'sell' && typeof oanda.placeOrder === 'function') {
      if (shortUnits < 0) {
        tradeStatus.value = 'Already in short position'
        return
      }
      await oanda.placeOrder(order)
      tradeStatus.value = 'Sell order placed'
      lastTrade.value = `Sell @ ${new Date().toLocaleTimeString()}`
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
  if (isTrading.value) {
    checkAndTrade()
    interval = setInterval(checkAndTrade, 60 * 1000)
  } else if (interval) {
    clearInterval(interval)
    interval = null
  }
}

// --- Reactivity: Refresh candles on param change ---
watch([instrument, fastPeriod, slowPeriod], () => {
  refresh()
})

// --- Lifecycle: Initial refresh and cleanup ---
onMounted(() => {
  refresh()
})
onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>
