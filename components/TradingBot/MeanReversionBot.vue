<template>
  <Card class="w-full max-w-md mx-auto p-4">
    <CardHeader class="pb-2">
      <CardTitle class="text-lg font-bold flex items-center gap-2">
        <span>Mean Reversion Bot</span>
        <Badge v-if="isTrading" variant="default" class="text-xs px-2 py-0.5">● Live</Badge>
        <Badge v-else variant="outline" class="text-xs px-2 py-0.5">Stopped</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent class="flex flex-col gap-2">
      <div class="flex items-center gap-2 mb-2">
        <Label class="text-xs">Mode</Label>
        <Select v-model="mode" class="w-24 h-8 text-xs">
          <SelectTrigger>
            <SelectValue :placeholder="mode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scalp">
              <SelectItemText>Scalp</SelectItemText>
            </SelectItem>
            <SelectItem value="intraday">
              <SelectItemText>Intraday</SelectItemText>
            </SelectItem>
          </SelectContent>
        </Select>
        <Tooltip>
          <TooltipTrigger><span class="ml-1 text-muted-foreground">?</span></TooltipTrigger>
          <TooltipContent>
            <b>Mode:</b> Scalp mode uses fast signals for short trades; Intraday mode uses slower signals for longer trades. Choose based on your trading style.
          </TooltipContent>
        </Tooltip>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-2">
        <div class="flex flex-col">
          <Label class="text-xs mb-1">
            <!-- Controls -->
            Instrument
            <Tooltip>
              <TooltipTrigger><span class="ml-1 text-muted-foreground">?</span></TooltipTrigger>
              <TooltipContent>
                <b>Instrument:</b> The currency pair or asset traded by the bot. Determines which market the strategy operates on.
              </TooltipContent>
            </Tooltip>
          </Label>
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
        </div>
        <div class="flex flex-col">
          <Label class="text-xs mb-1">
            Granularity
            <Tooltip>
              <TooltipTrigger><span class="ml-1 text-muted-foreground">?</span></TooltipTrigger>
              <TooltipContent>
                <b>Granularity:</b> The timeframe for each candle/bar (e.g., M15 = 15 minutes). Affects indicator sensitivity and signal frequency.
              </TooltipContent>
            </Tooltip>
          </Label>
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
          <Label class="text-xs mb-1">
            Trade Size
            <Tooltip>
              <TooltipTrigger><span class="ml-1 text-muted-foreground">?</span></TooltipTrigger>
              <TooltipContent>
                <b>Trade Size:</b> Number of units (contracts/shares) traded per signal. Larger sizes increase risk and reward.
              </TooltipContent>
            </Tooltip>
          </Label>
          <NumberField v-model="tradeSize" :min="1" :step="1" class="w-full text-xs" :disabled="isTrading">
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
        </div>
        <div class="flex flex-col">
          <Label class="text-xs mb-1">
            TP (pips)
            <Tooltip>
              <TooltipTrigger><span class="ml-1 text-muted-foreground">?</span></TooltipTrigger>
              <TooltipContent>
                <b>Take Profit (TP):</b> The profit target in pips. The bot will automatically close the trade when this level is reached.
              </TooltipContent>
            </Tooltip>
          </Label>
          <NumberField v-model="takeProfitSafe" :min="0" :step="1" class="w-full text-xs" :disabled="isTrading">
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
        </div>
        <div class="flex flex-col">
          <Label class="text-xs mb-1">
            SL (pips)
            <Tooltip>
              <TooltipTrigger><span class="ml-1 text-muted-foreground">?</span></TooltipTrigger>
              <TooltipContent>
                <b>Stop Loss (SL):</b> The maximum loss in pips. The bot will automatically close the trade if this level is hit to limit risk.
              </TooltipContent>
            </Tooltip>
          </Label>
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
          <!-- Bot Status & Action -->
        </Button>
        <span v-if="tradeStatus" class="text-xs" :class="tradeStatus.startsWith('Error') ? 'text-destructive' : 'text-success'">{{ tradeStatus }}</span>
        <span v-else>No status yet</span>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs mt-2">
        <div>
          <span>RSI: <b>{{ rsi !== null ? rsi.toFixed(2) : '-' }}</b></span>
          <!-- Indicators -->
          <Tooltip>
            <TooltipTrigger><span class="ml-1 text-muted-foreground">?</span></TooltipTrigger>
            <TooltipContent>
              <b>RSI (Relative Strength Index):</b> Measures recent price momentum. Values below 30 suggest oversold; above 70 suggest overbought.
            </TooltipContent>
          </Tooltip>
        </div>
        <div>
          <span>Bollinger: <b>{{ bollingerSignal || '-' }}</b></span>
          <Tooltip>
            <TooltipTrigger><span class="ml-1 text-muted-foreground">?</span></TooltipTrigger>
            <TooltipContent>
              <b>Bollinger Bands:</b> Shows price volatility. Signals when price moves outside the upper/lower bands, indicating possible reversal zones.
            </TooltipContent>
          </Tooltip>
        </div>
        <div>
          <span>Stoch K(9): <b>{{ k9 !== null ? k9.toFixed(2) : '-' }}</b></span>
          <Tooltip>
            <TooltipTrigger><span class="ml-1 text-muted-foreground">?</span></TooltipTrigger>
            <TooltipContent>
              <b>Stochastic K(9):</b> Fast oscillator for short-term momentum. Values below 20 suggest oversold; above 80 suggest overbought.
            </TooltipContent>
          </Tooltip>
        </div>
        <div>
          <span>HMA(21): <b>{{ hma21 !== null ? hma21.toFixed(2) : '-' }}</b></span>
          <Tooltip>
            <TooltipTrigger><span class="ml-1 text-muted-foreground">?</span></TooltipTrigger>
            <TooltipContent>
              <b>HMA(21):</b> Hull Moving Average smooths price data to highlight trend direction. Used for entry/exit confirmation.
            </TooltipContent>
          </Tooltip>
        </div>
        <div>
          <span>Upper BB: <b>{{ upperBB !== null ? upperBB.toFixed(2) : '-' }}</b></span>
          <Tooltip>
            <TooltipTrigger><span class="ml-1 text-muted-foreground">?</span></TooltipTrigger>
            <TooltipContent>
              <b>Upper Bollinger Band:</b> The upper boundary of price volatility. Price above this may indicate overbought or reversal.
            </TooltipContent>
          </Tooltip>
        </div>
        <div>
          <!-- Signal -->
          <span>Lower BB: <b>{{ lowerBB !== null ? lowerBB.toFixed(2) : '-' }}</b></span>
          <Tooltip>
            <TooltipTrigger><span class="ml-1 text-muted-foreground">?</span></TooltipTrigger>
            <TooltipContent>
              <b>Lower Bollinger Band:</b> The lower boundary of price volatility. Price below this may indicate oversold or reversal.
            </TooltipContent>
            <!-- Trades -->
          </Tooltip>
        </div>
      </div>
      <div class="flex items-center gap-2 text-xs mt-2">
        <span>Signal:</span>
        <Badge v-if="signal === 'buy'" variant="default" class="px-2">Buy</Badge>
        <Badge v-else-if="signal === 'sell'" variant="destructive" class="px-2">Sell</Badge>
        <Badge v-else variant="outline" class="px-2">No Signal</Badge>
      </div>
      <div class="text-xs mt-2">
        <span class="font-semibold">Open Trades for {{ instrument }}:</span>
        <ul v-if="openTrades.length" class="list-disc ml-4">
          <li v-for="trade in openTrades" :key="trade.instrument">
            <span>
              {{ trade.instrument }} -
              <span v-if="parseFloat(trade.long?.units || '0') > 0">Buy ({{ trade.long.units }})</span>
              <span v-else-if="parseFloat(trade.short?.units || '0') < 0">Sell ({{ trade.short.units }})</span>
              <span v-else>Flat</span>
              <Tooltip>
                <TooltipTrigger><span class="ml-1 text-muted-foreground">?</span></TooltipTrigger>
                <TooltipContent>
                  <b>Entry Price:</b>
                  <span v-if="parseFloat(trade.long?.units || '0') > 0">{{ trade.long.averagePrice || '-' }}</span>
                  <span v-else-if="parseFloat(trade.short?.units || '0') < 0">{{ trade.short.averagePrice || '-' }}</span>
                  <!-- Last Trade -->
                  <span v-else>-</span>
                  <br />Shows the price at which this trade was opened. Useful for tracking performance and exits.
                </TooltipContent>
              </Tooltip>
            </span>
          </li>
        </ul>
        <span v-else class="text-muted-foreground">No open trades for {{ instrument }}</span>
      </div>
      <div class="text-xs text-muted-foreground">Last trade: <Badge variant="outline">{{ lastTrade || 'No Trades Placed' }}</Badge>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
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
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

