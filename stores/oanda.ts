// stores/oanda.ts - Centralized OANDA data management
import type { OandaAccount, OandaTradesResponse, OandaPositionsResponse, PriceMessage, OandaCandlesResponse } from '@/types/Oanda'

interface OandaStore {
  // Account data
  account: OandaAccount | null
  accountLoading: boolean
  accountError: any

  // Trades data
  trades: OandaTradesResponse | null
  tradesLoading: boolean
  tradesError: any

  // Positions data
  positions: OandaPositionsResponse | null
  positionsLoading: boolean
  positionsError: any

  // Pricing data cache
  pricingCache: Map<string, { data: { prices: PriceMessage[] }, timestamp: number }>

  // Candles data cache
  candlesCache: Map<string, { data: OandaCandlesResponse, timestamp: number }>

  // Last refresh timestamps
  lastAccountRefresh: number
  lastTradesRefresh: number
  lastPositionsRefresh: number

  // Loading states
  isRefreshing: boolean
}

export const useOandaStore = () => {
  const store = useState<OandaStore>('oanda-store', () => ({
    account: null,
    accountLoading: false,
    accountError: null,

    trades: null,
    tradesLoading: false,
    tradesError: null,

    positions: null,
    positionsLoading: false,
    positionsError: null,

    pricingCache: new Map(),
    candlesCache: new Map(),

    lastAccountRefresh: 0,
    lastTradesRefresh: 0,
    lastPositionsRefresh: 0,

    isRefreshing: false
  }))

  // Cache TTL configurations (in milliseconds)
  const CACHE_TTL = {
    account: 30000,   // 30 seconds
    trades: 15000,    // 15 seconds
    positions: 15000, // 15 seconds
    pricing: 5000,    // 5 seconds
    candles: 60000    // 60 seconds
  }

  // Helper to check if data is fresh
  const isDataFresh = (lastRefresh: number, ttl: number) => {
    return Date.now() - lastRefresh < ttl
  }

  // Refresh account data with caching
  const refreshAccount = async (force = false) => {
    if (!force && isDataFresh(store.value.lastAccountRefresh, CACHE_TTL.account)) {
      return store.value.account
    }

    if (store.value.accountLoading) return store.value.account

    try {
      store.value.accountLoading = true
      store.value.accountError = null

      const data = await $fetch<OandaAccount>('/api/oanda/account')
      store.value.account = data
      store.value.lastAccountRefresh = Date.now()

      return data
    } catch (error) {
      store.value.accountError = error
      throw error
    } finally {
      store.value.accountLoading = false
    }
  }

  // Refresh trades data with caching
  const refreshTrades = async (force = false) => {
    if (!force && isDataFresh(store.value.lastTradesRefresh, CACHE_TTL.trades)) {
      return store.value.trades
    }

    if (store.value.tradesLoading) return store.value.trades

    try {
      store.value.tradesLoading = true
      store.value.tradesError = null

      const data = await $fetch<OandaTradesResponse>('/api/oanda/trades')
      store.value.trades = data
      store.value.lastTradesRefresh = Date.now()

      return data
    } catch (error) {
      store.value.tradesError = error
      throw error
    } finally {
      store.value.tradesLoading = false
    }
  }

  // Refresh positions data with caching
  const refreshPositions = async (force = false) => {
    if (!force && isDataFresh(store.value.lastPositionsRefresh, CACHE_TTL.positions)) {
      return store.value.positions
    }

    if (store.value.positionsLoading) return store.value.positions

    try {
      store.value.positionsLoading = true
      store.value.positionsError = null

      const data = await $fetch<OandaPositionsResponse>('/api/oanda/positions')
      store.value.positions = data
      store.value.lastPositionsRefresh = Date.now()

      return data
    } catch (error) {
      store.value.positionsError = error
      throw error
    } finally {
      store.value.positionsLoading = false
    }
  }

  // Get pricing data with caching
  const getPricingData = async (instruments: string, force = false) => {
    const cacheKey = instruments
    const cached = store.value.pricingCache.get(cacheKey)

    if (!force && cached && isDataFresh(cached.timestamp, CACHE_TTL.pricing)) {
      return cached.data
    }

    try {
      const data = await $fetch<{ prices: PriceMessage[] }>('/api/oanda/pricing', {
        query: { instruments }
      })

      store.value.pricingCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      })

      return data
    } catch (error) {
      console.error('Error fetching pricing data:', error)
      throw error
    }
  }

  // Get candles data with caching
  const getCandlesData = async (instrument: string, granularity: string, count: number, force = false) => {
    const cacheKey = `${instrument}-${granularity}-${count}`
    const cached = store.value.candlesCache.get(cacheKey)

    if (!force && cached && isDataFresh(cached.timestamp, CACHE_TTL.candles)) {
      return cached.data
    }

    try {
      const data = await $fetch<OandaCandlesResponse>('/api/oanda/candles', {
        query: { instrument, granularity, count }
      })

      store.value.candlesCache.set(cacheKey, {
        data,
        timestamp: Date.now()
      })

      return data
    } catch (error) {
      console.error('Error fetching candles data:', error)
      throw error
    }
  }

  // Refresh all core data (account, trades, positions)
  const refreshAll = async (force = false) => {
    if (store.value.isRefreshing && !force) return

    try {
      store.value.isRefreshing = true

      await Promise.all([
        refreshAccount(force),
        refreshTrades(force),
        refreshPositions(force)
      ])
    } finally {
      store.value.isRefreshing = false
    }
  }

  // Clear all caches
  const clearCache = () => {
    store.value.pricingCache.clear()
    store.value.candlesCache.clear()
    store.value.lastAccountRefresh = 0
    store.value.lastTradesRefresh = 0
    store.value.lastPositionsRefresh = 0
  }

  return {
    // State
    store: readonly(store),

    // Computed getters
    account: computed(() => store.value.account),
    trades: computed(() => store.value.trades),
    positions: computed(() => store.value.positions),

    isAccountLoading: computed(() => store.value.accountLoading),
    isTradesLoading: computed(() => store.value.tradesLoading),
    isPositionsLoading: computed(() => store.value.positionsLoading),
    isRefreshing: computed(() => store.value.isRefreshing),

    accountError: computed(() => store.value.accountError),
    tradesError: computed(() => store.value.tradesError),
    positionsError: computed(() => store.value.positionsError),

    // Actions
    refreshAccount,
    refreshTrades,
    refreshPositions,
    refreshAll,
    getPricingData,
    getCandlesData,
    clearCache
  }
}
