<template>
  <div class="w-full h-[500px]">
    <Card class="w-full text-muted-foreground h-full">
      <CardHeader>
        <CardTitle>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-4">
              <span class="text-2xl font-bold text-primary">Live Pricing</span>
              <span :class="[
                'inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium',
                sseStatus === 'connected' ? 'bg-primary text-primary-foreground' :
                  sseStatus === 'connecting' ? 'bg-chart-2 text-white' :
                    'bg-destructive text-destructive-foreground'
              ]">
                <span class="w-2 h-2 rounded-full" :class="[
                  sseStatus === 'connected' ? 'bg-chart-1' :
                    sseStatus === 'connecting' ? 'bg-chart-2/70 animate-spin' :
                      'bg-destructive/80'
                ]"></span>
                {{ sseStatus === 'connected' ? 'Live' : sseStatus === 'connecting' ? 'Connecting' : 'Disconnected' }}
              </span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground">
                {{ Object.keys(prices).length }} pairs
              </span>
              <button @click="reconnect" :disabled="sseStatus === 'connecting'" class="px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded disabled:opacity-50 transition-colors">
                Reconnect
              </button>
            </div>
          </div>
        </CardTitle>
        <CardDescription>Live OANDA pricing for defined pairs. Last update: {{ lastUpdate || 'Never' }}</CardDescription>
      </CardHeader>
      <CardContent class="overflow-y-auto h-[400px]">
        <TooltipProvider>
          <div v-if="error" class="text-destructive-foreground p-3 rounded bg-destructive/10 border border-destructive/20 mb-4">
            {{ error }}
            <button @click="error = null" class="ml-2 text-xs underline hover:no-underline">Dismiss</button>
          </div>

          <!-- Loading State -->
          <div v-if="Object.keys(prices).length === 0 && !error" class="space-y-3">
            <Skeleton class="w-32 h-4" />
            <Skeleton class="w-48 h-6" />
            <Skeleton class="w-full h-20" />
          </div>

          <!-- Search and Filter -->
          <div v-if="Object.keys(prices).length > 0 || availableInstruments.length > 0" class="mb-4 space-y-2">
            <div class="flex flex-col sm:flex-row gap-2">
              <input v-model="searchQuery" placeholder="Search currency pairs..." class="px-3 py-2 border border-border bg-background text-foreground rounded text-sm flex-1 focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>

            <!-- Instrument Category Filter -->
            <div class="flex flex-wrap gap-2">
              <button @click="setInstrumentFilter('all')" :class="['px-3 py-1 rounded text-xs font-medium transition-colors',
                instrumentFilter === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80']">
                All ({{ availableInstruments.length }})
              </button>
              <button @click="setInstrumentFilter('major')" :class="['px-3 py-1 rounded text-xs font-medium transition-colors',
                instrumentFilter === 'major' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80']">
                Major ({{ majorPairs.length }})
              </button>
              <button @click="setInstrumentFilter('minor')" :class="['px-3 py-1 rounded text-xs font-medium transition-colors',
                instrumentFilter === 'minor' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80']">
                Minor ({{ minorPairs.length }})
              </button>
              <button @click="setInstrumentFilter('exotic')" :class="['px-3 py-1 rounded text-xs font-medium transition-colors',
                instrumentFilter === 'exotic' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80']">
                Exotic ({{ exoticPairs.length }})
              </button>
              <button @click="refreshInstruments" :disabled="instrumentsLoading" class="px-3 py-1 rounded text-xs font-medium bg-chart-2 text-white hover:bg-chart-2/80 disabled:opacity-50 transition-colors">
                {{ instrumentsLoading ? 'Loading...' : 'Refresh Pairs' }}
              </button>
            </div>
          </div>

          <!-- Pricing Table -->
          <div v-if="Object.keys(prices).length > 0" class="overflow-x-auto">
            <table aria-label="Live currency pricing table" class="min-w-full text-left border-separate border-spacing-y-1">
              <thead>
                <tr class="text-xs">
                  <th class="px-3 py-2 font-semibold text-muted-foreground">Pair</th>
                  <th class="px-3 py-2 font-semibold text-muted-foreground">Bid</th>
                  <th class="px-3 py-2 font-semibold text-muted-foreground">Ask</th>
                  <th class="px-3 py-2 font-semibold text-muted-foreground">Spread</th>
                  <th class="px-3 py-2 font-semibold text-muted-foreground">Change</th>
                  <th class="px-3 py-2 font-semibold text-muted-foreground">Time</th>
                </tr>
              </thead>
              <tbody>
                <template v-for="(price, pairKey) in paginatedPrices" :key="pairKey">
                  <tr class="bg-card/50 hover:bg-card transition-colors">
                    <!-- Pair -->
                    <td class="px-3 py-2 font-medium text-sm">
                      <div class="flex items-center gap-2">
                        <span class="text-lg">{{ getFlag(String(pairKey).split('_')[0]) }}{{ getFlag(String(pairKey).split('_')[1]) }}</span>
                        <span class="font-mono">{{ String(pairKey).replace('_', '/') }}</span>
                      </div>
                    </td>
                    <!-- Bid -->
                    <td class="px-3 py-2 font-mono text-sm">
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <div class="flex items-center gap-2">
                            <span>{{ formatPrice(price?.bids?.[0]?.price) }}</span>
                            <span v-if="previousPrices[String(pairKey)] !== undefined" class="text-xs">
                              <span v-if="Number(price?.bids?.[0]?.price) > previousPrices[String(pairKey)]" class="text-chart-1">▲</span>
                              <span v-else-if="Number(price?.bids?.[0]?.price) < previousPrices[String(pairKey)]" class="text-destructive">▼</span>
                              <span v-else class="text-muted-foreground">●</span>
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          Sell price - The price at which you can sell the base currency
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    <!-- Ask -->
                    <td class="px-3 py-2 font-mono text-sm">
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <span>{{ formatPrice(price?.asks?.[0]?.price) }}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Buy price - The price at which you can buy the base currency
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    <!-- Spread -->
                    <td class="px-3 py-2 font-mono text-sm">
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <span class="px-2 py-1 bg-muted/50 text-muted-foreground rounded text-xs">
                            {{ calculateSpread(price) }}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Spread ({{ calculateSpreadPips(price) }} pips) - Difference between ask and bid
                        </TooltipContent>
                      </Tooltip>
                    </td>
                    <!-- Price Change -->
                    <td class="px-3 py-2 text-sm">
                      <span v-if="previousPrices[String(pairKey)] !== undefined" :class="[
                        'px-2 py-1 rounded text-xs font-medium',
                        Number(price?.bids?.[0]?.price) > previousPrices[String(pairKey)] ? 'bg-chart-1/20 text-chart-1 border border-chart-1/30' :
                          Number(price?.bids?.[0]?.price) < previousPrices[String(pairKey)] ? 'bg-destructive/20 text-destructive border border-destructive/30' :
                            'bg-muted text-muted-foreground border border-border'
                      ]">
                        {{ getPriceChange(price, String(pairKey)) }}
                      </span>
                      <span v-else class="text-xs text-muted-foreground">—</span>
                    </td>
                    <!-- Time -->
                    <td class="px-3 py-2 text-xs text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger as-child>
                          <span>{{ formatTime(price.time) }}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          Last updated: {{ price.time ? new Date(price.time).toLocaleString() : 'Unknown' }}
                        </TooltipContent>
                      </Tooltip>
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>

            <!-- Pagination Controls -->
            <div v-if="totalPages > 1" class="flex items-center justify-between mt-4 px-2">
              <div class="text-xs text-muted-foreground">
                Showing {{ (currentPage * itemsPerPage) + 1 }}-{{ Math.min((currentPage + 1) * itemsPerPage, Object.keys(filteredPrices).length) }}
                of {{ Object.keys(filteredPrices).length }} pairs
              </div>

              <div class="flex items-center gap-2">
                <button @click="prevPage" :disabled="!canGoPrev" class="px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  ← Prev
                </button>

                <!-- Page Numbers -->
                <div class="flex items-center gap-1">
                  <template v-for="page in Math.min(totalPages, 5)" :key="page">
                    <button @click="goToPage(page - 1)" :class="[
                      'w-6 h-6 text-xs rounded transition-colors',
                      currentPage === page - 1
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary hover:bg-secondary/80 text-secondary-foreground'
                    ]">
                      {{ page }}
                    </button>
                  </template>
                  <span v-if="totalPages > 5" class="text-xs text-muted-foreground px-1">...</span>
                </div>

                <button @click="nextPage" :disabled="!canGoNext" class="px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Next →
                </button>
              </div>
            </div>

            <!-- No results message -->
            <div v-if="Object.keys(filteredPrices).length === 0" class="text-center py-8 text-muted-foreground">
              No currency pairs match your search.
            </div>
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { PriceMessage } from '@/types/Oanda'
import { useOandaInstruments } from '@/composables/useOandaInstruments'

