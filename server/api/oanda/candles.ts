// server/api/oanda/candles.ts
import { defineEventHandler, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  const apiKey = process.env.OANDA_API_KEY!
  const { instrument, granularity = 'M1', count = 100 } = getQuery(event)

  if (!instrument) {
    event.node.res.statusCode = 400
    return { error: 'Instrument parameter is required' }
  }

  const url = `https://api-fxpractice.oanda.com/v3/instruments/${instrument}/candles?granularity=${granularity}&count=${count}`

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()

    if (!response.ok) {
      event.node.res.statusCode = response.status
      return data
    }

    return data.candles.map((c: any) => ({
      time: c.time,
      open: parseFloat(c.mid.o),
      high: parseFloat(c.mid.h),
      low: parseFloat(c.mid.l),
      close: parseFloat(c.mid.c),
      volume: c.volume,
    }))
  } catch (error) {
    console.error('OANDA candles error:', error)
    event.node.res.statusCode = 500
    return { error: 'Failed to fetch candlestick data' }
  }
})
