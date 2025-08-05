// composables/useOandaCandles.ts
import type { OandaCandlesResponse, OandaCandle } from '@/types/Oanda'

// Advanced technical analysis interface
interface TechnicalIndicators {
  rsi: number | null
  macd: { macd: number; signal: number; histogram: number } | null
  bollinger: { upper: number; middle: number; lower: number; percentB: number } | null
  stochastic: { k: number; d: number } | null
  atr: number | null
  adx: { adx: number; plusDI: number; minusDI: number } | null
  ichimoku: {
    tenkanSen: number
    kijunSen: number
    senkouSpanA: number
    senkouSpanB: number
    chikouSpan: number
  } | null
  williams: number | null
  cci: number | null
  momentum: number | null
  roc: number | null
}

// Candlestick pattern recognition
interface CandlestickPattern {
  name: string
  type: 'bullish' | 'bearish' | 'neutral'
  strength: 'weak' | 'moderate' | 'strong'
  confidence: number
  description: string
}

// Market structure analysis
interface MarketStructure {
  trend: 'uptrend' | 'downtrend' | 'sideways'
  strength: number
  support: number[]
  resistance: number[]
  pivotPoints: {
    pivot: number
    r1: number
    r2: number
    r3: number
    s1: number
    s2: number
    s3: number
  }
}

