import type { OandaCandle } from "./Oanda";
import type { Ref } from "vue";

export interface TechnicalIndicators {
  rsi: number | null;
  macd: { macd: number; signal: number; histogram: number } | null;
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    percentB: number;
  } | null;
  stochastic: { k: number; d: number } | null;
  atr: number | null;
  adx: { adx: number; plusDI: number; minusDI: number } | null;
  ichimoku: {
    tenkanSen: number;
    kijunSen: number;
    senkouSpanA: number;
    senkouSpanB: number;
    chikouSpan: number;
  } | null;
  williams: number | null;
  cci: number | null;
  momentum: number | null;
  roc: number | null;
}

export interface CandlestickPattern {
  name: string;
  type: "bullish" | "bearish" | "neutral";
  strength: "weak" | "moderate" | "strong";
  confidence: number;
  description: string;
}

export interface MarketStructure {
  trend: "uptrend" | "downtrend" | "sideways";
  strength: number;
  support: number[];
  resistance: number[];
  pivotPoints: {
    pivot: number;
    r1: number;
    r2: number;
    r3: number;
    s1: number;
    s2: number;
    s3: number;
  };
}

export type OHLC = {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  time: string;
};

export interface UseOandaCandlesReturn {
  // Core data
  data: Ref<any>;
  candles: Ref<OandaCandle[]>;
  pending: Ref<boolean>;
  error: Ref<any | null>;
  refresh: () => Promise<void>;

  // Enhanced data extraction
  getOHLCData: () => OHLC[];
  getClosePrices: () => number[];
  getHighPrices: () => number[];
  getLowPrices: () => number[];

  // Basic indicators
  calculateSMA: (period: number) => number | null;
  calculateEMA: (period: number) => number | null;
  calculateRSI: (period?: number) => number | null;
  calculateMACD: (
    fastPeriod?: number,
    slowPeriod?: number,
    signalPeriod?: number
  ) => { macd: number; signal: number; histogram: number } | null;
  calculateStochastic: (kPeriod?: number) => { k: number; d: number } | null;
  calculateATR: (period?: number) => number | null;

  // Advanced indicators
  calculateBollingerBands: (
    period?: number,
    stdDev?: number
  ) => {
    upper: number;
    middle: number;
    lower: number;
    percentB: number;
  } | null;
  calculateADX: (
    period?: number
  ) => { adx: number; plusDI: number; minusDI: number } | null;
  calculateIchimoku: () => {
    tenkanSen: number;
    kijunSen: number;
    senkouSpanA: number;
    senkouSpanB: number;
    chikouSpan: number;
  } | null;
  calculateWilliamsR: (period?: number) => number | null;
  calculateCCI: (period?: number) => number | null;
  calculateMomentum: (period?: number) => number | null;
  calculateROC: (period?: number) => number | null;

  // Pattern recognition and market structure
  recognizePatterns: () => CandlestickPattern[];
  analyzeMarketStructure: () => MarketStructure | null;
  getAdvancedAnalysis: () => TechnicalIndicators;
}
