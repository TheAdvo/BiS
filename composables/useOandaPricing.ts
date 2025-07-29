// composables/useOandaPricing.ts
import type { PriceMessage } from '@/types/Oanda'

export const useOandaPricing = (instruments?: string[]) => {
  // Default instruments for market analysis
  const defaultInstruments = [
    'EUR_USD', 'GBP_USD', 'USD_JPY', 'AUD_USD',
    'USD_CAD', 'USD_CHF', 'NZD_USD', 'XAU_USD'
  ]

  const instrumentList = instruments || defaultInstruments
  const instrumentsQuery = instrumentList.join(',')

  // Use useAsyncData for proper caching with shorter refresh interval for pricing
  const { data: pricingData, pending, error, refresh } = useAsyncData<{ prices: PriceMessage[] }>(
    `oanda-pricing-${instrumentsQuery}`,
    async () => {
      const response = await $fetch<{ prices: PriceMessage[] }>('/api/oanda/pricing', {
        query: { instruments: instrumentsQuery }
      })
      return response
    },
    {
      // Cache for 30 seconds since pricing changes frequently
      server: false,
      default: () => ({ prices: [] })
    }
  )

  // Computed for prices array
  const prices = computed(() => pricingData.value?.prices || [])

  const fetchPricing = async () => {
    await refresh()
  }

  // Helper to get price for specific instrument
  const getPrice = (instrument: string): PriceMessage | null => {
    return prices.value.find(p => p.instrument === instrument) || null
  }

  // Helper to get current bid/ask prices
  const getCurrentPrice = (instrument: string, side: 'bid' | 'ask' | 'mid' = 'mid'): number | null => {
    const price = getPrice(instrument)
    if (!price) return null

    if (side === 'bid' && price.bids?.[0]?.price) {
      return parseFloat(price.bids[0].price)
    }
    if (side === 'ask' && price.asks?.[0]?.price) {
      return parseFloat(price.asks[0].price)
    }
    // Calculate mid price if available
    if (price.bids?.[0]?.price && price.asks?.[0]?.price) {
      const bid = parseFloat(price.bids[0].price)
      const ask = parseFloat(price.asks[0].price)
      return (bid + ask) / 2
    }
    return null
  }

  // Helper to get spread
  const getSpread = (instrument: string): number | null => {
    const price = getPrice(instrument)
    if (!price?.bids?.[0]?.price || !price?.asks?.[0]?.price) return null

    const bid = parseFloat(price.bids[0].price)
    const ask = parseFloat(price.asks[0].price)
    return ask - bid
  }

  // Helper to get spread in pips (assuming 4-decimal places for most pairs)
  const getSpreadInPips = (instrument: string): number | null => {
    const spread = getSpread(instrument)
    if (spread === null) return null

    // Most currency pairs use 4 decimal places, JPY pairs use 2
    const multiplier = instrument.includes('JPY') ? 100 : 10000
    return spread * multiplier
  }

  return {
    data: pricingData,
    prices,
    pending,
    error,
    refresh: fetchPricing,
    getPrice,
    getCurrentPrice,
    getSpread,
    getSpreadInPips
  }
}
