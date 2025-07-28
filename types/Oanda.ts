/**
 * Represents an OANDA trading account with balance and position information
 */
export interface OandaAccount {
  /** Current account balance in account currency */
  balance: string;
  /** Profit/Loss for the account */
  pl: string;
  /** Net Asset Value - account balance including unrealized P&L */
  NAV: string;
  /** Available margin for trading */
  marginAvailable: string;
  /** Number of currently open trades */
  openTradeCount: number;
  /** Number of currently open positions */
  openPositionCount: number;
  /** Number of pending orders */
  pendingOrderCount: number;
  /** Profit/Loss that can be reset */
  resettablePL: string;
  /** Total value of all positions */
  positionValue: string;
  /** Currently used margin */
  marginUsed: string;
  /** Unrealized P&L from open positions */
  unrealizedPL: string;
  /** Optional account alias/nickname */
  alias?: string;
  /** Account base currency (e.g., 'USD', 'EUR') */
  currency: string;
  /** Unique account identifier */
  accountID: string;
  /** Array of position details */
  positions?: Array<{
    instrument: string;
    pl: string;
    unrealizedPL: string;
    long: {
      units: string;
      pl: string;
      unrealizedPL: string;
    };
    short: {
      units: string;
      pl: string;
      unrealizedPL: string;
    };
  }>;
  /** Array of open trades */
  trades?: Array<any>;
  /** Array of pending orders */
  orders?: Array<any>;
  /** ID of the last transaction */
  lastTransactionID: string; // or number, depending on API
}

/**
 * Real-time price data message from OANDA pricing stream
 */
export type PriceMessage = {
  /** Message type identifier (typically 'PRICE') */
  type: string;
  /** Currency pair instrument name (e.g., 'EUR_USD') */
  instrument: string;
  /** Array of bid prices with the best bid first */
  bids: Array<{ price: string }>;
  /** Array of ask prices with the best ask first */
  asks: Array<{ price: string }>;
  /** ISO timestamp of when the price was generated */
  time: string;
}

/**
 * OANDA trading instrument details and trading constraints
 */
export interface OandaInstrument {
  /** Instrument identifier (e.g., 'EUR_USD', 'XAU_USD') */
  name: string;
  /** Instrument type (e.g., 'CURRENCY', 'METAL') */
  type: string;
  /** Human-readable display name */
  displayName: string;
  /** Decimal place location for calculating pips */
  pipLocation: number;
  /** Number of decimal places for price display */
  displayPrecision: number;
  /** Number of decimal places for trade unit precision */
  tradeUnitsPrecision: number;
  /** Minimum trade size allowed */
  minimumTradeSize: string;
  /** Maximum trailing stop distance */
  maximumTrailingStopDistance: string;
  /** Minimum trailing stop distance */
  minimumTrailingStopDistance: string;
  /** Maximum position size allowed */
  maximumPositionSize: string;
  /** Maximum order units allowed */
  maximumOrderUnits: string;
  /** Margin rate required for trading this instrument */
  marginRate: string;
  /** Optional commission structure */
  commission?: {
    /** Commission rate */
    commission: string;
    /** Units on which commission is calculated */
    unitsTraded: string;
    /** Minimum commission charge */
    minimumCommission: string;
  };
}

/**
 * Response structure for OANDA instruments API endpoint
 */
export interface OandaInstrumentsResponse {
  /** Array of available trading instruments */
  instruments: OandaInstrument[];
}