// composables/useOandaInstruments.ts
import type { OandaInstrument } from '@/types/Oanda'

export const useOandaInstruments = () => {
  // Use useAsyncData for proper caching (instruments rarely change)
  const { data: instrumentsData, pending: loading, error, refresh } = useAsyncData<{ instruments: OandaInstrument[], count: number }>('oanda-instruments', async () => {
    const response = await $fetch<{ instruments: OandaInstrument[], count: number }>('/api/oanda/instruments')
    return response
  }, {
    // Cache for 1 hour since instruments rarely change
    server: true,
    default: () => ({ instruments: [], count: 0 })
  })

  // Computed for instruments array
  const instruments = computed(() => instrumentsData.value?.instruments || [])

  const fetchInstruments = async () => {
    await refresh()
  }

  // Get instruments formatted for the pricing stream
  const getInstrumentNames = (): string => {
    return instruments.value.map(i => i.name).join(',')
  }

  // Get popular instruments (limit for performance)
  const getPopularInstruments = (limit: number = 20): string => {
    return instruments.value.slice(0, limit).map(i => i.name).join(',')
  }

  // Filter instruments by type or criteria
  const getMajorPairs = (): OandaInstrument[] => {
    const majors = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'AUD_USD', 'USD_CAD', 'USD_CHF', 'NZD_USD']
    return instruments.value.filter(i => majors.includes(i.name))
  }

  const getMinorPairs = (): OandaInstrument[] => {
    const majors = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'AUD_USD', 'USD_CAD', 'USD_CHF', 'NZD_USD']
    const minors = ['EUR_GBP', 'EUR_JPY', 'GBP_JPY', 'AUD_JPY', 'CHF_JPY', 'EUR_CHF', 'GBP_CHF']
    return instruments.value.filter(i => minors.includes(i.name))
  }

  const getExoticPairs = (): OandaInstrument[] => {
    const majors = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'AUD_USD', 'USD_CAD', 'USD_CHF', 'NZD_USD']
    const minors = ['EUR_GBP', 'EUR_JPY', 'GBP_JPY', 'AUD_JPY', 'CHF_JPY', 'EUR_CHF', 'GBP_CHF']
    return instruments.value.filter(i => !majors.includes(i.name) && !minors.includes(i.name))
  }

  return {
    instruments: readonly(instruments),
    loading: readonly(loading),
    error: readonly(error),
    refresh,
    fetchInstruments,
    getInstrumentNames,
    getPopularInstruments,
    getMajorPairs,
    getMinorPairs,
    getExoticPairs
  }
}