const availableInstruments = [
  'EUR_USD', 'GBP_USD', 'USD_JPY', 'AUD_USD', 'USD_CAD', 'USD_CHF', 'NZD_USD', 'XAU_USD'
]
const availableGranularities = [
  'M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D', 'W'
]
const instrument = ref('EUR_USD')
const granularity = ref('M15')
const tradeSize = ref(1000)
const takeProfit = ref<number | null>(null)
const stopLoss = ref<number | null>(null)
const takeProfitSafe = computed({
  get: () => takeProfit.value ?? 0,
  set: v => takeProfit.value = v
})
const stopLossSafe = computed({
  get: () => stopLoss.value ?? 0,
  set: v => stopLoss.value = v
})
const isTrading = ref(false)
const tradeStatus = ref('')
const lastTrade = ref('')
let interval: ReturnType<typeof setInterval> | null = null

const oanda = useOandaStore()
const { price, subscribe, unsubscribe } = useOandaPricing(instrument)
const { candles, refresh } = useOandaCandles(instrument, granularity, 100, price)

const positions = computed(() => oanda.getPositions?.positions || [])
const openTrades = computed(() => {
  return positions.value.filter((p: any) => p.instrument === instrument.value && (
    parseFloat(p.long?.units || '0') !== 0 ||
    parseFloat(p.short?.units || '0') !== 0
  ))
})

