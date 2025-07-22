// server/api/oanda/pricing-stream.ts
import { defineEventHandler } from 'h3'
import https from 'https'

export default defineEventHandler((event) => {
  const apiKey = process.env.OANDA_API_KEY!
  const accountId = process.env.OANDA_ACCOUNT_ID!
  const instruments = 'EUR_USD,USD_JPY'

  event.node.res.setHeader('Content-Type', 'text/event-stream')
  event.node.res.setHeader('Cache-Control', 'no-cache')
  event.node.res.setHeader('Connection', 'keep-alive')
  event.node.res.flushHeaders?.()

  const req = https.request({
    hostname: 'stream-fxpractice.oanda.com',
    path: `/v3/accounts/${accountId}/pricing/stream?instruments=${instruments}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  }, (res) => {
    res.setEncoding('utf8')
    res.on('data', (chunk) => {
      const lines = chunk.trim().split('\n')
      for (const line of lines) {
        if (!line) continue
        event.node.res.write(`data: ${line}\n\n`)
      }
    })
  })

  req.on('error', (err) => {
    console.error('OANDA stream error:', err)
    event.node.res.end()
  })

  req.end()
})
