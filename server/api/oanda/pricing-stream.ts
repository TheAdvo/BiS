// server/api/oanda/pricing-stream.ts
import { defineEventHandler } from 'h3'
import https from 'https'
import { createServerLogger } from '~/server/utils/logger'

const logger = createServerLogger('pricing-stream')

export default defineEventHandler(async (event) => {
  const apiKey = process.env.OANDA_API_KEY!
  const accountId = process.env.OANDA_ACCOUNT_ID!
  const url = new URL(event.node.req.url!, 'http://localhost')

  // Get instruments from query params, or fetch popular ones dynamically
  let instruments = url.searchParams.get('instruments')

  if (!instruments) {
    // If no instruments specified, fetch popular pairs dynamically
    try {
      const response = await fetch(`https://api-fxpractice.oanda.com/v3/accounts/${accountId}/instruments`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const currencies = data.instruments.filter((instrument: any) =>
          instrument.type === 'CURRENCY' && instrument.name.includes('_')
        )

        // Use top 20 popular pairs for performance
        const majorPairs = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'AUD_USD', 'USD_CAD', 'USD_CHF', 'NZD_USD']
        const sorted = currencies.sort((a: any, b: any) => {
          const aIndex = majorPairs.indexOf(a.name)
          const bIndex = majorPairs.indexOf(b.name)
          if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex
          if (aIndex !== -1) return -1
          if (bIndex !== -1) return 1
          return a.name.localeCompare(b.name)
        })

        instruments = sorted.slice(0, 20).map((i: any) => i.name).join(',')
      } else {
        // Fallback to popular pairs if API fails
        instruments = 'EUR_USD,GBP_USD,USD_JPY,AUD_USD,USD_CAD,USD_CHF,NZD_USD,EUR_GBP,EUR_JPY,GBP_JPY'
      }
    } catch (error) {
      console.error('Error fetching instruments for stream:', error)
      // Fallback to popular pairs
      instruments = 'EUR_USD,GBP_USD,USD_JPY,AUD_USD,USD_CAD,USD_CHF,NZD_USD,EUR_GBP,EUR_JPY,GBP_JPY'
    }
  }

  event.node.res.setHeader('Content-Type', 'text/event-stream')
  event.node.res.setHeader('Cache-Control', 'no-cache')
  event.node.res.setHeader('Connection', 'keep-alive')
  event.node.res.flushHeaders?.()

  if (!apiKey || !accountId) {
    event.node.res.write(`data: {"error":"Missing OANDA credentials"}\n\n`)
    event.node.res.end()
    return
  }

  const req = https.request({
    hostname: 'stream-fxpractice.oanda.com',
    path: `/v3/accounts/${accountId}/pricing/stream?instruments=${instruments}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  }, (res) => {
    res.setEncoding('utf8')
    let buffer = '' // Buffer for incomplete lines

    res.on('data', (chunk) => {
      buffer += chunk
      const lines = buffer.split('\n')

      // Keep the last line in buffer if it's incomplete
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine) continue
        if (trimmedLine.includes('"type":"HEARTBEAT"')) continue // Skip heartbeats

        // Validate JSON before sending
        try {
          JSON.parse(trimmedLine)
          event.node.res.write(`data: ${trimmedLine}\n\n`)
        } catch (e) {
          logger.warn('Skipping invalid JSON', trimmedLine.substring(0, 100) + '...')
        }
      }
    })

    res.on('end', () => {
      // Process any remaining data in buffer
      if (buffer.trim()) {
        try {
          JSON.parse(buffer.trim())
          event.node.res.write(`data: ${buffer.trim()}\n\n`)
        } catch (e) {
          logger.warn('Skipping final invalid JSON', buffer.trim())
        }
      }
      event.node.res.end()
    })
  })

  req.on('error', (err) => {
    console.error('OANDA stream error:', err)
    event.node.res.write(`data: {"error":"OANDA stream error"}\n\n`)
    event.node.res.end()
  })

  // Handle client disconnect
  event.node.req.on('close', () => {
    req.destroy()
    event.node.res.end()
  })

  req.end()
})