// --- Indicator calculations ---
const rsi = computed(() => {
  // Simple RSI calculation (14 period)
  const period = 14
  const closes = candles.value.map(c => parseFloat(c.mid?.c || '0'))
  if (closes.length < period + 1) return null
  let gains = 0, losses = 0
  for (let i = closes.length - period; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1]
    if (diff > 0) gains += diff
    else losses -= diff
  }
  const avgGain = gains / period
  const avgLoss = losses / period
  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
})

const bollingerSignal = computed(() => {
  // Bollinger Bands (20 period, 2 stddev)
  const period = 20
  const closes = candles.value.map(c => parseFloat(c.mid?.c || '0'))
  if (closes.length < period) return null
  const recent = closes.slice(-period)
  const mean = recent.reduce((a, b) => a + b, 0) / period
  const std = Math.sqrt(recent.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period)
  const upper = mean + 2 * std
  const lower = mean - 2 * std
  const last = closes[closes.length - 1]
  if (last > upper) return 'Above Upper'
  if (last < lower) return 'Below Lower'
  return null
})

const stochasticSignal = computed(() => {
  // Stochastic Oscillator (14 period)
  const period = 14
  if (candles.value.length < period) return null
  const closes = candles.value.map(c => parseFloat(c.mid?.c || '0'))
  const highs = candles.value.map(c => parseFloat(c.mid?.h || '0'))
  const lows = candles.value.map(c => parseFloat(c.mid?.l || '0'))
  const recentCloses = closes.slice(-period)
  const recentHighs = highs.slice(-period)
  const recentLows = lows.slice(-period)
  const highest = Math.max(...recentHighs)
  const lowest = Math.min(...recentLows)
  const lastClose = recentCloses[recentCloses.length - 1]
  const k = ((lastClose - lowest) / (highest - lowest)) * 100
  if (k > 80) return 'Overbought'
  if (k < 20) return 'Oversold'
  return null
})

