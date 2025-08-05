import { oandaClient } from '~/server/utils/oandaClient'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { instrument, units, type, takeProfit, stopLoss } = body
    if (!instrument || !units || !type) {
      throw createError({ statusCode: 400, statusMessage: 'Missing required order fields' })
    }

    // Build OANDA order request
    const order: any = {
      instrument,
      units,
      type: type.toUpperCase() // e.g., 'MARKET'
    }
    // Attach TP/SL if provided (assume pips, convert to price if needed by oandaClient)
    if (takeProfit && takeProfit > 0) order.takeProfit = takeProfit
    if (stopLoss && stopLoss > 0) order.stopLoss = stopLoss

    // Place order via oandaClient (implement this to handle TP/SL)
    const result = await oandaClient.placeOrder(order)
    return { success: true, result }
  } catch (error: any) {
    return { success: false, error: error?.message || error }
  }
})
