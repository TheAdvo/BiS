<template>
  <Card class="h-full">
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="text-lg font-semibold flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
          <div class="text-2xl font-bold text-primary">Trading View</div>
        </CardTitle>
        <div class="flex items-center gap-2">
          <!-- Symbol Selector -->
          <Select v-model="selectedSymbol" @update:modelValue="updateSymbol">
            <SelectTrigger class="w-32">
              <SelectValue placeholder="Symbol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="symbol in symbols" :key="symbol.value" :value="symbol.value">
                {{ symbol.label }}
              </SelectItem>
            </SelectContent>
          </Select>

          <!-- Timeframe Selector -->
          <Select v-model="selectedTimeframe" @update:modelValue="updateTimeframe">
            <SelectTrigger class="w-24">
              <SelectValue placeholder="Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem v-for="timeframe in timeframes" :key="timeframe.value" :value="timeframe.value">
                {{ timeframe.label }}
              </SelectItem>
            </SelectContent>
          </Select>

          <!-- Refresh Button -->
          <Button variant="outline" size="sm" @click="refreshChart" :disabled="isLoading" class="flex items-center gap-1">
            <svg class="w-4 h-4" :class="{ 'animate-spin': isLoading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            Refresh
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div class="relative w-full h-96 lg:h-[500px]">
        <!-- Loading State -->
        <div v-if="isLoading" class="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-10">
          <div class="flex flex-col items-center gap-2">
            <div class="w-8 h-8 border-4 border-primary/20 border-l-primary rounded-full animate-spin"></div>
            <span class="text-sm text-muted-foreground">Loading chart...</span>
          </div>
        </div>

        <!-- Error State -->
        <div v-if="hasError" class="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg z-10">
          <div class="flex flex-col items-center gap-2 text-center">
            <svg class="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="text-sm text-muted-foreground">Failed to load chart</span>
            <Button variant="outline" size="sm" @click="retryChart">
              Retry
            </Button>
          </div>
        </div>

        <!-- TradingView Widget Container -->
        <div v-show="!isLoading && !hasError" ref="chartContainer" class="tradingview-widget-container w-full h-full rounded-lg overflow-hidden">
          <div class="tradingview-widget-container__widget w-full h-full"></div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

// Component state
const isLoading = ref(true)
const hasError = ref(false)
const selectedSymbol = ref('EURUSD')
const selectedTimeframe = ref('15')
const chartContainer = ref<HTMLElement>()

// Available options
const symbols = ref([
  { label: 'EUR/USD', value: 'EURUSD' },
  { label: 'GBP/USD', value: 'GBPUSD' },
  { label: 'USD/JPY', value: 'USDJPY' },
  { label: 'USD/CHF', value: 'USDCHF' },
  { label: 'AUD/USD', value: 'AUDUSD' },
  { label: 'USD/CAD', value: 'USDCAD' },
  { label: 'NZD/USD', value: 'NZDUSD' },
  { label: 'BTC/USD', value: 'BTCUSD' },
  { label: 'ETH/USD', value: 'ETHUSD' },
  { label: 'SPX500', value: 'SPX500' },
  { label: 'US30', value: 'US30' },
  { label: 'NAS100', value: 'NAS100' },
  { label: 'GOLD', value: 'XAUUSD' },
  { label: 'SILVER', value: 'XAGUSD' }
])

const timeframes = ref([
  { label: '1m', value: '1' },
  { label: '5m', value: '5' },
  { label: '15m', value: '15' },
  { label: '30m', value: '30' },
  { label: '1h', value: '60' },
  { label: '4h', value: '240' },
  { label: '1D', value: '1D' },
  { label: '1W', value: '1W' }
])

// Helper function to get timeframe label
function getTimeframeLabel(value: string): string {
  const frame = timeframes.value.find(tf => tf.value === value)
  return frame ? frame.label : value
}

// Create TradingView widget
function createTradingViewWidget() {
  if (!chartContainer.value) return

  try {
    isLoading.value = true
    hasError.value = false

    // Clear previous content
    chartContainer.value.innerHTML = ''

    // Create the widget container structure
    const widgetContainer = document.createElement('div')
    widgetContainer.className = 'tradingview-widget-container__widget'
    widgetContainer.style.height = '100%'
    widgetContainer.style.width = '100%'

    chartContainer.value.appendChild(widgetContainer)

    // Create and configure the script
    const script = document.createElement('script')
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js'
    script.type = 'text/javascript'
    script.async = true

    // Widget configuration
    const config = {
      allow_symbol_change: true,
      calendar: false,
      details: false,
      hide_side_toolbar: true,
      hide_top_toolbar: false,
      hide_legend: false,
      hide_volume: false,
      hotlist: false,
      interval: selectedTimeframe.value,
      locale: 'en',
      save_image: true,
      style: '1',
      symbol: selectedSymbol.value,
      theme: 'dark',
      timezone: 'Etc/UTC',
      backgroundColor: '#0F0F0F',
      gridColor: 'rgba(242, 242, 242, 0.06)',
      watchlist: [],
      withdateranges: false,
      compareSymbols: [],
      studies: [],
      autosize: true
    }

    script.innerHTML = JSON.stringify(config)

    // Handle script load events
    script.onload = () => {
      setTimeout(() => {
        isLoading.value = false
      }, 2000) // Give TradingView time to initialize
    }

    script.onerror = () => {
      console.error('Failed to load TradingView script')
      isLoading.value = false
      hasError.value = true
    }

    chartContainer.value.appendChild(script)

  } catch (error) {
    console.error('Error creating TradingView widget:', error)
    isLoading.value = false
    hasError.value = true
  }
}

// Initialize chart
async function initializeChart() {
  await nextTick()
  createTradingViewWidget()
}

// Update symbol
function updateSymbol() {
  initializeChart()
}

// Update timeframe
function updateTimeframe() {
  initializeChart()
}

// Refresh chart
function refreshChart() {
  initializeChart()
}

// Retry chart
function retryChart() {
  hasError.value = false
  initializeChart()
}

// Lifecycle hooks
onMounted(() => {
  initializeChart()
})

onUnmounted(() => {
  // Clean up any intervals or listeners if needed
})
</script>

<style scoped>
.tradingview-widget-container {
  height: 100% !important;
  width: 100% !important;
}

.tradingview-widget-container__widget {
  height: 100% !important;
  width: 100% !important;
}

/* Hide TradingView copyright if needed */
.tradingview-widget-copyright {
  display: none !important;
}
</style>