const prices = ref<Record<string, PriceMessage>>({})
const error = ref<string | null>(null)
const searchQuery = ref<string>('')
const previousPrices = ref<Record<string, number>>({})
const lastUpdate = ref<string>('')
const instrumentFilter = ref<'all' | 'major' | 'minor' | 'exotic'>('all')
const currentPage = ref<number>(0)
const itemsPerPage = 5
let sse: EventSource | null = null
const sseStatus = ref<'connecting' | 'connected' | 'disconnected'>('connecting')

// Use the instruments composable
const {
  instruments: availableInstruments,
  loading: instrumentsLoading,
  error: instrumentsError,
  fetchInstruments,
  getPopularInstruments,
  getMajorPairs,
  getMinorPairs,
  getExoticPairs
} = useOandaInstruments()

// Computed properties for instrument categories
const majorPairs = computed(() => getMajorPairs())
const minorPairs = computed(() => getMinorPairs())
const exoticPairs = computed(() => getExoticPairs())

// Computed property for filtered prices
const filteredPrices = computed(() => {
  let filtered = { ...prices.value }

  // Filter by search query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = Object.fromEntries(
      Object.entries(filtered).filter(([pair]) => {
        const pairLower = pair.toLowerCase()
        const pairFormatted = pair.replace('_', '/').toLowerCase()
        return pairLower.includes(query) || pairFormatted.includes(query)
      })
    )
  }

  return filtered
})

