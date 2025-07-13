export interface OandaPositionSide {
  units: string;
  pl: string;
}

export interface OandaPosition {
  instrument: string;
  long: OandaPositionSide;
  short: OandaPositionSide;
}

export interface OandaAccount {
  balance: string;
  pl: string;
  NAV: string;
  marginAvailable: string;
  openTradeCount: number;
  resettablePL: string;
  positionValue: string;
  marginUsed: string;
  positions: OandaPosition[];
}

export interface OandaPricing {
  prices: Array<{
    instrument: string;
    bids: Array<{
      price: string;
    }>;
    asks: Array<{
      price: string;
    }>;
    time: string;
  }>;
}