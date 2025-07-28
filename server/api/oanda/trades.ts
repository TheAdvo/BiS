import { oandaClient } from '~/server/utils/oandaClient'

export default defineEventHandler(async () => {
  try {
    const tradesData = await oandaClient.getTrades() as any
    return {
      trades: tradesData.trades || [],
      lastTransactionID: tradesData.lastTransactionID
    }
  } catch (error: any) {
    // Error handling is already done in the client
    throw error
  }
})
