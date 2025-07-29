<template>
  <div class="space-y-6">
    <!-- Multi-Timeframe Header -->
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-900">Professional Market Analysis</h2>
      <div class="flex items-center space-x-4">
        <!-- Timeframe Selector -->
        <div class="flex space-x-2">
          <Button v-for="tf in timeframes" :key="tf.key" @click="activeTimeframe = tf.key" :variant="activeTimeframe === tf.key ? 'default' : 'outline'" size="sm">
            {{ tf.label }}
          </Button>
        </div>

        <!-- Market Status -->
        <div class="flex items-center space-x-2">
          <div :class="[
            'w-3 h-3 rounded-full',
            'bg-green-500'
          ]"></div>
          <span class="text-sm font-medium">Market Open</span>
        </div>
      </div>
    </div>

    <!-- Overall Market Bias -->
    <Card v-if="multiTimeframeAnalysis && multiTimeframeAnalysis.overall.bias !== 'neutral'">
      <CardHeader>
        <CardTitle class="flex items-center space-x-2">
          <TrendingUp v-if="multiTimeframeAnalysis.overall.bias === 'bullish'" class="h-5 w-5 text-green-500" />
          <TrendingDown v-else class="h-5 w-5 text-red-500" />
          <span>Overall Market Bias: {{ multiTimeframeAnalysis.overall.bias.toUpperCase() }}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <p class="text-sm text-gray-600">Confidence</p>
            <p class="text-2xl font-bold">{{ multiTimeframeAnalysis.overall.confidence.toFixed(1) }}%</p>
          </div>
          <div>
            <p class="text-sm text-gray-600">Timeframe Confluence</p>
            <p class="text-2xl font-bold">{{ multiTimeframeAnalysis.overall.confluence.toFixed(1) }}%</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Trading Signals -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <span>Active Trading Signals</span>
          <Badge :variant="activeSignals.length > 0 ? 'default' : 'secondary'">
            {{ activeSignals.length }} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="activeSignals.length === 0" class="text-center py-8 text-gray-500">
          No active trading signals at this time
        </div>
        <div v-else class="space-y-3">
          <div v-for="signal in activeSignals.slice(0, 3)" :key="signal.id" :class="[
            'p-4 rounded-lg border-l-4',
            signal.type === 'buy' ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
          ]">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <ArrowUp v-if="signal.type === 'buy'" class="h-4 w-4 text-green-600" />
                <ArrowDown v-else class="h-4 w-4 text-red-600" />
                <span class="font-medium">{{ signal.type.toUpperCase() }} Signal</span>
                <Badge :variant="signal.strength === 'strong' ? 'default' : 'secondary'">
                  {{ signal.strength }}
                </Badge>
              </div>
              <span class="text-sm font-medium">{{ signal.confidence }}% confidence</span>
            </div>
            <p class="text-sm text-gray-600 mt-1">{{ signal.reason }}</p>
            <div class="flex items-center space-x-4 mt-2 text-xs text-gray-500">
              <span>Price: {{ signal.price.toFixed(5) }}</span>
              <span>SL: {{ signal.suggestedStopLoss.toFixed(5) }}</span>
              <span>TP: {{ signal.suggestedTakeProfit.toFixed(5) }}</span>
              <span>{{ signal.indicators.join(', ') }}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Risk Management Calculator -->
    <Card>
      <CardHeader>
        <CardTitle>Risk Management Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <label class="text-sm font-medium">Account Balance</label>
              <Input v-model.number="riskSettings.accountBalance" type="number" placeholder="10000" />
            </div>
            <div>
              <label class="text-sm font-medium">Risk Percentage</label>
              <Input v-model.number="riskSettings.riskPercentage" type="number" placeholder="2" step="0.1" />
            </div>
            <div>
              <label class="text-sm font-medium">Entry Price</label>
              <Input v-model.number="riskSettings.entryPrice" type="number" placeholder="1.10000" step="0.00001" />
            </div>
            <div>
              <label class="text-sm font-medium">Stop Loss</label>
              <Input v-model.number="riskSettings.stopLossPrice" type="number" placeholder="1.09500" step="0.00001" />
            </div>
          </div>

          <div class="space-y-4">
            <div class="p-4 bg-gray-50 rounded-lg">
              <h4 class="font-medium mb-2">Position Size</h4>
              <p class="text-2xl font-bold text-blue-600">{{ calculation.positionSize.toFixed(5) }}</p>
              <p class="text-sm text-gray-600">lots</p>
            </div>

            <div class="p-4 bg-gray-50 rounded-lg">
              <h4 class="font-medium mb-2">Risk/Reward</h4>
              <p class="text-2xl font-bold" :class="calculation.riskRewardRatio >= 2 ? 'text-green-600' : 'text-red-600'">
                1:{{ calculation.riskRewardRatio.toFixed(1) }}
              </p>
            </div>

            <div class="p-4 bg-gray-50 rounded-lg">
              <h4 class="font-medium mb-2">Max Risk</h4>
              <p class="text-lg font-bold text-red-600">${{ calculation.maxRisk.toFixed(2) }}</p>
            </div>

            <div :class="[
              'p-3 rounded-lg text-center font-medium',
              riskAssessment.color === 'green' ? 'bg-green-100 text-green-800' :
                riskAssessment.color === 'red' ? 'bg-red-100 text-red-800' :
                  riskAssessment.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
            ]">
              {{ riskAssessment.assessment }}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Economic Calendar -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <span>Economic Calendar</span>
          <Badge :variant="currentMarketImpact.level === 'high' ? 'destructive' : 'default'">
            {{ currentMarketImpact.level.toUpperCase() }} Impact
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div v-if="upcomingEvents.length === 0" class="text-center py-4 text-gray-500">
          No upcoming high-impact events
        </div>
        <div v-else class="space-y-3">
          <div v-for="event in upcomingEvents.slice(0, 5)" :key="event.id" class="flex items-center justify-between p-3 border rounded-lg">
            <div class="flex items-center space-x-3">
              <Badge :variant="event.importance === 'high' ? 'destructive' : event.importance === 'medium' ? 'default' : 'secondary'">
                {{ event.currency }}
              </Badge>
              <div>
                <p class="font-medium">{{ event.event }}</p>
                <p class="text-sm text-gray-600">{{ event.time }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm">{{ event.forecast || 'N/A' }}</p>
              <p class="text-xs text-gray-500">Forecast</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Volume Analysis -->
    <Card>
      <CardHeader>
        <CardTitle>Volume Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <h4 class="font-medium mb-2">Volume Indicators</h4>
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span class="text-sm">VWAP</span>
                  <span class="font-medium">{{ volumeIndicators.vwap?.toFixed(5) || 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm">Money Flow Index</span>
                  <span class="font-medium">{{ volumeIndicators.mfi?.toFixed(1) || 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-sm">Volume Ratio</span>
                  <span class="font-medium">{{ volumeIndicators.volumeRatio?.toFixed(2) || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <div class="p-3 rounded-lg" :class="[
              volumeStrength.strength === 'strong' ? 'bg-green-100 text-green-800' :
                volumeStrength.strength === 'weak' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
            ]">
              <p class="font-medium">Volume Strength: {{ volumeStrength.strength.toUpperCase() }}</p>
              <p class="text-sm">Score: {{ volumeStrength.score }}</p>
            </div>
          </div>

          <div>
            <h4 class="font-medium mb-2">Point of Control</h4>
            <div v-if="pointOfControl" class="p-3 bg-blue-50 rounded-lg">
              <p class="text-lg font-bold text-blue-600">{{ pointOfControl.priceLevel.toFixed(5) }}</p>
              <p class="text-sm text-gray-600">{{ pointOfControl.percentage.toFixed(1) }}% of volume</p>
            </div>

            <h4 class="font-medium mt-4 mb-2">Volume Alerts</h4>
            <div class="space-y-2 max-h-32 overflow-y-auto">
              <div v-for="alert in volumeAlerts.slice(0, 3)" :key="alert.id" class="p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded text-sm">
                <p class="font-medium">{{ alert.type.replace('_', ' ').toUpperCase() }}</p>
                <p class="text-gray-600">{{ alert.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Correlation Matrix -->
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between">
          <span>Currency Correlation & Strength</span>
          <Badge :variant="marketSentiment.sentiment !== 'neutral' ? 'default' : 'secondary'">
            {{ marketSentiment.sentiment.replace('_', '-').toUpperCase() }}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div class="grid grid-cols-2 gap-6">
          <!-- Currency Strength Ranking -->
          <div>
            <h4 class="font-medium mb-3">Currency Strength Ranking</h4>
            <div class="space-y-2">
              <div v-for="currency in currencyStrengths.slice(0, 6)" :key="currency.currency" class="flex items-center justify-between p-2 rounded" :class="currency.rank <= 2 ? 'bg-green-50' : currency.rank >= 7 ? 'bg-red-50' : 'bg-gray-50'">
                <div class="flex items-center space-x-2">
                  <span class="font-bold">{{ currency.rank }}</span>
                  <span class="font-medium">{{ currency.currency }}</span>
                </div>
                <span class="text-sm" :class="currency.strength > 0 ? 'text-green-600' : 'text-red-600'">
                  {{ currency.strength.toFixed(1) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Top Correlations -->
          <div>
            <h4 class="font-medium mb-3">Strong Correlations</h4>
            <div class="space-y-2">
              <div v-for="corr in correlationMatrix.slice(0, 5)" :key="`${corr.pair1}-${corr.pair2}`" class="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div class="text-sm">
                  <span class="font-medium">{{ corr.pair1 }}</span> vs <span class="font-medium">{{ corr.pair2 }}</span>
                </div>
                <div class="text-right">
                  <span :class="corr.correlation > 0 ? 'text-green-600' : 'text-red-600'" class="font-medium">
                    {{ (corr.correlation * 100).toFixed(0) }}%
                  </span>
                  <p class="text-xs text-gray-500">{{ corr.strength }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Market Insights -->
        <div v-if="marketInsights.length > 0" class="mt-4 pt-4 border-t">
          <h4 class="font-medium mb-2">Market Insights</h4>
          <div class="space-y-2">
            <div v-for="insight in marketInsights.slice(0, 2)" :key="insight.type + insight.timestamp" class="p-3 rounded-lg" :class="insight.significance === 'high' ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'">
              <p class="font-medium text-sm">{{ insight.type.replace('_', ' ').toUpperCase() }}</p>
              <p class="text-sm text-gray-600">{{ insight.description }}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-vue-next'
import { useMultiTimeframeAnalysis } from '@/composables/useMultiTimeframeAnalysis'
import { useRiskManagement } from '@/composables/useRiskManagement'
import { useTradingSignals } from '@/composables/useTradingSignals'
import { useEconomicCalendar } from '@/composables/useEconomicCalendar'
import { useVolumeAnalysis } from '@/composables/useVolumeAnalysis'
import { useCorrelationMatrix } from '@/composables/useCorrelationMatrix'
import { useOandaCandles } from '@/composables/useOandaCandles'

// Multi-timeframe analysis
const {
  analysis: multiTimeframeAnalysis,
  activeTimeframe,
  timeframes,
  fetchAllTimeframes,
  startAutoRefresh: startMTFRefresh
} = useMultiTimeframeAnalysis('EUR_USD')

// Risk management
const {
  riskSettings,
  calculation,
  riskAssessment
} = useRiskManagement()

// Trading signals
const {
  signals,
  activeSignals,
  generateSignals,
  addSignal
} = useTradingSignals()

// Economic calendar
const {
  upcomingEvents,
  currentMarketImpact,
  fetchCalendarData
} = useEconomicCalendar()

// Volume analysis
const {
  volumeIndicators,
  volumeStrength,
  pointOfControl,
  volumeAlerts,
  calculateVolumeIndicators
} = useVolumeAnalysis()

// Correlation matrix
const {
  correlationMatrix,
  currencyStrengths,
  marketInsights,
  marketSentiment,
  fetchCorrelationData
} = useCorrelationMatrix()

// Current market data
const { data: candleData } = useOandaCandles('EUR_USD', 'M5', 500)

// Auto-refresh interval
let refreshInterval: NodeJS.Timeout

const startDataRefresh = () => {
  refreshInterval = setInterval(async () => {
    // Generate new signals from current candle data
    if (candleData.value?.candles) {
      const newSignals = await generateSignals('EUR_USD', candleData.value.candles, activeTimeframe.value)
      newSignals.forEach(signal => addSignal(signal))

      // Update volume analysis
      calculateVolumeIndicators(candleData.value.candles)
    }

    // Refresh other data sources
    await fetchCorrelationData()
  }, 30000) // 30 seconds
}

onMounted(async () => {
  // Initial data load
  await Promise.all([
    fetchAllTimeframes(),
    fetchCalendarData(),
    fetchCorrelationData()
  ])

  // Start auto-refresh for all components
  startMTFRefresh()
  startDataRefresh()

  // Initialize with current candle data
  if (candleData.value?.candles) {
    calculateVolumeIndicators(candleData.value.candles)
  }
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})
</script>