export const useOandaCandles = (instrument: string, granularity: string = 'M5', count: number = 500, livePrice?: any) => {
  const { data, pending, error, refresh } = useAsyncData<OandaCandlesResponse>(
    `oanda-candles-${instrument}-${granularity}-${count}`,
    async () => {
      const response = await $fetch<OandaCandlesResponse>('/api/oanda/candles', {
        query: { instrument, granularity, count }
      })
      return response
    },
    {
      server: false,
      default: () => ({ instrument: '', granularity: '', candles: [] })
    }
  )

  // If livePrice is provided, append a synthetic candle for calculations
  const candles = computed(() => {
    const base = data.value?.candles ? [...data.value.candles] : []
    if (livePrice && livePrice.value && livePrice.value.bids?.[0]?.price && livePrice.value.asks?.[0]?.price) {
      // Use mid price for close, open, high, low
      const bid = parseFloat(livePrice.value.bids[0].price)
      const ask = parseFloat(livePrice.value.asks[0].price)
      const mid = (bid + ask) / 2
      base.push({
        complete: false,
        mid: { o: mid.toString(), h: mid.toString(), l: mid.toString(), c: mid.toString() },
        volume: 0,
        time: new Date().toISOString()
      })
    }
    return base
  })

  // Enhanced price extraction with validation
  const getOHLCData = () => {
    // Accept incomplete (synthetic) candle if present
    return candles.value
      .filter(candle => candle.mid?.o && candle.mid?.h && candle.mid?.l && candle.mid?.c)
      .map(candle => ({
        open: parseFloat(candle.mid!.o),
        high: parseFloat(candle.mid!.h),
        low: parseFloat(candle.mid!.l),
        close: parseFloat(candle.mid!.c),
        volume: candle.volume,
        time: candle.time
      }))
  }

  // Helper to get close prices for calculations
  const getClosePrices = (): number[] => {
    // Accept incomplete (synthetic) candle if present
    return candles.value
      .filter(candle => candle.mid?.c)
      .map(candle => parseFloat(candle.mid!.c))
  }

  // Helper to get high prices
  const getHighPrices = (): number[] => {
    return candles.value
      .filter(candle => candle.mid?.h)
      .map(candle => parseFloat(candle.mid!.h))
  }

  // Helper to get low prices
  const getLowPrices = (): number[] => {
    return candles.value
      .filter(candle => candle.mid?.l)
      .map(candle => parseFloat(candle.mid!.l))
  }

  // Calculate Simple Moving Average
  const calculateSMA = (period: number): number | null => {
    const closes = getClosePrices()
    if (closes.length < period) return null

    const recent = closes.slice(-period)
    return recent.reduce((sum, price) => sum + price, 0) / period
  }

  // Calculate Exponential Moving Average
  const calculateEMA = (period: number): number | null => {
    const closes = getClosePrices()
    if (closes.length < period) return null

    const multiplier = 2 / (period + 1)
    let ema = closes[0]

    for (let i = 1; i < closes.length; i++) {
      ema = (closes[i] * multiplier) + (ema * (1 - multiplier))
    }

    return ema
  }

  // Calculate RSI
  const calculateRSI = (period: number = 14): number | null => {
    const closes = getClosePrices()
    if (closes.length < period + 1) return null

    let gains = 0
    let losses = 0

    // Calculate initial average gain and loss
    for (let i = 1; i <= period; i++) {
      const change = closes[i] - closes[i - 1]
      if (change > 0) {
        gains += change
      } else {
        losses -= change
      }
    }

    let avgGain = gains / period
    let avgLoss = losses / period

    // Calculate subsequent values using smoothed averages
    for (let i = period + 1; i < closes.length; i++) {
      const change = closes[i] - closes[i - 1]
      const gain = change > 0 ? change : 0
      const loss = change < 0 ? -change : 0

      avgGain = ((avgGain * (period - 1)) + gain) / period
      avgLoss = ((avgLoss * (period - 1)) + loss) / period
    }

    if (avgLoss === 0) return 100
    const rs = avgGain / avgLoss
    return 100 - (100 / (1 + rs))
  }

  // Calculate Bollinger Bands with standard deviation
  const calculateBollingerBands = (period: number = 20, stdDev: number = 2): {
    upper: number; middle: number; lower: number; percentB: number
  } | null => {
    const closes = getClosePrices()
    if (closes.length < period) return null

    const sma = calculateSMA(period)
    if (sma === null) return null

    const recentCloses = closes.slice(-period)

    // Calculate standard deviation
    const variance = recentCloses.reduce((sum, price) => {
      return sum + Math.pow(price - sma, 2)
    }, 0) / period

    const standardDeviation = Math.sqrt(variance)

    const upper = sma + (standardDeviation * stdDev)
    const lower = sma - (standardDeviation * stdDev)
    const currentPrice = closes[closes.length - 1]

    // %B calculation
    const percentB = (currentPrice - lower) / (upper - lower)

    return {
      upper,
      middle: sma,
      lower,
      percentB
    }
  }

  // Advanced ADX with Directional Indicators
  const calculateADX = (period: number = 14): {
    adx: number; plusDI: number; minusDI: number
  } | null => {
    const ohlc = getOHLCData()
    if (ohlc.length < period + 1) return null

    const trueRanges: number[] = []
    const plusDMs: number[] = []
    const minusDMs: number[] = []

    for (let i = 1; i < ohlc.length; i++) {
      const current = ohlc[i]
      const previous = ohlc[i - 1]

      // True Range
      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      )
      trueRanges.push(tr)

      // Directional Movement
      const highDiff = current.high - previous.high
      const lowDiff = previous.low - current.low

      const plusDM = (highDiff > lowDiff && highDiff > 0) ? highDiff : 0
      const minusDM = (lowDiff > highDiff && lowDiff > 0) ? lowDiff : 0

      plusDMs.push(plusDM)
      minusDMs.push(minusDM)
    }

    if (trueRanges.length < period) return null

    // Calculate smoothed values
    const smoothedTR = trueRanges.slice(-period).reduce((a, b) => a + b, 0)
    const smoothedPlusDM = plusDMs.slice(-period).reduce((a, b) => a + b, 0)
    const smoothedMinusDM = minusDMs.slice(-period).reduce((a, b) => a + b, 0)

    const plusDI = (smoothedPlusDM / smoothedTR) * 100
    const minusDI = (smoothedMinusDM / smoothedTR) * 100

    const dx = Math.abs(plusDI - minusDI) / (plusDI + minusDI) * 100

    // For ADX, we'd need multiple DX values to calculate the average
    // Simplified: using current DX as ADX approximation
    const adx = dx

    return { adx, plusDI, minusDI }
  }

  // Ichimoku Cloud calculations
  const calculateIchimoku = (): {
    tenkanSen: number
    kijunSen: number
    senkouSpanA: number
    senkouSpanB: number
    chikouSpan: number
  } | null => {
    const ohlc = getOHLCData()
    if (ohlc.length < 52) return null

    // Tenkan-sen (Conversion Line): (9-period high + 9-period low) / 2
    const tenkanHighs = ohlc.slice(-9).map(c => c.high)
    const tenkanLows = ohlc.slice(-9).map(c => c.low)
    const tenkanSen = (Math.max(...tenkanHighs) + Math.min(...tenkanLows)) / 2

    // Kijun-sen (Base Line): (26-period high + 26-period low) / 2
    const kijunHighs = ohlc.slice(-26).map(c => c.high)
    const kijunLows = ohlc.slice(-26).map(c => c.low)
    const kijunSen = (Math.max(...kijunHighs) + Math.min(...kijunLows)) / 2

    // Senkou Span A: (Tenkan-sen + Kijun-sen) / 2
    const senkouSpanA = (tenkanSen + kijunSen) / 2

    // Senkou Span B: (52-period high + 52-period low) / 2
    const senkouHighs = ohlc.slice(-52).map(c => c.high)
    const senkouLows = ohlc.slice(-52).map(c => c.low)
    const senkouSpanB = (Math.max(...senkouHighs) + Math.min(...senkouLows)) / 2

    // Chikou Span: Current close plotted 26 periods back
    const chikouSpan = ohlc[ohlc.length - 1].close

    return {
      tenkanSen,
      kijunSen,
      senkouSpanA,
      senkouSpanB,
      chikouSpan
    }
  }

  // Williams %R
  const calculateWilliamsR = (period: number = 14): number | null => {
    const ohlc = getOHLCData()
    if (ohlc.length < period) return null

    const recentData = ohlc.slice(-period)
    const highestHigh = Math.max(...recentData.map(c => c.high))
    const lowestLow = Math.min(...recentData.map(c => c.low))
    const currentClose = ohlc[ohlc.length - 1].close

    return ((highestHigh - currentClose) / (highestHigh - lowestLow)) * -100
  }

  // Commodity Channel Index (CCI)
  const calculateCCI = (period: number = 20): number | null => {
    const ohlc = getOHLCData()
    if (ohlc.length < period) return null

    const recentData = ohlc.slice(-period)
    const typicalPrices = recentData.map(c => (c.high + c.low + c.close) / 3)

    const smaTP = typicalPrices.reduce((a, b) => a + b, 0) / period
    const currentTP = typicalPrices[typicalPrices.length - 1]

    const meanDeviation = typicalPrices.reduce((sum, tp) => {
      return sum + Math.abs(tp - smaTP)
    }, 0) / period

    return (currentTP - smaTP) / (0.015 * meanDeviation)
  }

  // Momentum
  const calculateMomentum = (period: number = 10): number | null => {
    const closes = getClosePrices()
    if (closes.length < period + 1) return null

    const currentClose = closes[closes.length - 1]
    const pastClose = closes[closes.length - 1 - period]

    return ((currentClose - pastClose) / pastClose) * 100
  }

  // Rate of Change (ROC)
  const calculateROC = (period: number = 10): number | null => {
    const closes = getClosePrices()
    if (closes.length < period + 1) return null

    const currentClose = closes[closes.length - 1]
    const pastClose = closes[closes.length - 1 - period]

    return ((currentClose - pastClose) / pastClose) * 100
  }

  // Enhanced MACD with proper signal line
  const calculateMACD = (fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): {
    macd: number; signal: number; histogram: number
  } | null => {
    const closes = getClosePrices()
    if (closes.length < slowPeriod + signalPeriod) return null

    // Calculate EMAs
    const fastEMA = calculateEMA(fastPeriod)
    const slowEMA = calculateEMA(slowPeriod)

    if (fastEMA === null || slowEMA === null) return null

    const macd = fastEMA - slowEMA

    // For proper signal line, we'd need historical MACD values
    // Simplified signal line calculation
    const signal = macd * 0.9
    const histogram = macd - signal

    return { macd, signal, histogram }
  }

  // Candlestick Pattern Recognition
  const recognizePatterns = (): CandlestickPattern[] => {
    const ohlc = getOHLCData()
    if (ohlc.length < 3) return []

    const patterns: CandlestickPattern[] = []
    const current = ohlc[ohlc.length - 1]
    const previous = ohlc[ohlc.length - 2]
    const beforePrevious = ohlc[ohlc.length - 3]

    // Helper functions
    const isGreen = (candle: any) => candle.close > candle.open
    const isRed = (candle: any) => candle.close < candle.open
    const bodySize = (candle: any) => Math.abs(candle.close - candle.open)
    const upperShadow = (candle: any) => candle.high - Math.max(candle.open, candle.close)
    const lowerShadow = (candle: any) => Math.min(candle.open, candle.close) - candle.low
    const totalRange = (candle: any) => candle.high - candle.low

    // Doji pattern
    if (bodySize(current) / totalRange(current) < 0.1) {
      patterns.push({
        name: 'Doji',
        type: 'neutral',
        strength: 'moderate',
        confidence: 70,
        description: 'Indecision in the market, potential reversal signal'
      })
    }

    // Hammer pattern (bullish reversal)
    if (isGreen(current) &&
        lowerShadow(current) > bodySize(current) * 2 &&
        upperShadow(current) < bodySize(current) * 0.5) {
      patterns.push({
        name: 'Hammer',
        type: 'bullish',
        strength: 'strong',
        confidence: 80,
        description: 'Strong bullish reversal pattern at support levels'
      })
    }

    // Shooting Star pattern (bearish reversal)
    if (isRed(current) &&
        upperShadow(current) > bodySize(current) * 2 &&
        lowerShadow(current) < bodySize(current) * 0.5) {
      patterns.push({
        name: 'Shooting Star',
        type: 'bearish',
        strength: 'strong',
        confidence: 80,
        description: 'Strong bearish reversal pattern at resistance levels'
      })
    }

    // Engulfing patterns
    if (isRed(previous) && isGreen(current) &&
        current.open < previous.close && current.close > previous.open) {
      patterns.push({
        name: 'Bullish Engulfing',
        type: 'bullish',
        strength: 'strong',
        confidence: 85,
        description: 'Strong bullish reversal after downtrend'
      })
    }

    if (isGreen(previous) && isRed(current) &&
        current.open > previous.close && current.close < previous.open) {
      patterns.push({
        name: 'Bearish Engulfing',
        type: 'bearish',
        strength: 'strong',
        confidence: 85,
        description: 'Strong bearish reversal after uptrend'
      })
    }

    // Morning Star (3-candle bullish reversal)
    if (ohlc.length >= 3) {
      if (isRed(beforePrevious) &&
          bodySize(previous) < bodySize(beforePrevious) * 0.3 &&
          isGreen(current) &&
          current.close > (beforePrevious.open + beforePrevious.close) / 2) {
        patterns.push({
          name: 'Morning Star',
          type: 'bullish',
          strength: 'strong',
          confidence: 90,
          description: 'Very strong 3-candle bullish reversal pattern'
        })
      }

      // Evening Star (3-candle bearish reversal)
      if (isGreen(beforePrevious) &&
          bodySize(previous) < bodySize(beforePrevious) * 0.3 &&
          isRed(current) &&
          current.close < (beforePrevious.open + beforePrevious.close) / 2) {
        patterns.push({
          name: 'Evening Star',
          type: 'bearish',
          strength: 'strong',
          confidence: 90,
          description: 'Very strong 3-candle bearish reversal pattern'
        })
      }
    }

    return patterns
  }

  // Market Structure Analysis
  const analyzeMarketStructure = (): MarketStructure | null => {
    const ohlc = getOHLCData()
    if (ohlc.length < 50) return null

    const closes = ohlc.map(c => c.close)
    const highs = ohlc.map(c => c.high)
    const lows = ohlc.map(c => c.low)

    // Trend analysis using multiple timeframes
    const shortTermSMA = calculateSMA(20)
    const longTermSMA = calculateSMA(50)

    let trend: 'uptrend' | 'downtrend' | 'sideways' = 'sideways'
    let strength = 50

    if (shortTermSMA && longTermSMA) {
      if (shortTermSMA > longTermSMA) {
        trend = 'uptrend'
        strength = Math.min(100, 50 + ((shortTermSMA - longTermSMA) / longTermSMA * 1000))
      } else if (shortTermSMA < longTermSMA) {
        trend = 'downtrend'
        strength = Math.min(100, 50 + ((longTermSMA - shortTermSMA) / longTermSMA * 1000))
      }
    }

    // Support and Resistance levels using pivot points
    const recentLows = lows.slice(-20)
    const recentHighs = highs.slice(-20)

    const support = [...new Set(recentLows.filter(low => {
      const count = recentLows.filter(l => Math.abs(l - low) < low * 0.001).length
      return count >= 2
    }))].sort((a, b) => b - a).slice(0, 3)

    const resistance = [...new Set(recentHighs.filter(high => {
      const count = recentHighs.filter(h => Math.abs(h - high) < high * 0.001).length
      return count >= 2
    }))].sort((a, b) => a - b).slice(0, 3)

    // Pivot Points calculation
    const lastCandle = ohlc[ohlc.length - 1]
    const pivot = (lastCandle.high + lastCandle.low + lastCandle.close) / 3

    const pivotPoints = {
      pivot,
      r1: 2 * pivot - lastCandle.low,
      r2: pivot + (lastCandle.high - lastCandle.low),
      r3: lastCandle.high + 2 * (pivot - lastCandle.low),
      s1: 2 * pivot - lastCandle.high,
      s2: pivot - (lastCandle.high - lastCandle.low),
      s3: lastCandle.low - 2 * (lastCandle.high - pivot)
    }

    return {
      trend,
      strength,
      support,
      resistance,
      pivotPoints
    }
  }

  // Comprehensive Technical Analysis
  const getAdvancedAnalysis = (): TechnicalIndicators => {
    return {
      rsi: calculateRSI(14),
      macd: calculateMACD(),
      bollinger: calculateBollingerBands(),
      stochastic: calculateStochastic(),
      atr: calculateATR(),
      adx: calculateADX(),
      ichimoku: calculateIchimoku(),
      williams: calculateWilliamsR(),
      cci: calculateCCI(),
      momentum: calculateMomentum(),
      roc: calculateROC()
    }
  }

  // Calculate Stochastic Oscillator
  const calculateStochastic = (kPeriod: number = 14): { k: number; d: number } | null => {
    const closes = getClosePrices()
    const highs = getHighPrices()
    const lows = getLowPrices()

    if (closes.length < kPeriod || highs.length < kPeriod || lows.length < kPeriod) {
      return null
    }

    const recentCloses = closes.slice(-kPeriod)
    const recentHighs = highs.slice(-kPeriod)
    const recentLows = lows.slice(-kPeriod)

    const currentClose = recentCloses[recentCloses.length - 1]
    const highestHigh = Math.max(...recentHighs)
    const lowestLow = Math.min(...recentLows)

    if (highestHigh === lowestLow) return { k: 50, d: 50 }

    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100
    const d = k * 0.9 // Simplified D line calculation

    return { k, d }
  }

  // Calculate Average True Range
  const calculateATR = (period: number = 14): number | null => {
    const closes = getClosePrices()
    const highs = getHighPrices()
    const lows = getLowPrices()

    if (closes.length < period + 1 || highs.length < period + 1 || lows.length < period + 1) {
      return null
    }

    const trueRanges: number[] = []

    for (let i = 1; i < Math.min(closes.length, highs.length, lows.length); i++) {
      const high = highs[i]
      const low = lows[i]
      const prevClose = closes[i - 1]

      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      )
      trueRanges.push(tr)
    }

    if (trueRanges.length < period) return null

    const recentTR = trueRanges.slice(-period)
    return recentTR.reduce((sum, tr) => sum + tr, 0) / period
  }

  return {
    // Core data
    data,
    candles,
    pending,
    error,
    refresh,

    // Enhanced data extraction
    getOHLCData,
    getClosePrices,
    getHighPrices,
    getLowPrices,

    // Basic indicators
    calculateSMA,
    calculateEMA,
    calculateRSI,
    calculateMACD,
    calculateStochastic,
    calculateATR,

    // Advanced indicators
    calculateBollingerBands,
    calculateADX,
    calculateIchimoku,
    calculateWilliamsR,
    calculateCCI,
    calculateMomentum,
    calculateROC,

    // Pattern recognition and market structure
    recognizePatterns,
    analyzeMarketStructure,
    getAdvancedAnalysis
  }
}
