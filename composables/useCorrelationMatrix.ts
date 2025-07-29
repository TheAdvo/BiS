// composables/useCorrelationMatrix.ts
interface CorrelationData {
  pair1: string
  pair2: string
  correlation: number
  strength: 'very_weak' | 'weak' | 'moderate' | 'strong' | 'very_strong'
  direction: 'positive' | 'negative'
  significance: number
}

interface CurrencyStrength {
  currency: string
  strength: number
  rank: number
  trend: 'strengthening' | 'weakening' | 'stable'
  change: number
}

interface MarketCorrelationInsight {
  type: 'divergence' | 'confluence' | 'risk_on' | 'risk_off'
  description: string
  affectedPairs: string[]
  significance: 'low' | 'medium' | 'high'
  timestamp: Date
}

export const useCorrelationMatrix = () => {
  const correlationMatrix = ref<CorrelationData[]>([])
  const currencyStrengths = ref<CurrencyStrength[]>([])
  const marketInsights = ref<MarketCorrelationInsight[]>([])
  const loading = ref(false)
  const lastUpdate = ref<Date | null>(null)

  const majorPairs = [
    'EUR_USD', 'GBP_USD', 'USD_JPY', 'USD_CHF', 'USD_CAD', 'AUD_USD', 'NZD_USD'
  ]

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD']

  // Calculate correlation between two price series
  const calculateCorrelation = (prices1: number[], prices2: number[]): number => {
    if (prices1.length !== prices2.length || prices1.length < 2) return 0

    const n = prices1.length
    const sum1 = prices1.reduce((a, b) => a + b, 0)
    const sum2 = prices2.reduce((a, b) => a + b, 0)
    const sum1Sq = prices1.reduce((a, b) => a + b * b, 0)
    const sum2Sq = prices2.reduce((a, b) => a + b * b, 0)
    const pSum = prices1.reduce((a, b, i) => a + b * prices2[i], 0)

    const num = pSum - (sum1 * sum2 / n)
    const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n))

    return den === 0 ? 0 : num / den
  }

  // Get correlation strength category
  const getCorrelationStrength = (correlation: number): CorrelationData['strength'] => {
    const abs = Math.abs(correlation)
    if (abs >= 0.8) return 'very_strong'
    if (abs >= 0.6) return 'strong'
    if (abs >= 0.4) return 'moderate'
    if (abs >= 0.2) return 'weak'
    return 'very_weak'
  }

  // Calculate currency strength based on multiple pairs
  const calculateCurrencyStrength = (priceData: { [pair: string]: number[] }): CurrencyStrength[] => {
    const currencyScores: { [currency: string]: number[] } = {}

    // Initialize currency arrays
    currencies.forEach(currency => {
      currencyScores[currency] = []
    })

    // Calculate relative strength for each currency
    Object.entries(priceData).forEach(([pair, prices]) => {
      if (prices.length < 2) return

      const [base, quote] = pair.split('_')
      const returns = prices.slice(1).map((price, i) => (price - prices[i]) / prices[i])
      const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length

      // Base currency gains when pair goes up
      currencyScores[base].push(avgReturn)
      // Quote currency loses when pair goes up
      currencyScores[quote].push(-avgReturn)
    })

    // Calculate final strength scores
    const strengths: CurrencyStrength[] = currencies.map(currency => {
      const scores = currencyScores[currency]
      const strength = scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0

      return {
        currency,
        strength: strength * 10000, // Scale for better readability
        rank: 0, // Will be set after sorting
        trend: 'stable',
        change: 0 // Will be calculated with historical data
      }
    })

    // Sort by strength and assign ranks
    strengths.sort((a, b) => b.strength - a.strength)
    strengths.forEach((item, index) => {
      item.rank = index + 1
    })

    return strengths
  }

  // Generate market insights based on correlations
  const generateMarketInsights = (correlations: CorrelationData[]): MarketCorrelationInsight[] => {
    const insights: MarketCorrelationInsight[] = []
    const now = new Date()

    // Look for unusual correlations
    const strongNegativeCorrelations = correlations.filter(c =>
      c.correlation < -0.7 && c.strength === 'very_strong'
    )

    const strongPositiveCorrelations = correlations.filter(c =>
      c.correlation > 0.7 && c.strength === 'very_strong'
    )

    // Risk-off sentiment (safe havens strengthening together)
    const safeHavenPairs = correlations.filter(c =>
      (c.pair1.includes('JPY') || c.pair1.includes('CHF')) &&
      (c.pair2.includes('JPY') || c.pair2.includes('CHF')) &&
      c.correlation > 0.6
    )

    if (safeHavenPairs.length >= 2) {
      insights.push({
        type: 'risk_off',
        description: 'Safe haven currencies showing strong positive correlation - potential risk-off sentiment',
        affectedPairs: [...new Set([...safeHavenPairs.flatMap(c => [c.pair1, c.pair2])])],
        significance: 'high',
        timestamp: now
      })
    }

    // Risk-on sentiment (commodity currencies strengthening)
    const commodityPairs = correlations.filter(c =>
      (c.pair1.includes('AUD') || c.pair1.includes('CAD') || c.pair1.includes('NZD')) &&
      (c.pair2.includes('AUD') || c.pair2.includes('CAD') || c.pair2.includes('NZD')) &&
      c.correlation > 0.6
    )

    if (commodityPairs.length >= 2) {
      insights.push({
        type: 'risk_on',
        description: 'Commodity currencies showing strong positive correlation - potential risk-on sentiment',
        affectedPairs: [...new Set([...commodityPairs.flatMap(c => [c.pair1, c.pair2])])],
        significance: 'high',
        timestamp: now
      })
    }

    // Divergence alerts
    const divergences = correlations.filter(c =>
      Math.abs(c.correlation) < 0.3 &&
      ((c.pair1.includes('EUR') && c.pair2.includes('GBP')) ||
       (c.pair1.includes('AUD') && c.pair2.includes('NZD')))
    )

    divergences.forEach(div => {
      insights.push({
        type: 'divergence',
        description: `Unusual divergence detected between ${div.pair1} and ${div.pair2}`,
        affectedPairs: [div.pair1, div.pair2],
        significance: 'medium',
        timestamp: now
      })
    })

    return insights
  }

  // Fetch correlation data (mock implementation)
  const fetchCorrelationData = async () => {
    loading.value = true

    try {
      // In real implementation, this would fetch actual price data for all pairs
      const mockPriceData: { [pair: string]: number[] } = {}

      // Generate mock price data for demonstration
      majorPairs.forEach(pair => {
        const prices = []
        let price = 1.1000 + Math.random() * 0.2 // Random starting price

        for (let i = 0; i < 100; i++) {
          price += (Math.random() - 0.5) * 0.01
          prices.push(price)
        }

        mockPriceData[pair] = prices
      })

      // Calculate correlations between all pairs
      const correlations: CorrelationData[] = []

      for (let i = 0; i < majorPairs.length; i++) {
        for (let j = i + 1; j < majorPairs.length; j++) {
          const pair1 = majorPairs[i]
          const pair2 = majorPairs[j]
          const correlation = calculateCorrelation(mockPriceData[pair1], mockPriceData[pair2])

          correlations.push({
            pair1,
            pair2,
            correlation: Math.round(correlation * 100) / 100,
            strength: getCorrelationStrength(correlation),
            direction: correlation >= 0 ? 'positive' : 'negative',
            significance: Math.abs(correlation)
          })
        }
      }

      correlationMatrix.value = correlations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))

      // Calculate currency strengths
      currencyStrengths.value = calculateCurrencyStrength(mockPriceData)

      // Generate market insights
      const newInsights = generateMarketInsights(correlations)
      marketInsights.value = [...newInsights, ...marketInsights.value].slice(0, 10)

      lastUpdate.value = new Date()

    } catch (error) {
      console.error('Error calculating correlations:', error)
    } finally {
      loading.value = false
    }
  }

  // Get correlation for specific pair combination
  const getCorrelation = (pair1: string, pair2: string): CorrelationData | null => {
    return correlationMatrix.value.find(c =>
      (c.pair1 === pair1 && c.pair2 === pair2) ||
      (c.pair1 === pair2 && c.pair2 === pair1)
    ) || null
  }

  // Get correlations for a specific pair
  const getCorrelationsForPair = (pair: string): CorrelationData[] => {
    return correlationMatrix.value.filter(c => c.pair1 === pair || c.pair2 === pair)
  }

  // Get currency strength rank
  const getCurrencyRank = (currency: string): CurrencyStrength | null => {
    return currencyStrengths.value.find(c => c.currency === currency) || null
  }

  // Get market sentiment based on correlations
  const marketSentiment = computed(() => {
    if (correlationMatrix.value.length === 0) return { sentiment: 'neutral', confidence: 0 }

    const riskOnCount = marketInsights.value.filter(i => i.type === 'risk_on').length
    const riskOffCount = marketInsights.value.filter(i => i.type === 'risk_off').length

    // Check USD strength vs commodity currencies
    const usdStrength = getCurrencyRank('USD')?.rank || 4
    const commodityStrength = [
      getCurrencyRank('AUD')?.rank || 4,
      getCurrencyRank('CAD')?.rank || 4,
      getCurrencyRank('NZD')?.rank || 4
    ].reduce((sum, rank) => sum + rank, 0) / 3

    let sentiment = 'neutral'
    let confidence = 0

    if (riskOnCount > riskOffCount && commodityStrength < usdStrength) {
      sentiment = 'risk_on'
      confidence = Math.min(90, (riskOnCount * 20) + ((usdStrength - commodityStrength) * 10))
    } else if (riskOffCount > riskOnCount && usdStrength < commodityStrength) {
      sentiment = 'risk_off'
      confidence = Math.min(90, (riskOffCount * 20) + ((commodityStrength - usdStrength) * 10))
    }

    return { sentiment, confidence }
  })

  // Correlation heatmap data
  const correlationHeatmap = computed(() => {
    const heatmap: { [key: string]: { [key: string]: number } } = {}

    majorPairs.forEach(pair1 => {
      heatmap[pair1] = {}
      majorPairs.forEach(pair2 => {
        if (pair1 === pair2) {
          heatmap[pair1][pair2] = 1
        } else {
          const correlation = getCorrelation(pair1, pair2)
          heatmap[pair1][pair2] = correlation?.correlation || 0
        }
      })
    })

    return heatmap
  })

  // Portfolio risk analysis
  const analyzePortfolioRisk = (positions: { pair: string; size: number }[]) => {
    if (positions.length < 2) return { risk: 'low', diversification: 100 }

    let totalRisk = 0
    let pairCount = 0

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const correlation = getCorrelation(positions[i].pair, positions[j].pair)
        if (correlation) {
          const weight = (positions[i].size * positions[j].size) /
                        (positions.reduce((sum, p) => sum + p.size, 0) ** 2)
          totalRisk += Math.abs(correlation.correlation) * weight
          pairCount++
        }
      }
    }

    const avgCorrelation = pairCount > 0 ? totalRisk / pairCount : 0
    const diversification = Math.max(0, 100 - (avgCorrelation * 100))

    let risk = 'low'
    if (avgCorrelation > 0.7) risk = 'high'
    else if (avgCorrelation > 0.4) risk = 'medium'

    return { risk, diversification: Math.round(diversification) }
  }

  // Auto-refresh correlation data
  const startAutoRefresh = () => {
    const refreshInterval = 15 * 60 * 1000 // 15 minutes
    setInterval(fetchCorrelationData, refreshInterval)
  }

  return {
    correlationMatrix: readonly(correlationMatrix),
    currencyStrengths: readonly(currencyStrengths),
    marketInsights: readonly(marketInsights),
    marketSentiment,
    correlationHeatmap,
    loading: readonly(loading),
    lastUpdate: readonly(lastUpdate),
    fetchCorrelationData,
    getCorrelation,
    getCorrelationsForPair,
    getCurrencyRank,
    analyzePortfolioRisk,
    startAutoRefresh
  }
}