// --- Dynamic RSI thresholds by granularity ---
const rsiThresholds = computed(() => {
  const fastFrames = ['M1', 'M5', 'M15']
  if (fastFrames.includes(granularity.value)) {
    return { oversold: 20, overbought: 80 }
  }
  return { oversold: 30, overbought: 70 }
})

// --- Signal logic ---
const signal = computed(() => {
  const { oversold, overbought } = rsiThresholds.value
  // Buy: RSI < oversold, price below lower Bollinger, Stochastic oversold
  if (rsi.value !== null && rsi.value < oversold && bollingerSignal.value === 'Below Lower' && stochasticSignal.value === 'Oversold') return 'buy'
  // Sell: RSI > overbought, price above upper Bollinger, Stochastic overbought
  if (rsi.value !== null && rsi.value > overbought && bollingerSignal.value === 'Above Upper' && stochasticSignal.value === 'Overbought') return 'sell'
  return null
})

// --- Bollinger Bands (14,2) ---
const bbLength = ref(14)
const bbMult = ref(2)
const bbBasis = computed(() => {
  const closes = candles.value.map(c => parseFloat(c.mid?.c || '0'))
  if (closes.length < bbLength.value) return null
  return closes.slice(-bbLength.value).reduce((a, b) => a + b, 0) / bbLength.value
})
const bbDev = computed(() => {
  const closes = candles.value.map(c => parseFloat(c.mid?.c || '0'))
  const mean = bbBasis.value
  if (closes.length < bbLength.value || mean === null) return null
  return bbMult.value * Math.sqrt(closes.slice(-bbLength.value).reduce((a, b) => a + Math.pow(b - mean, 2), 0) / bbLength.value)
})
const upperBB = computed(() => bbBasis.value !== null && bbDev.value !== null ? bbBasis.value + bbDev.value : null)
const lowerBB = computed(() => bbBasis.value !== null && bbDev.value !== null ? bbBasis.value - bbDev.value : null)

// --- Hull Moving Average (HMA 21) ---
const hmaLength = ref(21)
function wma(arr: number[], period: number) {
  if (arr.length < period) return null
  let sum = 0, denom = 0
  for (let i = 0; i < period; i++) {
    sum += arr[arr.length - period + i] * (i + 1)
    denom += (i + 1)
  }
  return sum / denom
}
const hma21 = computed(() => {
  const closes = candles.value.map(c => parseFloat(c.mid?.c || '0'))
  if (closes.length < hmaLength.value) return null
  const half = Math.floor(hmaLength.value / 2)
  const wmaHalf = wma(closes, half)
  const wmaFull = wma(closes, hmaLength.value)
  if (wmaHalf === null || wmaFull === null) return null
  const diffArr = closes.map((v, i) => 2 * (wmaHalf ?? 0) - (wmaFull ?? 0))
  return wma(diffArr, hmaLength.value)
})

// --- Fast Stochastic (9,3) ---
function stoch(closeArr: number[], highArr: number[], lowArr: number[], period: number) {
  if (closeArr.length < period || highArr.length < period || lowArr.length < period) return null
  const recentCloses = closeArr.slice(-period)
  const recentHighs = highArr.slice(-period)
  const recentLows = lowArr.slice(-period)
  const highest = Math.max(...recentHighs)
  const lowest = Math.min(...recentLows)
  const lastClose = recentCloses[recentCloses.length - 1]
  return ((lastClose - lowest) / (highest - lowest)) * 100
}
const k9 = computed(() => {
  const closes = candles.value.map(c => parseFloat(c.mid?.c || '0'))
  const highs = candles.value.map(c => parseFloat(c.mid?.h || '0'))
  const lows = candles.value.map(c => parseFloat(c.mid?.l || '0'))
  const rawK = stoch(closes, highs, lows, 9)
  if (rawK === null) return null
  // 3-period SMA of k
  const kArr = Array(3).fill(rawK)
  return kArr.reduce((a, b) => a + b, 0) / 3
})
const d9 = computed(() => k9.value)

