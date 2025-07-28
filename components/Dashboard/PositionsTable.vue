<template>
  <div class="w-full h-[500px]">
    <Card class="h-full">
      <CardHeader class="pb-3 border-b">
        <div class="flex items-center justify-between">
          <CardTitle class="text-base font-bold flex items-center gap-2">
            <Briefcase class="w-4 h-4" />
            <span>Open Positions</span>
            <Badge variant="outline" class="text-xs">
              <div class="w-1.5 h-1.5 rounded-full mr-1" :class="pricingPending ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'"></div>
              {{ pricingPending ? 'Updating' : 'Live' }}
            </Badge>
          </CardTitle>
          <div class="text-xs text-muted-foreground">
            <div>{{ isLoading ? 'Loading...' : `${activePositionsCount} active ${activePositionsCount === 1 ? 'position' : 'positions'}` }}</div>
            <div v-if="lastPriceUpdate" class="mt-1">
              Last update: {{ lastPriceUpdate.toLocaleTimeString() }}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent class="overflow-y-auto h-[430px] p-0">
        <!-- Table Header -->
        <div class="sticky top-0 bg-card border-b">
          <div class="grid grid-cols-7 gap-4 px-4 py-3 text-xs font-medium text-muted-foreground">
            <div>Instrument</div>
            <div>Side</div>
            <div>Size</div>
            <div>Entry Price</div>
            <div>Current Price</div>
            <div>P&L</div>
            <div>Actions</div>
          </div>
        </div>

        <!-- Positions List -->
        <div v-if="isLoading" class="flex items-center justify-center h-32">
          <div class="text-sm text-muted-foreground">Loading positions...</div>
        </div>

        <div v-else-if="hasError" class="flex items-center justify-center h-32">
          <div class="text-sm text-red-600">Error loading positions</div>
        </div>

        <div v-else-if="displayTrades.length > 0" class="divide-y divide-border">
          <div v-for="trade in displayTrades" :key="trade.id" class="grid grid-cols-7 gap-4 px-4 py-4 hover:bg-accent/50 transition-colors">
            <!-- Instrument -->
            <div class="flex items-center gap-2">
              <span class="text-lg">{{ trade.flag }}</span>
              <div>
                <div class="font-medium text-sm">{{ trade.instrument }}</div>
                <div class="text-xs text-muted-foreground">{{ trade.description }}</div>
              </div>
            </div>

            <!-- Side -->
            <div>
              <Badge :variant="trade.side === 'LONG' ? 'default' : 'destructive'" class="text-xs">
                {{ trade.side }}
              </Badge>
            </div>

            <!-- Size -->
            <div class="text-sm font-mono">{{ trade.size }}</div>

            <!-- Entry Price -->
            <div class="text-sm font-mono">{{ trade.entryPrice }}</div>

            <!-- Current Price -->
            <div class="text-sm font-mono">{{ trade.currentPrice }}</div>

            <!-- P&L -->
            <div class="text-sm font-mono" :class="trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'">
              {{ trade.pnl >= 0 ? '+' : '' }}${{ trade.pnl.toFixed(2) }}
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              <Button variant="outline" size="sm" class="h-6 px-2 text-xs">
                Close
              </Button>
              <Button variant="ghost" size="sm" class="h-6 w-6 p-0">
                <Settings class="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex flex-col items-center justify-center h-32 text-center">
          <Briefcase class="w-8 h-8 text-muted-foreground mb-2" />
          <p class="text-sm text-muted-foreground">No open positions</p>
          <Button variant="outline" size="sm" class="mt-2">
            Start Trading
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Briefcase, Settings } from 'lucide-vue-next'
import { computed, ref, watch, onUnmounted } from 'vue'
import type { OandaTrade } from '@/types/Oanda'

// Get real OANDA data
const { data: positionsData, pending: positionsPending, error: positionsError } = useOandaPositions()
const { data: tradesData, pending: tradesPending, error: tradesError } = useOandaTrades()

// Create a reactive pricing data store
const pricingData = ref<any>(null)
const pricingPending = ref(false)
const currentInstruments = ref<string[]>([])
const lastPriceUpdate = ref<Date | null>(null)

// Function to fetch pricing data
const fetchPricingData = async (instruments: string[]) => {
  if (instruments.length === 0) return

  try {
    pricingPending.value = true
    console.log('Fetching pricing for instruments:', instruments)
    const response = await $fetch(`/api/oanda/pricing?instruments=${instruments.join(',')}`)
    console.log('Pricing response received:', response)
    pricingData.value = response
    lastPriceUpdate.value = new Date()
  } catch (error) {
    console.error('Error fetching pricing:', error)
  } finally {
    pricingPending.value = false
  }
}

// Set up automatic pricing updates every 5 seconds
let pricingInterval: NodeJS.Timeout | null = null

const startPricingUpdates = () => {
  if (pricingInterval) {
    clearInterval(pricingInterval)
  }

  // Update every 5 seconds to match OANDA cache TTL
  pricingInterval = setInterval(() => {
    if (currentInstruments.value.length > 0) {
      console.log('Auto-updating pricing data...')
      fetchPricingData(currentInstruments.value)
    }
  }, 5000)
}

const stopPricingUpdates = () => {
  if (pricingInterval) {
    clearInterval(pricingInterval)
    pricingInterval = null
  }
}

