// server/tasks/trade-automation.ts
import { maCrossoverStrategy } from '../utils/trade'
import { addLog } from '../utils/logs'

const instrument = 'EUR_USD'
const shortPeriod = 20
const longPeriod = 50
const units = 1000
let isRunning = false

async function getCandles() {
  const response = await fetch(`http://localhost:3000/api/oanda/candles?instrument=${instrument}&granularity=M1&count=${longPeriod + 2}`)
  if (!response.ok) {
    throw new Error('Failed to fetch candles')
  }
  return response.json()
}

async function placeOrder(side: 'BUY' | 'SELL') {
  const response = await fetch('http://localhost:3000/api/oanda/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      order: {
        instrument,
        units: (side === 'BUY' ? 1 : -1) * units,
        type: 'MARKET',
        timeInForce: 'FOK',
      },
    }),
  })
  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Failed to place order: ${error.errorMessage || response.statusText}`)
  }
  return response.json()
}

async function runStrategy() {
  try {
    const candles = await getCandles()
    const signal = maCrossoverStrategy(candles, shortPeriod, longPeriod)

    if (signal) {
      addLog(`Signal detected: ${signal}. Placing order...`)
      await placeOrder(signal)
      addLog('Order placed successfully.')
    } else {
      addLog('No signal detected.')
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    addLog(`Error during trade automation cycle: ${errorMessage}`)
  }
}

if (!isRunning) {
  isRunning = true
  addLog('Trade automation service starting...')
  setInterval(runStrategy, 60 * 1000)
}

