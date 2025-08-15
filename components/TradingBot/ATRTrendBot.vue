<template>
  <Card class="w-full max-w-md mx-auto p-4">
    <CardHeader class="pb-2">
      <CardTitle class="text-lg font-bold flex items-center gap-2">
        <span>ATR Trend Following Bot</span>
        <Badge v-if="isTrading" variant="default" class="text-xs px-2 py-0.5">● Live</Badge>
        <Badge v-else variant="outline" class="text-xs px-2 py-0.5">Stopped</Badge>
      </CardTitle>
    </CardHeader>
    <CardContent class="flex flex-col gap-4">
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div class="flex flex-col gap-1">
          <Label class="text-xs">Instrument
            <Tooltip>
              <TooltipTrigger><span class="ml-1 text-muted-foreground">?</span></TooltipTrigger>
              <TooltipContent><b>Instrument:</b> The currency pair or asset traded by the bot.</TooltipContent>
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
        <div class="flex flex-col gap-1">
          <Label class="text-xs">Granularity
            <Tooltip>
              <TooltipTrigger><span class="ml-1 text-muted-foreground">?</span></TooltipTrigger>
              <TooltipContent><b>Granularity:</b> Timeframe for each candle/bar.</TooltipContent>
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
        <div class="flex flex-col gap-1">
          <Label class="text-xs">Risk %
            <Tooltip>
              <TooltipTrigger><span class="ml-1 text-muted-foreground">?</span></TooltipTrigger>
              <TooltipContent><b>Risk Per Trade:</b> % of account balance risked per trade.</TooltipContent>
            </Tooltip>
          </Label>
          <NumberField v-model="riskPerTrade" :min="0.01" :max="0.05" :step="0.01" class="w-full text-xs" :disabled="isTrading">
            <NumberFieldContent>
              <NumberFieldDecrement />
              <NumberFieldInput />
              <NumberFieldIncrement />
            </NumberFieldContent>
          </NumberField>
        </div>
      </div>
      <div class="flex items-center gap-2 mt-2">
        <Button size="sm" :variant="isTrading ? 'destructive' : 'default'" @click="toggleTrading">
          {{ isTrading ? 'Stop' : 'Start' }} Bot
        </Button>
        <span v-if="tradeStatus" class="text-xs" :class="tradeStatus.startsWith('Error') ? 'text-destructive' : 'text-success'">{{ tradeStatus }}</span>
        <span v-else>No status yet</span>
      </div>
      <div class="grid grid-cols-2 gap-2 text-xs mt-2">
        <div>
          <span>ATR ({{ atrPeriod }}): <b>{{ atr !== null ? atr.toFixed(5) : '-' }}</b></span>
          <Tooltip>
            <TooltipTrigger><span class="ml-1 text-muted-foreground">?</span></TooltipTrigger>
            <TooltipContent><b>ATR:</b> Average True Range, measures volatility.</TooltipContent>
          </Tooltip>
        </div>
        <div>
          <span>EMA ({{ emaPeriod }}): <b>{{ ema !== null ? ema.toFixed(5) : '-' }}</b></span>
          <Tooltip>
            <TooltipTrigger><span class="ml-1 text-muted-foreground">?</span></TooltipTrigger>
            <TooltipContent><b>EMA:</b> Exponential Moving Average, trend direction.</TooltipContent>
          </Tooltip>
        </div>
        <div>
          <span>SMA ({{ smaPeriod }}): <b>{{ sma !== null ? sma.toFixed(5) : '-' }}</b></span>
          <Tooltip>
            <TooltipTrigger><span class="ml-1 text-muted-foreground">?</span></TooltipTrigger>
            <TooltipContent><b>SMA:</b> Simple Moving Average, trend confirmation.</TooltipContent>
          </Tooltip>
        </div>
        <div>
          <span>ATR Ratio: <b>{{ atrRatio !== null ? atrRatio.toFixed(2) : '-' }}</b></span>
          <Tooltip>
            <TooltipTrigger><span class="ml-1 text-muted-foreground">?</span></TooltipTrigger>
            <TooltipContent><b>ATR Ratio:</b> Current ATR vs average, shows trend strength.</TooltipContent>
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
              <span v-if="parseFloat(trade.long.units) > 0">Buy ({{ trade.long.units }})</span>
              <span v-else-if="parseFloat(trade.short.units) < 0">Sell ({{ trade.short.units }})</span>
              <span v-else>Flat</span>
              <Tooltip>
                <TooltipTrigger><span class="ml-1 text-muted-foreground">?</span></TooltipTrigger>
                <TooltipContent>
                  <b>Entry Price:</b> {{ trade.long.averagePrice || trade.short.averagePrice || '-' }}
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
  'H1', 'H4'
]
const instrument = ref('EUR_USD')
const granularity = ref('H1')
const riskPerTrade = ref(0.02)
const atrPeriod = ref(14)
const emaPeriod = ref(21)
const smaPeriod = ref(50)
const atrMultiplierStop = ref(2.5)
const atrMultiplierTarget = ref(4)
const atrMultiplierTrail = ref(2)
const minATRThreshold = ref(1.2)
const maxATRThreshold = ref(2.5)
const isTrading = ref(false)
const tradeStatus = ref('')
const lastTrade = ref('')
let interval: ReturnType<typeof setInterval> | null = null

const oanda = useOandaStore()
const { price, subscribe, unsubscribe } = useOandaPricing(instrument)
const {
  candles,
  refresh,
  calculateATR,
  calculateEMA,
  calculateSMA,
  getClosePrices,
  getHighPrices,
  getLowPrices
} = useOandaCandles(instrument, granularity, 100, price)

