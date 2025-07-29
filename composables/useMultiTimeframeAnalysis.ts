// composables/useMultiTimeframeAnalysis.ts
import type { OandaCandlesResponse, OandaCandle } from '@/types/Oanda'

interface TimeframeData {
  candles: OandaCandle[]
  loading: boolean
  lastUpdate: Date | null
  trend: 'bullish' | 'bearish' | 'neutral'
  strength: number
}

interface MultiTimeframeAnalysis {
  M5: TimeframeData
  H1: TimeframeData
  H4: TimeframeData
  D: TimeframeData
  overall: {
    bias: 'bullish' | 'bearish' | 'neutral'
    confidence: number
    confluence: number
  }
}

export const useMultiTimeframeAnalysis = (instrument: string = 'EUR_USD') => {
  const activeTimeframe = ref<'M5' | 'H1' | 'H4' | 'D'>('M5')
  const analysis = ref<MultiTimeframeAnalysis>({
    M5: { candles: [], loading: false, lastUpdate: null, trend: 'neutral', strength: 0 },
    H1: { candles: [], loading: false, lastUpdate: null, trend: 'neutral', strength: 0 },
    H4: { candles: [], loading: false, lastUpdate: null, trend: 'neutral', strength: 0 },
    D: { candles: [], loading: false, lastUpdate: null, trend: 'neutral', strength: 0 },
    overall: { bias: 'neutral', confidence: 0, confluence: 0 }
  })

  const timeframes = [
    { key: 'M5', label: '5 Minutes', granularity: 'M5', count: 500, color: 'blue' },
    { key: 'H1', label: '1 Hour', granularity: 'H1', count: 200, color: 'green' },
    { key: 'H4', label: '4 Hours', granularity: 'H4', count: 100, color: 'orange' },
    { key: 'D', label: 'Daily', granularity: 'D', count: 50, color: 'purple' }
  ] as const

  // Calculate trend and strength for a timeframe
  const calculateTrendAnalysis = (candles: OandaCandle[]) => {
    if (candles.length < 20) return { trend: 'neutral' as const, strength: 0 }

    const prices = candles
      .filter(c => c.complete && c.mid?.c)
      .map(c => parseFloat(c.mid!.c))
      .slice(-20) // Last 20 periods

    if (prices.length < 20) return { trend: 'neutral' as const, strength: 0 }

    // Simple moving averages
    const sma10 = prices.slice(-10).reduce((a, b) => a + b) / 10
    const sma20 = prices.reduce((a, b) => a + b) / 20
    const currentPrice = prices[prices.length - 1]

    // Price position relative to SMAs
    const priceAboveSma10 = currentPrice > sma10
    const priceAboveSma20 = currentPrice > sma20
    const sma10AboveSma20 = sma10 > sma20

    // Calculate strength based on price momentum
    const priceChange = (currentPrice - prices[0]) / prices[0]
    const volatility = Math.sqrt(
      prices.slice(1).reduce((acc, price, i) => {
        const change = (price - prices[i]) / prices[i]
        return acc + change * change
      }, 0) / (prices.length - 1)
    )

    let bullishSignals = 0
    let bearishSignals = 0

    if (priceAboveSma10) bullishSignals++
    else bearishSignals++

    if (priceAboveSma20) bullishSignals++
    else bearishSignals++

    if (sma10AboveSma20) bullishSignals++
    else bearishSignals++

    if (priceChange > 0) bullishSignals++
    else bearishSignals++

    const strength = Math.min(Math.abs(priceChange) / volatility * 100, 100)

    if (bullishSignals >= 3) {
      return { trend: 'bullish' as const, strength }
    } else if (bearishSignals >= 3) {
      return { trend: 'bearish' as const, strength }
    } else {
      return { trend: 'neutral' as const, strength: strength * 0.5 }
    }
  }

  // Fetch data for a specific timeframe
  const fetchTimeframeData = async (timeframe: typeof timeframes[number]) => {
    const tfKey = timeframe.key as keyof typeof analysis.value
    if (tfKey === 'overall') return

    analysis.value[tfKey].loading = true

    try {
      const response = await $fetch<OandaCandlesResponse>('/api/oanda/candles', {
        query: {
          instrument,
          granularity: timeframe.granularity,
          count: timeframe.count
        }
      })

      analysis.value[tfKey].candles = response.candles || []
      analysis.value[tfKey].lastUpdate = new Date()

      // Calculate trend analysis
      const trendAnalysis = calculateTrendAnalysis(response.candles || [])
      analysis.value[tfKey].trend = trendAnalysis.trend
      analysis.value[tfKey].strength = trendAnalysis.strength

    } catch (error) {
      console.error(`Error fetching ${timeframe.key} data:`, error)
    } finally {
      analysis.value[tfKey].loading = false
    }
  }

  // Calculate overall market bias
  const calculateOverallBias = () => {
    const timeframeWeights = { M5: 1, H1: 2, H4: 3, D: 4 }
    let bullishScore = 0
    let bearishScore = 0
    let totalWeight = 0

    Object.entries(timeframeWeights).forEach(([tf, weight]) => {
      const tfKey = tf as keyof typeof timeframeWeights
      const tfData = analysis.value[tfKey]

      if (tfData.trend === 'bullish') {
        bullishScore += weight * (tfData.strength / 100)
      } else if (tfData.trend === 'bearish') {
        bearishScore += weight * (tfData.strength / 100)
      }
      totalWeight += weight
    })

    const netScore = (bullishScore - bearishScore) / totalWeight
    const confidence = Math.abs(netScore) * 100

    // Calculate confluence (agreement between timeframes)
    const trends = [analysis.value.M5.trend, analysis.value.H1.trend, analysis.value.H4.trend, analysis.value.D.trend]
    const bullishCount = trends.filter(t => t === 'bullish').length
    const bearishCount = trends.filter(t => t === 'bearish').length
    const confluence = Math.max(bullishCount, bearishCount) / 4 * 100

    let bias: 'bullish' | 'bearish' | 'neutral' = 'neutral'
    if (netScore > 0.2) bias = 'bullish'
    else if (netScore < -0.2) bias = 'bearish'

    analysis.value.overall = { bias, confidence, confluence }
  }

  // Fetch all timeframes
  const fetchAllTimeframes = async () => {
    await Promise.all(timeframes.map(tf => fetchTimeframeData(tf)))
    calculateOverallBias()
  }

  // Get current timeframe data
  const currentTimeframeData = computed(() => {
    return analysis.value[activeTimeframe.value]
  })

  // Auto-refresh data
  const startAutoRefresh = () => {
    const intervals = {
      M5: 30000,  // 30 seconds
      H1: 300000, // 5 minutes
      H4: 900000, // 15 minutes
      D: 3600000  // 1 hour
    }

    timeframes.forEach(tf => {
      setInterval(() => {
        fetchTimeframeData(tf)
        calculateOverallBias()
      }, intervals[tf.key])
    })
  }

  return {
    analysis: readonly(analysis),
    activeTimeframe,
    timeframes,
    currentTimeframeData,
    fetchAllTimeframes,
    fetchTimeframeData,
    startAutoRefresh,
    calculateOverallBias
  }
}
