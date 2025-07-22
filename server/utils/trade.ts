// server/utils/trade.ts

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Calculate Simple Moving Average
export function calculateSMA(data: number[], period: number): number[] {
  const sma = []
  for (let i = 0; i <= data.length - period; i++) {
    const slice = data.slice(i, i + period)
    const sum = slice.reduce((a, b) => a + b, 0)
    sma.push(sum / period)
  }
  return sma
}

// MA Crossover Strategy
export function maCrossoverStrategy(candles: Candle[], shortPeriod: number, longPeriod: number): 'BUY' | 'SELL' | null {
  const closePrices = candles.map(c => c.close)
  const shortMA = calculateSMA(closePrices, shortPeriod)
  const longMA = calculateSMA(closePrices, longPeriod)

  const lastShortMA = shortMA[shortMA.length - 1]
  const prevShortMA = shortMA[shortMA.length - 2]
  const lastLongMA = longMA[longMA.length - (longPeriod - shortPeriod) -1]
  const prevLongMA = longMA[longMA.length - (longPeriod - shortPeriod) -2]

  // Buy signal: short MA crosses above long MA
  if (prevShortMA < prevLongMA && lastShortMA > lastLongMA) {
    return 'BUY'
  }

  // Sell signal: short MA crosses below long MA
  if (prevShortMA > prevLongMA && lastShortMA < lastLongMA) {
    return 'SELL'
  }

  return null
}
