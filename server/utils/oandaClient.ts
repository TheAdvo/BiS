// server/utils/oandaClient.ts
import { serverCache } from './cache'
import { createServerLogger } from './logger'

interface OandaConfig {
  apiKey: string
  accountId: string
  apiUrl: string
}

interface OandaApiOptions {
  cache?: boolean
  cacheTTL?: number
  retries?: number
  timeout?: number
}

class OandaApiClient {
  /**
   * Place a market order with optional take profit and stop loss (in pips)
   * @param order { instrument, units, type, takeProfit?, stopLoss? }
   * @returns OANDA API order response
   */
  async placeOrder(order: { instrument: string; units: number; type: string; takeProfit?: number; stopLoss?: number }) {
    // Fetch current price for TP/SL calculation if needed
    // OANDA expects TP/SL as price, not pips, so we must convert
    let tpPrice, slPrice
    if (order.takeProfit || order.stopLoss) {
      // Get current price for instrument
      const pricing: any = await this.getPricing([order.instrument])
      const pricesArr = Array.isArray(pricing?.prices) ? pricing.prices : []
      const priceObj = pricesArr[0] || {}
      const current = priceObj.closeoutAsk || (priceObj.asks && priceObj.asks[0]?.price) || (priceObj.bids && priceObj.bids[0]?.price)
      const currentPrice = parseFloat(current)
      // Determine pip size (e.g., 0.0001 for EUR/USD)
      const pip = order.instrument.includes('JPY') ? 0.01 : 0.0001
      if (order.takeProfit && order.takeProfit > 0) {
        tpPrice = order.units > 0
          ? (currentPrice + order.takeProfit * pip)
          : (currentPrice - order.takeProfit * pip)
        tpPrice = tpPrice.toFixed(5)
      }
      if (order.stopLoss && order.stopLoss > 0) {
        slPrice = order.units > 0
          ? (currentPrice - order.stopLoss * pip)
          : (currentPrice + order.stopLoss * pip)
        slPrice = slPrice.toFixed(5)
      }
    }

    // Build OANDA order payload
    const payload: any = {
      order: {
        instrument: order.instrument,
        units: order.units.toString(),
        type: order.type.toUpperCase(),
        positionFill: 'DEFAULT',
      }
    }
    if (tpPrice) {
      payload.order.takeProfitOnFill = { price: tpPrice }
    }
    if (slPrice) {
      payload.order.stopLossOnFill = { price: slPrice }
    }

    // POST to OANDA
    const endpoint = `/accounts/${this.config.accountId}/orders`
    const response = await fetch(`${this.config.apiUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ADVOAI-Trading-Engine/1.0'
      },
      body: JSON.stringify(payload)
    })
    const data = await response.json()
    if (!response.ok) {
      this.logger.error('OANDA order error', data)
      throw createError({ statusCode: response.status, statusMessage: data.errorMessage || 'OANDA order failed' })
    }
    this.logger.info('OANDA order placed', data)
    return data
  }
  private config: OandaConfig
  private logger = createServerLogger('OANDA')

  constructor() {
    // Validate environment variables
    const apiKey = process.env.OANDA_API_KEY
    const accountId = process.env.OANDA_ACCOUNT_ID
    let apiUrl = process.env.OANDA_API_URL ?? 'https://api-fxpractice.oanda.com'

    if (!apiKey) {
      throw new Error('Missing OANDA_API_KEY environment variable')
    }
    if (!accountId) {
      throw new Error('Missing OANDA_ACCOUNT_ID environment variable')
    }

    // Ensure the API URL includes /v3 at the end
    if (!apiUrl.endsWith('/v3')) {
      apiUrl = `${apiUrl}/v3`
    }

    this.config = { apiKey, accountId, apiUrl }
  }

  /**
   * Make a cached API request to OANDA
   */
  async request<T>(
    endpoint: string,
    options: OandaApiOptions = {}
  ): Promise<T> {
    const {
      cache = true,
      cacheTTL = 30000, // 30 seconds default
      retries = 3,
      timeout = 10000 // 10 seconds
    } = options

    const url = `${this.config.apiUrl}${endpoint}`
    const cacheKey = `oanda:${endpoint}`

    const fetchFn = async (): Promise<T> => {
      return this.executeRequest<T>(url, retries, timeout)
    }

    if (cache) {
      return serverCache.get(cacheKey, fetchFn, cacheTTL)
    } else {
      return fetchFn()
    }
  }

  /**
   * Execute HTTP request with retry logic
   */
  private async executeRequest<T>(
    url: string,
    retries: number,
    timeout: number
  ): Promise<T> {
    let lastError: Error | undefined

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        this.logger.info(`OANDA API Request: ${url} (attempt ${attempt}/${retries})`)

        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'ADVOAI-Trading-Engine/1.0'
          },
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          const errorText = await response.text()

          // Log the error
          this.logger.error(`OANDA API Error: ${response.status} ${response.statusText}`, errorText)

          // Handle specific error codes
          if (response.status === 401) {
            throw createError({
              statusCode: 401,
              statusMessage: 'Invalid OANDA API credentials'
            })
          } else if (response.status === 404) {
            throw createError({
              statusCode: 404,
              statusMessage: 'OANDA resource not found'
            })
          } else if (response.status === 429) {
            // Rate limited - wait before retry
            if (attempt < retries) {
              const waitTime = Math.pow(2, attempt) * 1000 // Exponential backoff
              this.logger.warn(`OANDA Rate Limited - waiting ${waitTime}ms (attempt ${attempt})`)
              await new Promise(resolve => setTimeout(resolve, waitTime))
              continue
            }
            throw createError({
              statusCode: 429,
              statusMessage: 'OANDA API rate limit exceeded'
            })
          } else if (response.status >= 500) {
            // Server error - retry
            if (attempt < retries) {
              const waitTime = Math.pow(2, attempt) * 1000
              this.logger.warn(`OANDA Server Error ${response.status} - retrying in ${waitTime}ms (attempt ${attempt})`)
              await new Promise(resolve => setTimeout(resolve, waitTime))
              continue
            }
          }

          throw createError({
            statusCode: response.status,
            statusMessage: `OANDA API error: ${response.statusText}`
          })
        }

        const data = await response.json()

        this.logger.info(`OANDA API Success: ${url} (${JSON.stringify(data).length} bytes)`)

        return data

      } catch (error: any) {
        lastError = error

        // If it's our custom error, don't retry
        if (error.statusCode) {
          throw error
        }

        // Network/timeout errors - retry
        if (attempt < retries) {
          const waitTime = Math.pow(2, attempt) * 1000
          this.logger.warn(`OANDA Network Error - retrying in ${waitTime}ms (attempt ${attempt}): ${error.message}`)
          await new Promise(resolve => setTimeout(resolve, waitTime))
          continue
        }
      }
    }

    // All retries failed
    this.logger.error(`OANDA API Request Failed: ${url}`, lastError?.message || 'Unknown error')

    throw createError({
      statusCode: 500,
      statusMessage: 'Unable to connect to OANDA API after multiple attempts'
    })
  }

  /**
   * Get account data with caching
   */
  async getAccount() {
    return this.request(`/accounts/${this.config.accountId}`, {
      cacheTTL: 15000 // 15 seconds for account data
    })
  }

  /**
   * Get instruments with long-term caching (they rarely change)
   */
  async getInstruments() {
    return this.request(`/accounts/${this.config.accountId}/instruments`, {
      cacheTTL: 60 * 60 * 1000 // 1 hour cache
    })
  }

  /**
   * Get pricing data with short-term caching
   */
  async getPricing(instruments: string[]) {
    const instrumentsParam = instruments.join(',')
    return this.request(`/accounts/${this.config.accountId}/pricing?instruments=${instrumentsParam}`, {
      cacheTTL: 5000 // 5 seconds for pricing
    })
  }

  /**
   * Get candlestick data with medium-term caching
   */
  async getCandles(instrument: string, granularity: string = 'M5', count: number = 100) {
    return this.request(`/instruments/${instrument}/candles?granularity=${granularity}&count=${count}`, {
      cacheTTL: 30000 // 30 seconds for candles
    })
  }

  /**
   * Get positions data with short-term caching
   */
  async getPositions() {
    return this.request(`/accounts/${this.config.accountId}/positions`, {
      cacheTTL: 10000 // 10 seconds for positions
    })
  }

  /**
   * Get trades data with short-term caching
   */
  async getTrades() {
    return this.request(`/accounts/${this.config.accountId}/trades`, {
      cacheTTL: 10000 // 10 seconds for trades
    })
  }

  /**
   * Invalidate cache for specific endpoints
   */
  invalidateCache(pattern?: string) {
    if (pattern) {
      // In a real implementation, you'd want pattern matching
      serverCache.invalidate(`oanda:${pattern}`)
    } else {
      serverCache.clear()
    }
  }
}

// Export singleton instance
export const oandaClient = new OandaApiClient()
