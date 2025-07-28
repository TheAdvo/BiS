import { oandaClient } from '~/server/utils/oandaClient'

export default defineEventHandler(async () => {
  try {
    const positionsData = await oandaClient.getPositions() as any
    return {
      positions: positionsData.positions || [],
      lastTransactionID: positionsData.lastTransactionID
    }
  } catch (error: any) {
    // Error handling is already done in the client
    throw error
  }
})