// Computed property for paginated prices
const paginatedPrices = computed(() => {
  const entries = Object.entries(filteredPrices.value)
  const startIndex = currentPage.value * itemsPerPage
  const endIndex = startIndex + itemsPerPage

  return Object.fromEntries(entries.slice(startIndex, endIndex))
})

// Computed properties for pagination
const totalPages = computed(() =>
  Math.ceil(Object.keys(filteredPrices.value).length / itemsPerPage)
)

const canGoNext = computed(() => currentPage.value < totalPages.value - 1)
const canGoPrev = computed(() => currentPage.value > 0)

// Reset page when filters change
watch([searchQuery, instrumentFilter], () => {
  currentPage.value = 0
})

// Helper functions
const formatPrice = (value: string | number): string =>
  isNaN(Number(value)) ? '—' : Number(value).toFixed(5)

const formatTime = (time: string): string => {
  if (!time) return '—'
  const date = new Date(time)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSecs = Math.floor(diffMs / 1000)

  if (diffSecs < 60) return `${diffSecs}s ago`
  if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)}m ago`
  return date.toLocaleTimeString()
}

const calculateSpread = (price: PriceMessage): string => {
  const ask = Number(price?.asks?.[0]?.price ?? 0)
  const bid = Number(price?.bids?.[0]?.price ?? 0)
  return formatPrice(ask - bid)
}

const calculateSpreadPips = (price: PriceMessage): string => {
  const ask = Number(price?.asks?.[0]?.price ?? 0)
  const bid = Number(price?.bids?.[0]?.price ?? 0)
  const spread = ask - bid

  // For JPY pairs, pips are in the 2nd decimal place, for others it's the 4th
  const isJpyPair = price.instrument?.includes('JPY')
  const pipMultiplier = isJpyPair ? 100 : 10000
  const pips = spread * pipMultiplier

  return pips.toFixed(1)
}

const getPriceChange = (price: PriceMessage, pair: string): string => {
  const current = Number(price?.bids?.[0]?.price ?? 0)
  const previous = previousPrices.value[pair]

  if (previous === undefined) return '—'

  const change = current - previous
  const changePercent = (change / previous) * 100

  if (change > 0) return `+${change.toFixed(5)} (+${changePercent.toFixed(2)}%)`
  if (change < 0) return `${change.toFixed(5)} (${changePercent.toFixed(2)}%)`
  return '0.00000 (0.00%)'
}

const getFlag = (currency: string): string => {
  const flags: Record<string, string> = {
    // Major currencies
    USD: '🇺🇸', // United States Dollar
    EUR: '🇪🇺', // Euro
    GBP: '🇬🇧', // British Pound
    JPY: '🇯🇵', // Japanese Yen
    AUD: '🇦🇺', // Australian Dollar
    CAD: '🇨🇦', // Canadian Dollar
    CHF: '🇨🇭', // Swiss Franc
    NZD: '🇳🇿', // New Zealand Dollar

    // Major emerging market currencies
    CNY: '🇨🇳', // Chinese Yuan
    CNH: '🇨🇳', // Chinese Yuan (Offshore)
    HKD: '🇭🇰', // Hong Kong Dollar
    SGD: '🇸🇬', // Singapore Dollar

    // European currencies
    NOK: '🇳🇴', // Norwegian Krone
    SEK: '�🇪', // Swedish Krona
    DKK: '🇩🇰', // Danish Krone
    PLN: '🇵🇱', // Polish Zloty
    CZK: '🇨🇿', // Czech Koruna
    HUF: '🇭�🇺', // Hungarian Forint

    // Other major currencies
    KRW: '🇰🇷', // South Korean Won
    INR: '🇮🇳', // Indian Rupee
    THB: '🇹🇭', // Thai Baht
    MXN: '🇲🇽', // Mexican Peso
    BRL: '🇧🇷', // Brazilian Real
    ZAR: '🇿🇦', // South African Rand
    RUB: '🇷🇺', // Russian Ruble
    TRY: '🇹🇷', // Turkish Lira

    // Middle East & Africa
    ILS: '🇮🇱', // Israeli Shekel
    SAR: '🇸🇦', // Saudi Riyal
    AED: '🇦🇪', // UAE Dirham
    EGP: '🇪🇬', // Egyptian Pound

    // Other currencies
    TWD: '🇹🇼', // Taiwan Dollar
    MYR: '🇲🇾', // Malaysian Ringgit
    IDR: '🇮🇩', // Indonesian Rupiah
    PHP: '🇵🇭', // Philippine Peso
    VND: '🇻🇳', // Vietnamese Dong
    CLP: '🇨🇱', // Chilean Peso
    COP: '🇨🇴', // Colombian Peso
    PEN: '🇵🇪', // Peruvian Sol
    ARS: '🇦🇷', // Argentine Peso

    // Commodities and special cases
    XAU: '🥇', // Gold
    XAG: '🥈', // Silver
    XPT: '⚪', // Platinum
    XPD: '⚫', // Palladium
    OIL: '🛢️', // Oil (if traded)

    // Crypto (if OANDA adds them)
    BTC: '₿',  // Bitcoin
    ETH: 'Ξ',  // Ethereum
  }
  return flags[currency] || '�' // Changed default from white flag to globe
}

const reconnect = () => {
  if (sse) {
    sse.close()
    sse = null
  }
  error.value = null
  sseStatus.value = 'connecting'
  connectSSE()
}

const setInstrumentFilter = (filter: 'all' | 'major' | 'minor' | 'exotic') => {
  instrumentFilter.value = filter
  currentPage.value = 0 // Reset to first page
  // Optionally reconnect with filtered instruments
  if (filter !== 'all') {
    reconnectWithInstruments()
  } else {
    reconnect()
  }
}

const refreshInstruments = async () => {
  await fetchInstruments()
  currentPage.value = 0 // Reset to first page
  reconnect()
}

const nextPage = () => {
  if (canGoNext.value) {
    currentPage.value++
  }
}

const prevPage = () => {
  if (canGoPrev.value) {
    currentPage.value--
  }
}

const goToPage = (page: number) => {
  if (page >= 0 && page < totalPages.value) {
    currentPage.value = page
  }
}

const reconnectWithInstruments = () => {
  if (sse) {
    sse.close()
    sse = null
  }
  error.value = null
  sseStatus.value = 'connecting'

  let instruments: string
  switch (instrumentFilter.value) {
    case 'major':
      instruments = majorPairs.value.map(i => i.name).join(',')
      break
    case 'minor':
      instruments = minorPairs.value.map(i => i.name).join(',')
      break
    case 'exotic':
      instruments = exoticPairs.value.slice(0, 10).map(i => i.name).join(',') // Limit exotics
      break
    default:
      instruments = getPopularInstruments(20)
  }

  connectSSE(instruments)
}

const connectSSE = (instruments?: string) => {
  try {
    const url = instruments ? `/api/oanda/pricing-stream?instruments=${encodeURIComponent(instruments)}` : '/api/oanda/pricing-stream'
    sse = new EventSource(url)

    sse.onopen = () => {
      sseStatus.value = 'connected'
      error.value = null
    }

    sse.onerror = () => {
      sseStatus.value = 'disconnected'
      if (!error.value) {
        error.value = 'Connection lost. Check your internet connection.'
      }
    }

    sse.onmessage = (event: MessageEvent) => {
      const raw = event.data.trim()
      try {
        const msg = JSON.parse(raw)
        if (msg.type === 'PRICE') {
          const pair = msg.instrument
          const newBid = Number(msg.bids?.[0]?.price ?? 0)

          // Store previous price for change detection
          if (prices.value[pair]) {
            previousPrices.value[pair] = Number(prices.value[pair]?.bids?.[0]?.price ?? 0)
          }

          prices.value[pair] = msg
          lastUpdate.value = new Date().toLocaleTimeString()
        }
      } catch (e) {
        console.error('JSON parse error:', raw, e)
        error.value = 'Data parsing error. Please reconnect.'
      }
    }
  } catch (e) {
    error.value = 'Failed to establish connection.'
    sseStatus.value = 'disconnected'
  }
}

onMounted(async () => {
  // Fetch available instruments first
  await fetchInstruments()
  // Then connect to pricing stream
  connectSSE()

  // Add keyboard navigation
  const handleKeydown = (event: KeyboardEvent) => {
    if (event.target && (event.target as HTMLElement).tagName === 'INPUT') return

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault()
        prevPage()
        break
      case 'ArrowRight':
        event.preventDefault()
        nextPage()
        break
      case 'Home':
        event.preventDefault()
        goToPage(0)
        break
      case 'End':
        event.preventDefault()
        goToPage(totalPages.value - 1)
        break
    }
  }

  document.addEventListener('keydown', handleKeydown)

  // Cleanup keyboard listener
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })
})

onUnmounted(() => {
  if (sse) {
    sse.close()
    sse = null
  }
})
</script>
