// composables/useOandaInstruments.ts
import type { OandaInstrument } from '@/types/Oanda'

export const useOandaInstruments = () => {
  const instruments = ref<OandaInstrument[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchInstruments = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<{ instruments: OandaInstrument[], count: number }>('/api/oanda/instruments')
      instruments.value = response.instruments
    } catch (err) {
      console.error('Error fetching instruments:', err)
      error.value = 'Failed to load currency pairs'
    } finally {
      loading.value = false
    }
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
    fetchInstruments,
    getInstrumentNames,
    getPopularInstruments,
    getMajorPairs,
    getMinorPairs,
    getExoticPairs
  }
}
