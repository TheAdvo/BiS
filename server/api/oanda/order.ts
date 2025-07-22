import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const apiKey = process.env.OANDA_API_KEY!
  const accountId = process.env.OANDA_ACCOUNT_ID!
  const body = await readBody(event)

  try {
    const response = await fetch(`https://api-fxpractice.oanda.com/v3/accounts/${accountId}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()

    if (!response.ok) {
      event.node.res.statusCode = response.status
      return data
    }

    return data
  } catch (error) {
    console.error('OANDA order error:', error)
    event.node.res.statusCode = 500
    return { error: 'Failed to place order' }
  }
})
