// composables/useTradingSignals.ts
import type { OandaCandle } from "@/types/Oanda";

interface TradingSignal {
  id: string;
  type: "buy" | "sell";
  strength: "weak" | "moderate" | "strong";
  confidence: number;
  price: number;
  timestamp: Date;
  reason: string;
  indicators: string[];
  suggestedStopLoss: number;
  suggestedTakeProfit: number;
  timeframe: string;
  status: "active" | "expired" | "triggered";
}

interface SignalConfiguration {
  enableRSI: boolean;
  enableMACD: boolean;
  enableBollinger: boolean;
  enableStochastic: boolean;
  enableADX: boolean;
  enableMultiTimeframe: boolean;
  minConfidence: number;
  maxSignalsPerDay: number;
}

export interface UseTradingSignalsReturn {
  signals: import("vue").Ref<TradingSignal[]>;
  configuration: import("vue").Ref<SignalConfiguration>;
  activeSignals: import("vue").ComputedRef<TradingSignal[]>;
  signalStats: import("vue").ComputedRef<any>;
  generateSignals: (
    instrument: string,
    candles: any[],
    timeframe?: string
  ) => Promise<TradingSignal[]>;
  addSignal: (signal: TradingSignal) => boolean;
  updateSignalStatus: (
    signalId: string,
    status: TradingSignal["status"]
  ) => void;
}