const positions = computed(() => oanda.getPositions?.positions || [])
const openTrades = computed(() => {
  return positions.value.filter((p: any) => p.instrument === instrument.value)
})

// --- Use composable functions for indicators ---
const atr = computed(() => calculateATR(atrPeriod.value))

const ema = computed(() => calculateEMA(emaPeriod.value))

const sma = computed(() => calculateSMA(smaPeriod.value))

const avgATR = computed(() => {
  // Use historical ATR calculations from composable
  const closes = getClosePrices()
  const highs = getHighPrices()
  const lows = getLowPrices()

  const minLength = atrPeriod.value + 21
  if (closes.length < minLength || highs.length < minLength || lows.length < minLength) {
    return null
  }

  const atrVals: number[] = []

  // Calculate ATR for each possible window
  for (let start = 0; start <= closes.length - atrPeriod.value - 1; start++) {
    const windowCloses = closes.slice(start, start + atrPeriod.value + 1)
    const windowHighs = highs.slice(start, start + atrPeriod.value + 1)
    const windowLows = lows.slice(start, start + atrPeriod.value + 1)

    if (windowCloses.length < atrPeriod.value + 1) continue

    const trueRanges: number[] = []
    for (let i = 1; i < windowCloses.length; i++) {
      const high = windowHighs[i]
      const low = windowLows[i]
      const prevClose = windowCloses[i - 1]
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      )
      trueRanges.push(tr)
    }

    if (trueRanges.length === atrPeriod.value) {
      // Use Wilder's smoothing like in composable
      const multiplier = 1 / atrPeriod.value
      let atrVal = trueRanges.slice(0, atrPeriod.value).reduce((sum, tr) => sum + tr, 0) / atrPeriod.value

      for (let j = atrPeriod.value; j < trueRanges.length; j++) {
        atrVal = trueRanges[j] * multiplier + atrVal * (1 - multiplier)
      }

      atrVals.push(atrVal)
    }
  }

  if (atrVals.length < 20) return null
  const recent = atrVals.slice(-20)
  return recent.reduce((sum, v) => sum + v, 0) / 20
})

const atrRatio = computed(() => {
  if (!atr.value || !avgATR.value) return null
  return atr.value / avgATR.value
})

const signal = computed(() => {
  // Trend direction
  const uptrend = ema.value !== null && sma.value !== null && ema.value > sma.value
  const downtrend = ema.value !== null && sma.value !== null && ema.value < sma.value
  if (!uptrend && !downtrend) return null
  // ATR filter
  if (!atrRatio.value || atrRatio.value < minATRThreshold.value || atrRatio.value > maxATRThreshold.value) return null
  // Price momentum
  if (!price.value || !ema.value) return null
  const currentPrice = typeof price.value === 'number'
    ? price.value
    : (price.value?.bids?.[0]?.price ? parseFloat(price.value.bids[0].price) : null)
  const priceAboveEMA = currentPrice !== null && currentPrice > ema.value
  const priceBelowEMA = currentPrice !== null && currentPrice < ema.value
  if (uptrend && priceAboveEMA) return 'buy'
  if (downtrend && priceBelowEMA) return 'sell'
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
    // ATR-based stop loss and take profit
    const currentPrice = typeof price.value === 'number' ? price.value : null;
    const emaVal = typeof ema.value === 'number' ? ema.value : null;
    const atrVal = typeof atr.value === 'number' ? atr.value : null;
    if (currentPrice === null || emaVal === null || atrVal === null) {
      tradeStatus.value = 'Error: Missing price, EMA, or ATR';
      return;
    }
    const stopLoss = signal.value === 'buy'
      ? Math.min(emaVal - (atrVal * 0.5), currentPrice - (atrVal * atrMultiplierStop.value))
      : Math.max(emaVal + (atrVal * 0.5), currentPrice + (atrVal * atrMultiplierStop.value));
    const takeProfit = signal.value === 'buy'
      ? currentPrice + (atrVal * atrMultiplierTarget.value)
      : currentPrice - (atrVal * atrMultiplierTarget.value);
    // Position sizing
    const accountBalance = oanda.account?.balance ? parseFloat(oanda.account.balance) : 10000;
    const riskAmount = accountBalance * riskPerTrade.value;
    const stopDistance = Math.abs(currentPrice - stopLoss);
    const pipValue = instrument.value.includes('JPY') ? 0.01 : 0.0001;
    const stopDistanceInPips = stopDistance / pipValue;
    let positionSize = Math.floor(riskAmount / (stopDistanceInPips * pipValue));
    positionSize = Math.max(1000, Math.min(positionSize, 100000));
    // Place order
    const order: any = {
      instrument: instrument.value,
      units: positionSize,
      side: signal.value as 'buy' | 'sell',
      stopLoss,
      takeProfit
    };
    if (typeof oanda.placeOrder === 'function') {
      await oanda.placeOrder(order);
      tradeStatus.value = `${signal.value === 'buy' ? 'Buy' : 'Sell'} order placed`;
      lastTrade.value = `${signal.value === 'buy' ? 'Buy' : 'Sell'} @ ${new Date().toLocaleTimeString()}`;
    } else {
      tradeStatus.value = 'Error: placeOrder not implemented';
    }
  } catch (e: any) {
    tradeStatus.value = 'Error: ' + (e?.message || e);
    isTrading.value = false;
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

watch(price, async () => {
  await refresh()
  if (isTrading.value) await checkAndTrade()
})
</script>