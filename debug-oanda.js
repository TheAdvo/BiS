// Debug script to test OANDA environment variables and connection
import dotenv from 'dotenv'
dotenv.config()
console.log('Environment Variables:')
console.log('OANDA_API_KEY:', process.env.OANDA_API_KEY ? 'SET' : 'MISSING')
console.log('OANDA_ACCOUNT_ID:', process.env.OANDA_ACCOUNT_ID ? 'SET' : 'MISSING')
console.log('OANDA_API_URL:', process.env.OANDA_API_URL || 'DEFAULT (https://api-fxpractice.oanda.com/v3)')

// Test basic fetch to OANDA
async function testOanda() {
  const apiKey = process.env.OANDA_API_KEY
  const accountId = process.env.OANDA_ACCOUNT_ID
  const apiUrl = process.env.OANDA_API_URL || 'https://api-fxpractice.oanda.com/v3'

  if (!apiKey || !accountId) {
    console.error('Missing required environment variables')
    return
  }

  const url = `${apiUrl}/accounts/${accountId}`
  console.log('Testing URL:', url)

  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('Response Status:', response.status)
    console.log('Response StatusText:', response.statusText)
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()))

    if (response.ok) {
      const data = await response.json()
      console.log('Response Data Keys:', Object.keys(data))
    } else {
      const errorText = await response.text()
      console.log('Error Response:', errorText)
    }
  } catch (error) {
    console.error('Fetch Error:', error.message)
  }
}

testOanda()
