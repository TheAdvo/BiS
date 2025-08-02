
// OANDA Price Streaming SSE Endpoint
// This endpoint connects to OANDA's streaming pricing API using Node's https module.
// It authenticates using credentials from .env and streams real-time price updates as Server-Sent Events (SSE).
// Compatible with Nuxt 3 server API routes.
//
// Environment variables required in .env:
//   OANDA_API_KEY - Your OANDA API key
//   OANDA_ACCOUNT_ID - Your OANDA account ID
//   OANDA_STREAM_API_URL - Base URL for OANDA streaming (e.g. https://stream-fxpractice.oanda.com/v3)
//
// Usage:
//   GET /api/oanda/price-stream?instruments=EUR_USD,GBP_USD
//   Response: SSE stream of price updates for specified instruments

import { defineEventHandler, getQuery } from 'h3'
import https from 'https'

// Main handler for price streaming
export default defineEventHandler(async (event) => {


  // 1. Parse instruments from query string, fallback to EUR_USD
  const query = getQuery(event)
  const instrumentsParam = query.instruments as string | undefined
  const instruments = instrumentsParam
    ? instrumentsParam.split(',').map(i => i.trim()).filter(Boolean)
    : ['EUR_USD']

  // 2. Instrument validation (basic regex for OANDA format)
  // Only allow uppercase letters, numbers, and underscores, e.g. EUR_USD
  const validInstrument = /^[A-Z0-9_]+$/
  const invalidInstruments = instruments.filter(i => !validInstrument.test(i))
  if (invalidInstruments.length > 0) {
    event.res.writeHead(400, { 'Content-Type': 'application/json' })
    event.res.end(JSON.stringify({ error: `Invalid instrument(s): ${invalidInstruments.join(', ')}` }))
    return
  }



  // 3. Load credentials and streaming base URL from environment
  const apiKey = process.env.OANDA_API_KEY
  const accountId = process.env.OANDA_ACCOUNT_ID
  const streamBaseUrl = process.env.OANDA_STREAM_API_URL || 'https://stream-fxpractice.oanda.com/v3'



  // 4. Return 401 if credentials are missing
  if (!apiKey || !accountId) {
    event.res.writeHead(401, { 'Content-Type': 'application/json' })
    event.res.end(JSON.stringify({ error: 'Missing OANDA credentials' }))
    return
  }



  // 5. Set SSE headers for streaming response
  event.res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  // 6. Heartbeat: Send a comment every 20 seconds to keep connection alive
  const heartbeatInterval = setInterval(() => {
    if (!event.res.writableEnded) {
      event.res.write(': heartbeat\n\n') // SSE comment event
    }
  }, 20000)



  // 7. Build OANDA streaming URL and request options
  const streamUrl = `${streamBaseUrl}/accounts/${accountId}/pricing/stream?instruments=${instruments.join(',')}`
  const options = {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Accept-Datetime-Format': 'RFC3339',
      'User-Agent': 'Nuxt-OANDA-SSE'
    }
  }



  // 8. Connect to OANDA price stream and forward PRICE events as SSE
  //    Add logging for connection status and errors
  const req = https.get(streamUrl, options, (res) => {
    res.setEncoding('utf8')
    let buffer = ''
    // Log connection status
    event.res.write(`event: status\ndata: ${JSON.stringify({ status: 'connected', instruments })}\n\n`)
    res.on('data', (chunk) => {
      buffer += chunk
      let lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (line.trim()) {
          try {
            const data = JSON.parse(line)
            // Only forward PRICE events as SSE
            if (data.type === 'PRICE') {
              event.res.write(`data: ${JSON.stringify(data)}\n\n`)
            }
            // Log heartbeat from OANDA (if any)
            if (data.type === 'HEARTBEAT') {
              event.res.write(`event: heartbeat\ndata: ${JSON.stringify(data)}\n\n`)
            }
          } catch (err) {
            // Log parse errors as SSE error events
            // TypeScript: 'err' is unknown, so cast to Error
            const errorMsg = (err instanceof Error) ? err.message : String(err)
            event.res.write(`event: error\ndata: ${JSON.stringify({ error: 'Parse error', details: errorMsg, line })}\n\n`)
          }
        }
      }
    })
    res.on('end', () => {
      event.res.write(`event: status\ndata: ${JSON.stringify({ status: 'stream ended' })}\n\n`)
      event.res.end()
    })
  })



  // 9. Handle connection errors and forward as SSE error events
  req.on('error', (err) => {
    event.res.write(`event: error\ndata: ${JSON.stringify({ error: err.message })}\n\n`)
    event.res.end()
  })



  // 10. Clean up connection if client closes SSE stream
  //     Also clear heartbeat interval
  const cleanup = () => {
    if (!req.destroyed) req.destroy()
    if (!event.res.writableEnded) event.res.end()
    clearInterval(heartbeatInterval)
  }
  event.res.on('close', cleanup)
  event.res.on('finish', cleanup)
})
