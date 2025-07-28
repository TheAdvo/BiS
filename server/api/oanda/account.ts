import { oandaClient } from '~/server/utils/oandaClient'

export default defineEventHandler(async () => {
  try {
    const accountData = await oandaClient.getAccount() as any
    return {
      ...accountData.account,
      accountID: process.env.OANDA_ACCOUNT_ID
    }
  } catch (error: any) {
    // Error handling is already done in the client
    throw error
  }
})