// --- Stochastic (14,3) ---
const k14 = computed(() => {
  const closes = candles.value.map(c => parseFloat(c.mid?.c || '0'))
  const highs = candles.value.map(c => parseFloat(c.mid?.h || '0'))
  const lows = candles.value.map(c => parseFloat(c.mid?.l || '0'))
  const rawK = stoch(closes, highs, lows, 14)
  if (rawK === null) return null
  const kArr = Array(3).fill(rawK)
  return kArr.reduce((a, b) => a + b, 0) / 3
})
const d14 = computed(() => k14.value)

// --- Mode selection ---
const mode = ref('scalp') // 'scalp' or 'intraday'

// --- Signal logic ---
const scalpBuy = computed(() => {
  if (k9.value === null || d9.value === null || hma21.value === null || bbBasis.value === null) return false
  const lastCandle = candles.value[candles.value.length - 1]
  if (!lastCandle || typeof lastCandle.mid?.c !== 'string') return false
  const closeNum = parseFloat(lastCandle.mid.c)
  return k9.value < 65 &&
    k9.value > d9.value &&
    closeNum > hma21.value &&
    closeNum > bbBasis.value
})
const scalpSell = computed(() => {
  if (k9.value === null || d9.value === null || hma21.value === null || bbBasis.value === null) return false
  const lastCandle = candles.value[candles.value.length - 1]
  if (!lastCandle || typeof lastCandle.mid?.c !== 'string') return false
  const closeNum = parseFloat(lastCandle.mid.c)
  return k9.value > 40 &&
    k9.value < d9.value &&
    closeNum < hma21.value &&
    closeNum < bbBasis.value
})
const intradayBuy = computed(() => {
  if (k14.value === null || d14.value === null || hma21.value === null || bbBasis.value === null) return false
  const lastCandle = candles.value[candles.value.length - 1]
  if (!lastCandle || typeof lastCandle.mid?.c !== 'string') return false
  const closeNum = parseFloat(lastCandle.mid.c)
  return k14.value < 80 &&
    k14.value > d14.value &&
    closeNum > hma21.value &&
    closeNum > bbBasis.value
})
const intradaySell = computed(() => {
  if (k14.value === null || d14.value === null || hma21.value === null || bbBasis.value === null) return false
  const lastCandle = candles.value[candles.value.length - 1]
  if (!lastCandle || typeof lastCandle.mid?.c !== 'string') return false
  const closeNum = parseFloat(lastCandle.mid.c)
  return k14.value > 20 &&
    k14.value < d14.value &&
    closeNum < hma21.value &&
    closeNum < bbBasis.value
})

const pineSignal = computed(() => {
  if (mode.value === 'scalp') {
    if (scalpBuy.value) return 'scalpBuy'
    if (scalpSell.value) return 'scalpSell'
  } else {
    if (intradayBuy.value) return 'intradayBuy'
    if (intradaySell.value) return 'intradaySell'
  }
  return null
})

const checkAndTrade = async () => {
  await refresh()
  await oanda.refreshPositions?.()
  if (!isTrading.value || !signal.value) return
  // Prevent duplicate trades
  const hasOpenPosition = openTrades.value.length > 0
  if (hasOpenPosition) {
    tradeStatus.value = 'Already have open position'
    return
  }
  try {
    const order: any = {
      instrument: instrument.value,
      units: tradeSize.value,
      side: signal.value as 'buy' | 'sell'
    }
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
    isTrading.value = false
  }
}

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

watch([instrument, granularity], () => {
  refresh()
})

onMounted(() => {
  refresh()
  subscribe()
})
onUnmounted(() => {
  if (interval) clearInterval(interval)
  unsubscribe()
})

watch(candles, async () => {
  if (isTrading.value) await checkAndTrade()
})

// Reactivity: Refresh candles and check trade on live price update
watch(price, async () => {
  await refresh()
  if (isTrading.value) await checkAndTrade()
})
</script>
