/**
 * Performance metrics for trading analytics
 */
export interface PerformanceMetrics {
  /** Sharpe ratio - risk-adjusted return */
  sharpeRatio: number;
  /** Maximum drawdown percentage */
  maxDrawdown: number;
  /** Profit factor - gross profit divided by gross loss */
  profitFactor: number;
  /** Average holding time per position in hours */
  avgHoldTime: number;
  /** Recovery factor - net profit divided by max drawdown */
  recoveryFactor: number;
  /** Kelly percentage - optimal position size */
  kellyPercentage: number;
}

/**
 * Strategy performance data
 */
export interface StrategyPerformance {
  /** Strategy name/identifier */
  name: string;
  /** Strategy description */
  description: string;
  /** Timeframe the strategy operates on */
  timeframe: string;
  /** Total profit/loss for this strategy */
  totalPnL: number;
  /** Win rate percentage */
  winRate: number;
  /** Number of trades executed */
  totalTrades: number;
  /** Whether strategy is currently active */
  isActive: boolean;
}

/**
 * Currency pair performance data
 */
export interface CurrencyPairPerformance {
  /** Currency pair symbol (e.g., 'EUR_USD') */
  symbol: string;
  /** Display name (e.g., 'EUR/USD') */
  displayName: string;
  /** Country flag emojis */
  flags: string;
  /** Total profit/loss for this pair */
  totalPnL: number;
  /** Number of trades on this pair */
  totalTrades: number;
  /** Win rate for this pair */
  winRate: number;
}

/**
 * Historical performance data point
 */
export interface PerformanceDataPoint {
  /** Timestamp */
  timestamp: string;
  /** Account balance at this time */
  balance: number;
  /** Cumulative P&L */
  pnl: number;
  /** Daily return percentage */
  dailyReturn?: number;
}

/**
 * Analytics dashboard data
 */
export interface AnalyticsData {
  /** Key performance metrics */
  metrics: PerformanceMetrics;
  /** Strategy performance breakdown */
  strategies: StrategyPerformance[];
  /** Currency pair performance */
  currencyPairs: CurrencyPairPerformance[];
  /** Historical performance data */
  performanceHistory: PerformanceDataPoint[];
  /** Last updated timestamp */
  lastUpdated: string;
}
