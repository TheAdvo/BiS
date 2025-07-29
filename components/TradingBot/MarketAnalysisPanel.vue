<template>
  <TooltipProvider>
    <div class="w-full h-[400px]">
      <Card class="h-full">
        <CardHeader class="pb-3 border-b">
          <div class="flex items-center justify-between">
            <Tooltip>
              <TooltipTrigger asChild>
                <CardTitle class="text-base font-bold flex items-center gap-2 cursor-help">
                  <BarChart3 class="w-4 h-4" />
                  <span>Market Analysis</span>
                  <Badge variant="outline" class="text-xs">
                    <div class="w-1.5 h-1.5 bg-blue-500 rounded-full mr-1 animate-pulse"></div>
                    Real-time
                  </Badge>
                </CardTitle>
              </TooltipTrigger>
              <TooltipContent>
                <p class="max-w-xs">Real-time market analysis with live data. Provides sentiment, volatility, currency pair signals, and technical indicators.</p>
              </TooltipContent>
            </Tooltip>
            <div class="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select analysis timeframe. Currently affects display only - all data is real-time.</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm" @click="refreshAnalysis">
                    <RefreshCw class="w-3 h-3 mr-1" :class="{ 'animate-spin': isRefreshing }" />
                    Refresh
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Refresh market data and recalculate all indicators. Auto-refreshes every 30 seconds.</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent class="overflow-y-auto h-[320px] p-4">
          <!-- Market Overview -->
          <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="space-y-3">
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div class="text-xs text-muted-foreground mb-1 cursor-help">Market Sentiment</div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p class="max-w-xs">Overall market sentiment indicator. Bullish (>60%) suggests positive conditions, Bearish (<40%) suggests caution.</p>
                  </TooltipContent>
                </Tooltip>
                <div class="flex items-center gap-2">
                  <Badge :variant="marketSentiment.value > 50 ? 'default' : 'destructive'" class="text-xs">
                    {{ marketSentiment.label }}
                  </Badge>
                  <span class="text-sm">{{ marketSentiment.value }}%</span>
                </div>
              </div>
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div class="text-xs text-muted-foreground mb-1 cursor-help">Volatility Index</div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p class="max-w-xs">Market volatility indicator. Low = stable market, High = increased risk and opportunity.</p>
                  </TooltipContent>
                </Tooltip>
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div class="text-xs text-muted-foreground mb-1 cursor-help">Active Signals</div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p class="max-w-xs">Number of active trading signals currently being monitored.</p>
                  </TooltipContent>
                </Tooltip>
                <div class="text-2xl font-bold text-green-500">{{ activeSignals }}</div>
              </div>
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div class="text-xs text-muted-foreground mb-1 cursor-help">Success Rate</div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p class="max-w-xs">Percentage of successful trading signals over recent period.</p>
                  </TooltipContent>
                </Tooltip>
                <div class="text-2xl font-bold">{{ successRate }}%</div>
              </div>
            </div>
          </div>

          <!-- Currency Pair Analysis -->
          <div class="space-y-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <div class="text-sm font-medium cursor-help">Currency Pair Signals</div>
              </TooltipTrigger>
              <TooltipContent>
                <p class="max-w-xs">Analysis of major currency pairs with trading signals and strength indicators.</p>
              </TooltipContent>
            </Tooltip>
            <div class="space-y-2">
              <div v-for="pair in pairAnalysis" :key="pair.instrument" class="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                <div class="flex items-center gap-3">
                  <span class="text-lg">{{ pair.flag }}</span>
                  <div>
                    <div class="font-medium text-sm">{{ pair.name }}</div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div class="text-xs text-muted-foreground cursor-help">{{ pair.price }}</div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p class="max-w-xs">Current market price for {{ pair.name }}. Updated in real-time.</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <div class="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div class="text-xs text-muted-foreground cursor-help">Signal</div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p class="max-w-xs">Trading signal: BUY (bullish), SELL (bearish), or HOLD (neutral).</p>
                      </TooltipContent>
                    </Tooltip>
                    <Badge :variant="getSignalVariant(pair.signal)" class="text-xs">
                      {{ pair.signal }}
                    </Badge>
                  </div>
                  <div class="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div class="text-xs text-muted-foreground cursor-help">Strength</div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p class="max-w-xs">Signal confidence level (1-10). Higher values indicate stronger signals.</p>
                      </TooltipContent>
                    </Tooltip>
                    <div class="text-sm font-medium">{{ pair.strength }}/10</div>
                  </div>
                  <div class="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div class="text-xs text-muted-foreground cursor-help">Trend</div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p class="max-w-xs">Price trend direction: UP (bullish), DOWN (bearish), or SIDEWAYS (range-bound).</p>
                      </TooltipContent>
                    </Tooltip>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <div class="text-sm font-medium mb-3 cursor-help">Technical Indicators</div>
              </TooltipTrigger>
              <TooltipContent>
                <p class="max-w-xs">Key technical analysis indicators with signals for market trend and momentum analysis.</p>
              </TooltipContent>
            </Tooltip>
            <div class="grid grid-cols-2 gap-4 text-xs">
              <div v-for="indicator in technicalIndicators" :key="indicator.name" class="flex items-center justify-between">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span class="text-muted-foreground cursor-help">{{ indicator.name }}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div class="max-w-xs">
                      <p v-if="indicator.name.includes('RSI')">
                        Relative Strength Index: Measures momentum. Values >70 = overbought, <30=oversold. </p>
                          <p v-else-if="indicator.name.includes('MACD')">
                            Moving Average Convergence Divergence: Trend-following momentum indicator.
                          </p>
                          <p v-else-if="indicator.name.includes('BB')">
                            Bollinger Bands %B: Position within bands. >1 = above upper band, <0=below lower band. </p>
                              <p v-else-if="indicator.name.includes('Stoch')">
                                Stochastic Oscillator: Momentum indicator similar to RSI interpretation.
                              </p>
                              <p v-else-if="indicator.name.includes('ADX')">
                                Average Directional Index: Measures trend strength. Values >25 indicate strong trend.
                              </p>
                              <p v-else-if="indicator.name.includes('ATR')">
                                Average True Range: Measures volatility. Higher values = more volatile movements.
                              </p>
                              <p v-else>
                                Technical indicator providing market analysis signals.
                              </p>
                    </div>
                  </TooltipContent>
                </Tooltip>
                <div class="flex items-center gap-1">
                  <span class="font-medium">{{ indicator.value }}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge :variant="getIndicatorVariant(indicator.signal)" class="text-xs px-1 cursor-help">
                        {{ indicator.signal }}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div class="max-w-xs">
                        <p v-if="indicator.signal === 'BULLISH'">
                          Positive signal indicating potential upward price movement.
                        </p>
                        <p v-else-if="indicator.signal === 'BEARISH'">
                          Negative signal indicating potential downward price movement.
                        </p>
                        <p v-else-if="indicator.signal === 'OVERSOLD'">
                          Market may be oversold, potential buying opportunity.
                        </p>
                        <p v-else-if="indicator.signal === 'OVERBOUGHT'">
                          Market may be overbought, potential selling opportunity.
                        </p>
                        <p v-else-if="indicator.signal === 'TRENDING'">
                          Strong trend detected, follow the momentum.
                        </p>
                        <p v-else>
                          {{ indicator.signal }} signal detected.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>
          </div>

          <!-- Candlestick Patterns & Market Structure -->
          <div class="mt-6 pt-4 border-t">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Candlestick Patterns -->
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div class="text-sm font-medium mb-3 cursor-help">Active Patterns</div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p class="max-w-xs">Detected candlestick patterns indicating potential market reversals or continuations.</p>
                  </TooltipContent>
                </Tooltip>
                <div class="space-y-2">
                  <div v-for="pattern in recognizedPatterns" :key="pattern.name" class="flex items-center justify-between p-2 bg-accent/20 rounded text-xs">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span class="font-medium cursor-help">{{ pattern.name }}</span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div class="max-w-xs">
                          <p class="font-medium">{{ pattern.name }}</p>
                          <p class="text-xs mt-1">{{ pattern.description }}</p>
                          <p class="text-xs mt-1">Confidence: {{ pattern.confidence }}%</p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                    <div class="flex items-center gap-1">
                      <Badge :variant="pattern.type === 'bullish' ? 'default' : pattern.type === 'bearish' ? 'destructive' : 'secondary'" class="text-xs px-1">
                        {{ pattern.type.toUpperCase() }}
                      </Badge>
                      <span class="text-muted-foreground">{{ pattern.confidence }}%</span>
                    </div>
                  </div>
                  <div v-if="recognizedPatterns.length === 0" class="text-xs text-muted-foreground italic p-2">
                    No significant patterns detected
                  </div>
                </div>
              </div>

              <!-- Market Structure -->
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div class="text-sm font-medium mb-3 cursor-help">Market Structure</div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p class="max-w-xs">Overall market trend analysis with support/resistance levels and pivot points.</p>
                  </TooltipContent>
                </Tooltip>
                <div class="space-y-2 text-xs">
                  <div v-if="marketStructureData" class="space-y-2">
                    <div class="flex justify-between items-center">
                      <span class="text-muted-foreground">Trend</span>
                      <div class="flex items-center gap-1">
                        <Badge :variant="marketStructureData.trend === 'uptrend' ? 'default' : marketStructureData.trend === 'downtrend' ? 'destructive' : 'secondary'" class="text-xs">
                          {{ marketStructureData.trend.toUpperCase() }}
                        </Badge>
                        <span class="text-muted-foreground">{{ marketStructureData.strength.toFixed(0) }}%</span>
                      </div>
                    </div>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div class="flex justify-between cursor-help">
                          <span class="text-muted-foreground">Pivot Point</span>
                          <span class="font-mono">{{ marketStructureData.pivotPoints.pivot.toFixed(5) }}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p class="max-w-xs">Calculated pivot point based on previous day's high, low, and close. Key reference level for intraday trading.</p>
                      </TooltipContent>
                    </Tooltip>

                    <div class="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div class="text-muted-foreground cursor-help mb-1">Resistance</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p class="max-w-xs">Key resistance levels where price may face selling pressure.</p>
                          </TooltipContent>
                        </Tooltip>
                        <div class="space-y-1">
                          <div v-for="(level, index) in marketStructureData.resistance.slice(0, 2)" :key="index" class="text-red-400 font-mono text-xs">
                            {{ level.toFixed(5) }}
                          </div>
                        </div>
                      </div>
                      <div>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div class="text-muted-foreground cursor-help mb-1">Support</div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p class="max-w-xs">Key support levels where price may find buying interest.</p>
                          </TooltipContent>
                        </Tooltip>
                        <div class="space-y-1">
                          <div v-for="(level, index) in marketStructureData.support.slice(0, 2)" :key="index" class="text-green-400 font-mono text-xs">
                            {{ level.toFixed(5) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div v-else class="text-muted-foreground italic p-2">
                    Analyzing market structure...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </TooltipProvider>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { BarChart3, RefreshCw, TrendingUp, TrendingDown, Minus } from 'lucide-vue-next'
import { ref, onMounted, onUnmounted, computed } from 'vue'

// OANDA composables
const { prices, pending, error, refresh: refreshPricing, getCurrentPrice, getSpreadInPips } = useOandaPricing()
const { data: accountData } = useOandaAccount()
const { data: positionsData } = useOandaPositions()

// Technical analysis with historical data for EUR/USD (most liquid pair)
const {
  candles,
  pending: candlesPending,
  refresh: refreshCandles,
  calculateRSI,
  calculateMACD,
  calculateStochastic,
  calculateATR,
  calculateSMA,
  calculateEMA,
  calculateBollingerBands,
  calculateADX,
  calculateIchimoku,
  calculateWilliamsR,
  calculateCCI,
  recognizePatterns,
  analyzeMarketStructure,
  getAdvancedAnalysis
} = useOandaCandles('EUR_USD', 'M5', 500) // 500 candles for sophisticated analysis// State
const selectedTimeframe = ref('5m')
const isRefreshing = ref(false)

// Computed properties for sophisticated market analysis
const marketSentiment = computed(() => {
  if (!prices.value.length || !candles.value.length) return { label: 'Loading...', value: 50 }

  const advancedAnalysis = getAdvancedAnalysis()
  const patterns = recognizePatterns()
  const marketStructure = analyzeMarketStructure()

  let sentimentScore = 50 // Start neutral
  let factorCount = 0

  // Factor 1: RSI analysis (weighted 15%)
  if (advancedAnalysis.rsi !== null) {
    const rsi = advancedAnalysis.rsi
    if (rsi > 70) sentimentScore -= 12 // Overbought
    else if (rsi > 60) sentimentScore += 8 // Strong momentum
    else if (rsi < 30) sentimentScore += 12 // Oversold
    else if (rsi < 40) sentimentScore -= 8 // Weak momentum
    factorCount++
  }

  // Factor 2: MACD analysis (weighted 15%)
  if (advancedAnalysis.macd !== null) {
    const macd = advancedAnalysis.macd
    if (macd.macd > macd.signal && macd.histogram > 0) sentimentScore += 10 // Strong bullish
    else if (macd.macd > macd.signal) sentimentScore += 5 // Weak bullish
    else if (macd.macd < macd.signal && macd.histogram < 0) sentimentScore -= 10 // Strong bearish
    else sentimentScore -= 5 // Weak bearish
    factorCount++
  }

  // Factor 3: Bollinger Bands analysis (weighted 10%)
  if (advancedAnalysis.bollinger !== null) {
    const bb = advancedAnalysis.bollinger
    if (bb.percentB > 0.8) sentimentScore -= 8 // Near upper band
    else if (bb.percentB < 0.2) sentimentScore += 8 // Near lower band
    else if (bb.percentB > 0.5) sentimentScore += 3 // Above middle
    else sentimentScore -= 3 // Below middle
    factorCount++
  }

  // Factor 4: ADX and trend strength (weighted 15%)
  if (advancedAnalysis.adx !== null && marketStructure) {
    const adx = advancedAnalysis.adx
    if (adx.adx > 25) { // Strong trend
      if (marketStructure.trend === 'uptrend') sentimentScore += 12
      else if (marketStructure.trend === 'downtrend') sentimentScore -= 12
    }
    factorCount++
  }

  // Factor 5: Ichimoku Cloud analysis (weighted 20%)
  if (advancedAnalysis.ichimoku !== null) {
    const ichimoku = advancedAnalysis.ichimoku
    const currentPrice = getCurrentPrice('EUR_USD', 'mid')
    if (currentPrice !== null) {
      // Price above cloud
      if (currentPrice > Math.max(ichimoku.senkouSpanA, ichimoku.senkouSpanB)) {
        sentimentScore += 15
      }
      // Price below cloud
      else if (currentPrice < Math.min(ichimoku.senkouSpanA, ichimoku.senkouSpanB)) {
        sentimentScore -= 15
      }
      // Tenkan above Kijun
      if (ichimoku.tenkanSen > ichimoku.kijunSen) sentimentScore += 5
      else sentimentScore -= 5
    }
    factorCount++
  }

  // Factor 6: Candlestick patterns (weighted 15%)
  patterns.forEach(pattern => {
    const weight = pattern.strength === 'strong' ? 1 : pattern.strength === 'moderate' ? 0.7 : 0.4
    const impact = (pattern.confidence / 100) * weight * 10

    if (pattern.type === 'bullish') sentimentScore += impact
    else if (pattern.type === 'bearish') sentimentScore -= impact
  })

  // Factor 7: Multiple timeframe confirmation (weighted 10%)
  const sma20 = calculateSMA(20)
  const sma50 = calculateSMA(50)
  const currentPrice = getCurrentPrice('EUR_USD', 'mid')
  if (sma20 && sma50 && currentPrice) {
    if (currentPrice > sma20 && sma20 > sma50) sentimentScore += 8 // Strong bullish alignment
    else if (currentPrice < sma20 && sma20 < sma50) sentimentScore -= 8 // Strong bearish alignment
    factorCount++
  }

  // Normalize to 0-100 range with more dynamic scaling
  const finalSentiment = Math.max(10, Math.min(90, sentimentScore))
  const label = finalSentiment > 65 ? 'Bullish' : finalSentiment > 35 ? 'Neutral' : 'Bearish'

  return {
    label,
    value: Math.round(finalSentiment)
  }
})

const volatility = computed(() => {
  if (!prices.value.length || !candles.value.length) return { level: 'UNKNOWN', value: 0 }

  // Calculate volatility using ATR (Average True Range) - more accurate
  const atr = calculateATR(14)
  const currentPrice = getCurrentPrice('EUR_USD', 'mid')

  if (atr !== null && currentPrice !== null) {
    // Calculate ATR as percentage of current price
    const atrPercent = (atr / currentPrice) * 100

    // Convert to 0-100 scale for display
    const volatilityValue = Math.min(100, atrPercent * 500) // Scale for UI

    let level = 'LOW'
    if (volatilityValue > 70) level = 'HIGH'
    else if (volatilityValue > 40) level = 'MEDIUM'

    return {
      level,
      value: Math.round(volatilityValue)
    }
  }

  // Fallback to spread-based calculation
  const spreads = prices.value.map(price => getSpreadInPips(price.instrument) || 0)
  const maxSpread = Math.max(...spreads)
  const volatilityValue = Math.min(100, maxSpread * 5)

  let level = 'LOW'
  if (volatilityValue > 70) level = 'HIGH'
  else if (volatilityValue > 40) level = 'MEDIUM'

  return {
    level,
    value: Math.round(volatilityValue)
  }
})

const activeSignals = computed(() => {
  if (!prices.value.length) return 0

  // Count instruments with actionable spreads (not too wide)
  return prices.value.filter(price => {
    const spread = getSpreadInPips(price.instrument)
    return spread !== null && spread < 5 // Reasonable spread threshold
  }).length
})

const successRate = computed(() => {
  if (!accountData.value) return 0

  // Calculate based on account balance and unrealized PnL
  const account = accountData.value
  const balance = parseFloat(account.balance || '0')
  const unrealizedPL = parseFloat(account.unrealizedPL || '0')

  if (balance <= 0) return 50

  const profitRatio = ((balance + unrealizedPL) / balance - 1) * 100
  return Math.max(0, Math.min(100, Math.round(60 + profitRatio * 10)))
})

const pairAnalysis = computed(() => {
  if (!prices.value.length) return []

  const pairConfigs = [
    { instrument: 'EUR_USD', name: 'EUR/USD', flag: '🇪🇺' },
    { instrument: 'GBP_USD', name: 'GBP/USD', flag: '🇬🇧' },
    { instrument: 'USD_JPY', name: 'USD/JPY', flag: '🇺🇸' },
    { instrument: 'AUD_USD', name: 'AUD/USD', flag: '🇦🇺' },
    { instrument: 'USD_CAD', name: 'USD/CAD', flag: '🇨🇦' },
    { instrument: 'USD_CHF', name: 'USD/CHF', flag: '🇨🇭' },
    { instrument: 'NZD_USD', name: 'NZD/USD', flag: '🇳🇿' },
    { instrument: 'XAU_USD', name: 'XAU/USD', flag: '🥇' }
  ]

  return pairConfigs.map(config => {
    const price = getCurrentPrice(config.instrument, 'mid')
    const spread = getSpreadInPips(config.instrument)

    // Generate signal based on spread quality and price movement
    let signal = 'HOLD'
    let strength = 5
    let trend = 'SIDEWAYS'

    if (spread !== null && spread > 0) {
      if (spread < 2) {
        signal = 'BUY'
        strength = 8
        trend = 'UP'
      } else if (spread > 5) {
        signal = 'SELL'
        strength = 7
        trend = 'DOWN'
      }
    }

    return {
      instrument: config.instrument,
      name: config.name,
      flag: config.flag,
      price: price ? price.toFixed(config.instrument.includes('JPY') ? 3 : 5) : 'N/A',
      signal,
      strength,
      trend
    }
  }).filter(pair => pair.price !== 'N/A').slice(0, 4) // Show top 4 available pairs
})

const technicalIndicators = computed(() => {
  if (!candles.value.length) return []

  const indicators = []
  const advancedAnalysis = getAdvancedAnalysis()

  // RSI (14-period)
  if (advancedAnalysis.rsi !== null) {
    indicators.push({
      name: 'RSI (14)',
      value: advancedAnalysis.rsi.toFixed(1),
      signal: advancedAnalysis.rsi < 30 ? 'OVERSOLD' : advancedAnalysis.rsi > 70 ? 'OVERBOUGHT' : 'NEUTRAL'
    })
  }

  // MACD
  if (advancedAnalysis.macd !== null) {
    const macd = advancedAnalysis.macd
    indicators.push({
      name: 'MACD',
      value: macd.macd.toFixed(4),
      signal: macd.macd > macd.signal ? 'BULLISH' : 'BEARISH'
    })
  }

  // Bollinger Bands %B
  if (advancedAnalysis.bollinger !== null) {
    const bb = advancedAnalysis.bollinger
    indicators.push({
      name: 'BB %B',
      value: bb.percentB.toFixed(2),
      signal: bb.percentB > 0.8 ? 'OVERBOUGHT' : bb.percentB < 0.2 ? 'OVERSOLD' : 'NEUTRAL'
    })
  }

  // Stochastic Oscillator
  if (advancedAnalysis.stochastic !== null) {
    const stoch = advancedAnalysis.stochastic
    indicators.push({
      name: 'Stoch %K',
      value: stoch.k.toFixed(1),
      signal: stoch.k < 20 ? 'OVERSOLD' : stoch.k > 80 ? 'OVERBOUGHT' : 'NEUTRAL'
    })
  }

  // ADX (Trend Strength)
  if (advancedAnalysis.adx !== null) {
    const adx = advancedAnalysis.adx
    indicators.push({
      name: 'ADX',
      value: adx.adx.toFixed(1),
      signal: adx.adx > 25 ? 'TRENDING' : 'NEUTRAL'
    })
  }

  // ATR (Volatility)
  if (advancedAnalysis.atr !== null) {
    indicators.push({
      name: 'ATR',
      value: advancedAnalysis.atr.toFixed(4),
      signal: advancedAnalysis.atr > 0.002 ? 'HIGH' : advancedAnalysis.atr > 0.001 ? 'MEDIUM' : 'LOW'
    })
  }

  // Williams %R
  if (advancedAnalysis.williams !== null) {
    indicators.push({
      name: 'Williams %R',
      value: advancedAnalysis.williams.toFixed(1),
      signal: advancedAnalysis.williams > -20 ? 'OVERBOUGHT' : advancedAnalysis.williams < -80 ? 'OVERSOLD' : 'NEUTRAL'
    })
  }

  // CCI (Commodity Channel Index)
  if (advancedAnalysis.cci !== null) {
    indicators.push({
      name: 'CCI',
      value: advancedAnalysis.cci.toFixed(1),
      signal: advancedAnalysis.cci > 100 ? 'OVERBOUGHT' : advancedAnalysis.cci < -100 ? 'OVERSOLD' : 'NEUTRAL'
    })
  }

  return indicators
})

// Advanced pattern recognition
const recognizedPatterns = computed(() => {
  if (!candles.value.length) return []
  return recognizePatterns()
})

// Market structure analysis
const marketStructureData = computed(() => {
  if (!candles.value.length) return null
  return analyzeMarketStructure()
})// Methods
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

    // Refresh both pricing and candles data in parallel
    await Promise.all([
      refreshPricing(),
      refreshCandles()
    ])

  } catch (error) {
    console.error('Failed to refresh analysis:', error)
  } finally {
    isRefreshing.value = false
  }
}// Auto-refresh every 30 seconds
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