export const useTradingSignals = () => {
  const signals = ref<TradingSignal[]>([]);
  const configuration = ref<SignalConfiguration>({
    enableRSI: true,
    enableMACD: true,
    enableBollinger: true,
    enableStochastic: true,
    enableADX: true,
    enableMultiTimeframe: true,
    minConfidence: 70,
    maxSignalsPerDay: 10,
  });

  // Generate signals based on technical analysis
  const generateSignals = async (
    instrument: string,
    candles: OandaCandle[],
    timeframe: string = "M5"
  ) => {
    if (candles.length < 50) return [];

    const prices = candles
      .filter((c) => c.complete && c.mid?.c)
      .map((c) => parseFloat(c.mid!.c));

    if (prices.length < 50) return [];

    const latestPrice = prices[prices.length - 1];
    const newSignals: TradingSignal[] = [];

    // RSI Signals
    if (configuration.value.enableRSI) {
      const rsi = calculateRSI(prices, 14);
      if (rsi !== null) {
        if (rsi < 30) {
          newSignals.push(
            createSignal({
              type: "buy",
              strength: rsi < 20 ? "strong" : "moderate",
              confidence: Math.min(95, 30 + (30 - rsi) * 2),
              price: latestPrice,
              reason: `RSI oversold at ${rsi.toFixed(1)}`,
              indicators: ["RSI"],
              timeframe,
            })
          );
        } else if (rsi > 70) {
          newSignals.push(
            createSignal({
              type: "sell",
              strength: rsi > 80 ? "strong" : "moderate",
              confidence: Math.min(95, 30 + (rsi - 70) * 2),
              price: latestPrice,
              reason: `RSI overbought at ${rsi.toFixed(1)}`,
              indicators: ["RSI"],
              timeframe,
            })
          );
        }
      }
    }

    // MACD Signals
    if (configuration.value.enableMACD) {
      const macd = calculateMACD(prices);
      if (macd && macd.length >= 2) {
        const current = macd[macd.length - 1];
        const previous = macd[macd.length - 2];

        // MACD bullish crossover
        if (previous.macd <= previous.signal && current.macd > current.signal) {
          newSignals.push(
            createSignal({
              type: "buy",
              strength: current.histogram > 0 ? "strong" : "moderate",
              confidence: 75,
              price: latestPrice,
              reason: "MACD bullish crossover",
              indicators: ["MACD"],
              timeframe,
            })
          );
        }
        // MACD bearish crossover
        else if (
          previous.macd >= previous.signal &&
          current.macd < current.signal
        ) {
          newSignals.push(
            createSignal({
              type: "sell",
              strength: current.histogram < 0 ? "strong" : "moderate",
              confidence: 75,
              price: latestPrice,
              reason: "MACD bearish crossover",
              indicators: ["MACD"],
              timeframe,
            })
          );
        }
      }
    }

    // Bollinger Bands Signals
    if (configuration.value.enableBollinger) {
      const bollinger = calculateBollingerBands(prices, 20, 2);
      if (bollinger) {
        const { upper, lower, percentB } = bollinger;

        if (latestPrice <= lower && percentB < 0.1) {
          newSignals.push(
            createSignal({
              type: "buy",
              strength: percentB < 0.05 ? "strong" : "moderate",
              confidence: 80,
              price: latestPrice,
              reason: `Price touching lower Bollinger Band (${percentB.toFixed(
                2
              )}%B)`,
              indicators: ["Bollinger Bands"],
              timeframe,
            })
          );
        } else if (latestPrice >= upper && percentB > 0.9) {
          newSignals.push(
            createSignal({
              type: "sell",
              strength: percentB > 0.95 ? "strong" : "moderate",
              confidence: 80,
              price: latestPrice,
              reason: `Price touching upper Bollinger Band (${percentB.toFixed(
                2
              )}%B)`,
              indicators: ["Bollinger Bands"],
              timeframe,
            })
          );
        }
      }
    }

    // Multi-indicator confluence signals
    const confluenceSignals = findConfluenceSignals(
      newSignals,
      latestPrice,
      timeframe
    );

    // Filter by minimum confidence
    const filteredSignals = [...newSignals, ...confluenceSignals]
      .filter(
        (signal) => signal.confidence >= configuration.value.minConfidence
      )
      .sort((a, b) => b.confidence - a.confidence);

    return filteredSignals;
  };

  // Create a signal object
  const createSignal = (
    params: Partial<TradingSignal> & {
      type: "buy" | "sell";
      price: number;
      reason: string;
      timeframe: string;
    }
  ): TradingSignal => {
    const atr = 0.001; // Simplified ATR for stop loss calculation
    const stopLossDistance = atr * 2;
    const takeProfitDistance = atr * 4;

    return {
      id: `signal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: params.type,
      strength: params.strength || "moderate",
      confidence: params.confidence || 70,
      price: params.price,
      timestamp: new Date(),
      reason: params.reason,
      indicators: params.indicators || [],
      suggestedStopLoss:
        params.type === "buy"
          ? params.price - stopLossDistance
          : params.price + stopLossDistance,
      suggestedTakeProfit:
        params.type === "buy"
          ? params.price + takeProfitDistance
          : params.price - takeProfitDistance,
      timeframe: params.timeframe,
      status: "active",
    };
  };

  // Find confluence signals (multiple indicators agreeing)
  const findConfluenceSignals = (
    signals: TradingSignal[],
    price: number,
    timeframe: string
  ): TradingSignal[] => {
    const buySignals = signals.filter((s) => s.type === "buy");
    const sellSignals = signals.filter((s) => s.type === "sell");

    const confluenceSignals: TradingSignal[] = [];

    if (buySignals.length >= 2) {
      const combinedIndicators = [
        ...new Set(buySignals.flatMap((s) => s.indicators)),
      ];
      const avgConfidence =
        buySignals.reduce((sum, s) => sum + s.confidence, 0) /
        buySignals.length;

      confluenceSignals.push(
        createSignal({
          type: "buy",
          strength: "strong",
          confidence: Math.min(95, avgConfidence + 15),
          price,
          reason: `Multiple bullish indicators confluence (${combinedIndicators.join(
            ", "
          )})`,
          indicators: combinedIndicators,
          timeframe,
        })
      );
    }

    if (sellSignals.length >= 2) {
      const combinedIndicators = [
        ...new Set(sellSignals.flatMap((s) => s.indicators)),
      ];
      const avgConfidence =
        sellSignals.reduce((sum, s) => sum + s.confidence, 0) /
        sellSignals.length;

      confluenceSignals.push(
        createSignal({
          type: "sell",
          strength: "strong",
          confidence: Math.min(95, avgConfidence + 15),
          price,
          reason: `Multiple bearish indicators confluence (${combinedIndicators.join(
            ", "
          )})`,
          indicators: combinedIndicators,
          timeframe,
        })
      );
    }

    return confluenceSignals;
  };

  // Helper functions for technical calculations
  const calculateRSI = (
    prices: number[],
    period: number = 14
  ): number | null => {
    if (prices.length < period + 1) return null;

    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const change = prices[prices.length - i] - prices[prices.length - i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;

    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  };

  const calculateMACD = (
    prices: number[],
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ) => {
    if (prices.length < slowPeriod + signalPeriod) return null;

    const ema12 = calculateEMA(prices, fastPeriod);
    const ema26 = calculateEMA(prices, slowPeriod);

    if (!ema12 || !ema26) return null;

    const macdLine = ema12.map((val, i) => val - ema26[i]);
    const signalLine = calculateEMA(macdLine, signalPeriod);

    if (!signalLine) return null;

    return macdLine.map((macd, i) => ({
      macd,
      signal: signalLine[i] || 0,
      histogram: macd - (signalLine[i] || 0),
    }));
  };

  const calculateEMA = (prices: number[], period: number): number[] | null => {
    if (prices.length < period) return null;

    const multiplier = 2 / (period + 1);
    const ema = [prices[0]];

    for (let i = 1; i < prices.length; i++) {
      ema.push(prices[i] * multiplier + ema[i - 1] * (1 - multiplier));
    }

    return ema;
  };

  const calculateBollingerBands = (
    prices: number[],
    period: number = 20,
    stdDev: number = 2
  ) => {
    if (prices.length < period) return null;

    const recentPrices = prices.slice(-period);
    const sma = recentPrices.reduce((sum, price) => sum + price, 0) / period;

    const variance =
      recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) /
      period;
    const standardDeviation = Math.sqrt(variance);

    const upper = sma + standardDeviation * stdDev;
    const lower = sma - standardDeviation * stdDev;
    const percentB = (prices[prices.length - 1] - lower) / (upper - lower);

    return { upper, middle: sma, lower, percentB };
  };

  // Add signal to the list
  const addSignal = (signal: TradingSignal) => {
    // Check daily limit
    const today = new Date().toDateString();
    const todaySignals = signals.value.filter(
      (s) => s.timestamp.toDateString() === today
    );

    if (todaySignals.length >= configuration.value.maxSignalsPerDay) {
      return false;
    }

    signals.value.unshift(signal);

    // Keep only last 100 signals
    if (signals.value.length > 100) {
      signals.value = signals.value.slice(0, 100);
    }

    return true;
  };

  // Update signal status
  const updateSignalStatus = (
    signalId: string,
    status: TradingSignal["status"]
  ) => {
    const signal = signals.value.find((s) => s.id === signalId);
    if (signal) {
      signal.status = status;
    }
  };

  // Get active signals
  const activeSignals = computed(() =>
    signals.value.filter((s) => s.status === "active")
  );

  // Get signal statistics
  const signalStats = computed(() => {
    const total = signals.value.length;
    const active = activeSignals.value.length;
    const triggered = signals.value.filter(
      (s) => s.status === "triggered"
    ).length;
    const expired = signals.value.filter((s) => s.status === "expired").length;

    const buySignals = signals.value.filter((s) => s.type === "buy").length;
    const sellSignals = signals.value.filter((s) => s.type === "sell").length;

    const avgConfidence =
      total > 0
        ? signals.value.reduce((sum, s) => sum + s.confidence, 0) / total
        : 0;

    return {
      total,
      active,
      triggered,
      expired,
      buySignals,
      sellSignals,
      avgConfidence: Math.round(avgConfidence),
    };
  });

  // Auto-expire old signals
  const expireOldSignals = () => {
    const now = new Date();
    signals.value.forEach((signal) => {
      if (signal.status === "active") {
        const ageInHours =
          (now.getTime() - signal.timestamp.getTime()) / (1000 * 60 * 60);
        const maxAge =
          signal.timeframe === "M5" ? 2 : signal.timeframe === "H1" ? 12 : 24;

        if (ageInHours > maxAge) {
          signal.status = "expired";
        }
      }
    });
  };

  // Start signal monitoring
  setInterval(expireOldSignals, 300000); // Check every 5 minutes

  return {
    signals: readonly(signals),
    configuration,
    activeSignals,
    signalStats,
    generateSignals,
    addSignal,
    updateSignalStatus,
    expireOldSignals,
  };
};
