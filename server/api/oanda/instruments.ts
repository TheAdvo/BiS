// server/api/oanda/instruments.ts
import { defineEventHandler } from 'h3'
import type { OandaInstrumentsResponse } from '@/types/Oanda'

export default defineEventHandler(async (event) => {
  const apiKey = process.env.OANDA_API_KEY
  const accountId = process.env.OANDA_ACCOUNT_ID

  if (!apiKey || !accountId) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Missing OANDA API credentials'
    })
  }

  try {
    const response = await fetch(`https://api-fxpractice.oanda.com/v3/accounts/${accountId}/instruments`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw createError({
        statusCode: response.status,
        statusMessage: `OANDA API error: ${response.statusText}`
      })
    }

    const data: OandaInstrumentsResponse = await response.json()

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

  } catch (error) {
    console.error('Error fetching instruments:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch instruments from OANDA'
    })
  }
})
