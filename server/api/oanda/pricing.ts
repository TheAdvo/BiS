import { oandaClient } from '~/server/utils/oandaClient'

export default defineEventHandler(async (event) => {
  try {
    // Get instruments from query parameters, default to EUR_USD
    const query = getQuery(event)
    const instruments = query.instruments
      ? (Array.isArray(query.instruments) ? query.instruments : [query.instruments])
      : ['EUR_USD']

    const data = await oandaClient.getPricing(instruments as string[]) as any
    // Return the prices array directly, or wrap in a response object
    return { prices: data.prices || data }
  } catch (error: any) {
    throw error
  }
})
