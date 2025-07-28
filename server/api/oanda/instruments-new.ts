// server/api/oanda/instruments.ts
import { oandaClient } from '~/server/utils/oandaClient'
import type { OandaInstrumentsResponse } from '@/types/Oanda'

export default defineEventHandler(async (event) => {
  try {
    const data: OandaInstrumentsResponse = await oandaClient.getInstruments() as any

    // Filter to only include CURRENCY instruments (excludes CFDs, metals, etc.)
    const currencies = data.instruments.filter(instrument =>
      instrument.type === 'CURRENCY' &&
      instrument.name.includes('_')
    )

    // Sort by popularity (major pairs first)
    const majorPairs = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'AUD_USD', 'USD_CAD', 'USD_CHF', 'NZD_USD']
    const sorted = currencies.sort((a, b) => {
      const aIndex = majorPairs.indexOf(a.name)
      const bIndex = majorPairs.indexOf(b.name)

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
      if (aIndex !== -1) return -1
      if (bIndex !== -1) return 1
      return a.name.localeCompare(b.name)
    })

    return {
      instruments: sorted,
      count: sorted.length
    }
  } catch (error: any) {
    throw error
  }
})
