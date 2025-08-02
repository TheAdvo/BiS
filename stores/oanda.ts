// stores/oanda.ts - Centralized OANDA data management (Pinia version)
import { defineStore } from 'pinia'
import type { OandaAccount, OandaTradesResponse, OandaPositionsResponse, PriceMessage, OandaCandlesResponse } from '@/types/Oanda'

export const useOandaStore = defineStore('oanda', {
  state: () => ({
    // ---[ Account data and loading/error state ]---
    account: null as OandaAccount | null,
    accountLoading: false,
    accountError: null as any,

    // ---[ Trades data and loading/error state ]---
    trades: null as OandaTradesResponse | null,
    tradesLoading: false,
    tradesError: null as any,

    // ---[ Positions data and loading/error state ]---
    positions: null as OandaPositionsResponse | null,
    positionsLoading: false,
    positionsError: null as any,

    // ---[ Pricing data cache: instrument prices ]---
    pricingCache: new Map<string, { data: { prices: PriceMessage[] }, timestamp: number }>(),

    // ---[ Candles data cache: historical candles ]---
    candlesCache: new Map<string, { data: OandaCandlesResponse, timestamp: number }>(),

    // ---[ Last refresh timestamps for cache validation ]---
    lastAccountRefresh: 0,
    lastTradesRefresh: 0,
    lastPositionsRefresh: 0,

    // ---[ Global loading state for refresh operations ]---
    isRefreshing: false
  }),
  getters: {
    // ---[ Account, trades, positions getters (renamed to avoid conflicts) ]---
    getAccount: (state) => state.account,
    getTrades: (state) => state.trades,
    getPositions: (state) => state.positions,

    // ---[ Loading state getters ]---
    getIsAccountLoading: (state) => state.accountLoading,
    getIsTradesLoading: (state) => state.tradesLoading,
    getIsPositionsLoading: (state) => state.positionsLoading,
    getIsRefreshing: (state) => state.isRefreshing,

    // ---[ Error state getters ]---
    getAccountError: (state) => state.accountError,
    getTradesError: (state) => state.tradesError,
    getPositionsError: (state) => state.positionsError,
  },
  actions: {
    // Cache TTL configurations (in milliseconds)
    // ---[ Caching configuration for each data type ]---
    CACHE_TTL: {
      account: 30000,   // 30 seconds
      trades: 15000,    // 15 seconds
      positions: 15000, // 15 seconds
      pricing: 5000,    // 5 seconds
      candles: 60000    // 60 seconds
    },

    // Helper to check if data is fresh
    // ---[ Utility: Checks if cached data is still valid ]---
    isDataFresh(lastRefresh: number, ttl: number) {
      return Date.now() - lastRefresh < ttl
    },

    // Refresh account data with caching
    // ---[ Account: Fetches and caches account data ]---
    async refreshAccount(force = false) {
      if (!force && this.isDataFresh(this.lastAccountRefresh, this.CACHE_TTL.account)) {
        return this.account
      }
      if (this.accountLoading) return this.account
      try {
        this.accountLoading = true
        this.accountError = null
        const data = await $fetch<OandaAccount>('/api/oanda/account')
        this.account = data
        this.lastAccountRefresh = Date.now()
        return data
      } catch (error) {
        this.accountError = error
        throw error
      } finally {
        this.accountLoading = false
      }
    },

    // Refresh trades data with caching
    // ---[ Trades: Fetches and caches trades data ]---
    async refreshTrades(force = false) {
      if (!force && this.isDataFresh(this.lastTradesRefresh, this.CACHE_TTL.trades)) {
        return this.trades
      }
      if (this.tradesLoading) return this.trades
      try {
        this.tradesLoading = true
        this.tradesError = null
        const data = await $fetch<OandaTradesResponse>('/api/oanda/trades')
        this.trades = data
        this.lastTradesRefresh = Date.now()
        return data
      } catch (error) {
        this.tradesError = error
        throw error
      } finally {
        this.tradesLoading = false
      }
    },

    // ---[ Positions: Fetches and caches positions data ]---
    // This action retrieves the latest positions from the OANDA API, using cache validation to avoid unnecessary requests.
    async refreshPositions(force = false) {
      if (!force && this.isDataFresh(this.lastPositionsRefresh, this.CACHE_TTL.positions)) {
        return this.positions
      }
      if (this.positionsLoading) return this.positions
      try {
        this.positionsLoading = true
        this.positionsError = null
        const data = await $fetch<OandaPositionsResponse>('/api/oanda/positions')
        this.positions = data
        this.lastPositionsRefresh = Date.now()
        return data
      } catch (error) {
        this.positionsError = error
        throw error
      } finally {
        this.positionsLoading = false
      }
    },

    // ---[ Pricing: Fetches and caches pricing data for instruments ]---
    // This action retrieves current pricing for the specified instruments from the OANDA API, using cache validation for efficiency.
    async getPricingData(instruments: string, force = false) {
      const cacheKey = instruments
      const cached = this.pricingCache.get(cacheKey)
      if (!force && cached && this.isDataFresh(cached.timestamp, this.CACHE_TTL.pricing)) {
        return cached.data
      }
      try {
        const data = await $fetch<{ prices: PriceMessage[] }>('/api/oanda/pricing', {
          query: { instruments }
        })
        this.pricingCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        })
        return data
      } catch (error) {
        console.error('Error fetching pricing data:', error)
        throw error
      }
    },

    // Get candles data with caching
    // ---[ Candles: Fetches and caches historical candle data ]---
    async getCandlesData(instrument: string, granularity: string, count: number, force = false) {
      const cacheKey = `${instrument}-${granularity}-${count}`
      const cached = this.candlesCache.get(cacheKey)
      if (!force && cached && this.isDataFresh(cached.timestamp, this.CACHE_TTL.candles)) {
        return cached.data
      }
      try {
        const data = await $fetch<OandaCandlesResponse>('/api/oanda/candles', {
          query: { instrument, granularity, count }
        })
        this.candlesCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        })
        return data
      } catch (error) {
        console.error('Error fetching candles data:', error)
        throw error
      }
    },

    // Refresh all core data (account, trades, positions)
    // ---[ Utility: Refreshes all major OANDA data types in parallel ]---
    async refreshAll(force = false) {
      if (this.isRefreshing && !force) return
      try {
        this.isRefreshing = true
        await Promise.all([
          this.refreshAccount(force),
          this.refreshTrades(force),
          this.refreshPositions(force)
        ])
      } finally {
        this.isRefreshing = false
      }
    },

    // Clear all caches
    // ---[ Utility: Clears all cached data and resets refresh timers ]---
    clearCache() {
      this.pricingCache.clear()
      this.candlesCache.clear()
      this.lastAccountRefresh = 0
      this.lastTradesRefresh = 0
      this.lastPositionsRefresh = 0
    }
  }
})
