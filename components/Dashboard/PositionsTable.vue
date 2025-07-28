<template>
  <div class="w-full h-[500px]">
    <Card class="h-full">
      <CardHeader class="pb-3 border-b">
        <div class="flex items-center justify-between">
          <CardTitle class="text-base font-bold flex items-center gap-2">
            <Briefcase class="w-4 h-4" />
            <span>Open Positions</span>
            <Badge variant="outline" class="text-xs">
              <div class="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
              Live
            </Badge>
          </CardTitle>
          <div class="text-xs text-muted-foreground">
            {{ isLoading ? 'Loading...' : `${activePositionsCount} active ${activePositionsCount === 1 ? 'position' : 'positions'}` }}
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
import { computed } from 'vue'
import type { OandaTrade } from '@/types/Oanda'

// Get real OANDA data
const { data: positionsData, pending: positionsPending, error: positionsError } = useOandaPositions()
const { data: tradesData, pending: tradesPending, error: tradesError } = useOandaTrades()

// Helper function to get flag emoji for currency pairs
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

// Transform trades data for display
const displayTrades = computed(() => {
  if (!tradesData.value?.trades) return []

  return tradesData.value.trades.map((trade: OandaTrade) => ({
    id: trade.id,
    instrument: formatInstrument(trade.instrument),
    description: getInstrumentDescription(trade.instrument),
    flag: getCurrencyFlag(trade.instrument),
    side: getTradeSide(trade.currentUnits),
    size: formatUnits(trade.currentUnits),
    entryPrice: parseFloat(trade.price).toFixed(5),
    currentPrice: parseFloat(trade.price).toFixed(5), // We'd need current pricing for this
    pnl: parseFloat(trade.unrealizedPL),
    marginUsed: parseFloat(trade.marginUsed).toFixed(2),
    openTime: new Date(trade.openTime).toLocaleString(),
    rawTrade: trade
  }))
})

// Computed for active positions count
const activePositionsCount = computed(() => {
  return displayTrades.value.length
})

// Check if data is loading
const isLoading = computed(() => {
  return positionsPending.value || tradesPending.value
})

// Check if there's an error
const hasError = computed(() => {
  return positionsError.value || tradesError.value
})
</script>