// Watch for changes in trades data and fetch pricing
watch(tradesData, (newTradesData) => {
  if (newTradesData?.trades) {
    const instruments = [...new Set(newTradesData.trades.map((trade: any) => trade.instrument))]
    console.log('Trades data changed, instruments:', instruments)
    currentInstruments.value = instruments
    fetchPricingData(instruments)

    // Start auto-updates if we have instruments
    if (instruments.length > 0) {
      startPricingUpdates()
    } else {
      stopPricingUpdates()
    }
  } else {
    // No trades, stop updates
    currentInstruments.value = []
    stopPricingUpdates()
  }
}, { immediate: true })

// Cleanup on component unmount
onUnmounted(() => {
  stopPricingUpdates()
})// Helper function to get flag emoji for currency pairs
const getCurrencyFlag = (instrument: string): string => {
  const flags: Record<string, string> = {
    'EUR_USD': '🇪🇺🇺🇸',
    'GBP_USD': '🇬🇧🇺🇸',
    'USD_JPY': '🇺🇸🇯🇵',
    'AUD_USD': '🇦🇺🇺🇸',
    'USD_CAD': '🇺🇸🇨🇦',
    'USD_CHF': '🇺🇸🇨🇭',
    'NZD_USD': '🇳🇿🇺🇸',
    'EUR_GBP': '🇪🇺🇬🇧',
    'EUR_JPY': '🇪🇺🇯🇵',
    'GBP_JPY': '🇬🇧🇯🇵',
    'XAU_USD': '🥇🇺🇸',
    'XAG_USD': '🥈🇺🇸'
  }
  return flags[instrument] || '💱'
}

// Helper function to format instrument name for display
const formatInstrument = (instrument: string): string => {
  return instrument.replace('_', '/')
}

// Helper function to get instrument description
const getInstrumentDescription = (instrument: string): string => {
  const descriptions: Record<string, string> = {
    'EUR_USD': 'Euro / US Dollar',
    'GBP_USD': 'British Pound / US Dollar',
    'USD_JPY': 'US Dollar / Japanese Yen',
    'AUD_USD': 'Australian Dollar / US Dollar',
    'USD_CAD': 'US Dollar / Canadian Dollar',
    'USD_CHF': 'US Dollar / Swiss Franc',
    'NZD_USD': 'New Zealand Dollar / US Dollar',
    'EUR_GBP': 'Euro / British Pound',
    'EUR_JPY': 'Euro / Japanese Yen',
    'GBP_JPY': 'British Pound / Japanese Yen',
    'XAU_USD': 'Gold / US Dollar',
    'XAG_USD': 'Silver / US Dollar'
  }
  return descriptions[instrument] || instrument.replace('_', ' / ')
}

// Helper function to determine trade side
const getTradeSide = (units: string): 'LONG' | 'SHORT' => {
  return parseFloat(units) > 0 ? 'LONG' : 'SHORT'
}

// Helper function to format units
const formatUnits = (units: string): string => {
  const num = Math.abs(parseFloat(units))
  return num.toLocaleString()
}

// Helper function to get current price from pricing data
const getCurrentPrice = (instrument: string, side: 'LONG' | 'SHORT'): string => {
  console.log('getCurrentPrice called:', { instrument, side, pricingData: pricingData.value })

  if (!pricingData.value?.prices) {
    console.log('No pricing data available')
    return 'Loading...'
  }

  const priceData = pricingData.value.prices.find((p: any) => p.instrument === instrument)
  console.log('Found price data for', instrument, ':', priceData)

  if (!priceData) {
    console.log('No price data found for instrument:', instrument)
    return 'N/A'
  }

  // For LONG positions, we use the bid price (what we can sell at)
  // For SHORT positions, we use the ask price (what we need to buy at to close)
  const price = side === 'LONG'
    ? priceData.bids?.[0]?.price
    : priceData.asks?.[0]?.price

  console.log('Selected price:', price, 'for side:', side)
  return price ? parseFloat(price).toFixed(5) : 'N/A'
}

// Transform trades data for display
const displayTrades = computed(() => {
  console.log('Computing displayTrades, tradesData:', tradesData.value)
  if (!tradesData.value?.trades) return []

  return tradesData.value.trades.map((trade: OandaTrade) => {
    const side = getTradeSide(trade.currentUnits)
    const currentPrice = getCurrentPrice(trade.instrument, side)

    console.log('Processing trade:', trade.id, 'instrument:', trade.instrument, 'side:', side, 'currentPrice:', currentPrice)

    return {
      id: trade.id,
      instrument: formatInstrument(trade.instrument),
      description: getInstrumentDescription(trade.instrument),
      flag: getCurrencyFlag(trade.instrument),
      side,
      size: formatUnits(trade.currentUnits),
      entryPrice: parseFloat(trade.price).toFixed(5),
      currentPrice: currentPrice,
      pnl: parseFloat(trade.unrealizedPL),
      marginUsed: parseFloat(trade.marginUsed).toFixed(2),
      openTime: new Date(trade.openTime).toLocaleString(),
      rawTrade: trade
    }
  })
})

// Computed for active positions count
const activePositionsCount = computed(() => {
  return displayTrades.value.length
})

// Check if data is loading
const isLoading = computed(() => {
  return positionsPending.value || tradesPending.value || pricingPending.value
})

// Check if there's an error
const hasError = computed(() => {
  return positionsError.value || tradesError.value
})
</script>
