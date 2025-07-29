// server/api/oanda/candles.ts
import { oandaClient } from '~/server/utils/oandaClient'
import type { OandaCandlesResponse } from '@/types/Oanda'

export default defineEventHandler(async (event) => {
  try {
    const query = getQuery(event)
    const instrument = query.instrument as string
    const granularity = (query.granularity as string) || 'M5'
    const count = parseInt(query.count as string) || 100

    if (!instrument) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Instrument parameter is required'
      })
    }

    const data = await oandaClient.getCandles(instrument, granularity, count) as OandaCandlesResponse
    return data
  } catch (error: any) {
    console.error('OANDA Candles API Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to fetch candle data'
    })
  }
})
