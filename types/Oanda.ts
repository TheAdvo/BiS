export interface OandaAccount {
  balance: string;
  pl: string;
  NAV: string;
  marginAvailable: string;
  openTradeCount: number;
  resettablePL: string;
  positionValue: string;
  marginUsed: string;
  alias?: string;
  currency: string; // Add this line
  accountID: string; // Add this property
}

export type PriceMessage = {
  type: string;
  instrument: string;
  bids: Array<{ price: string }>;
  asks: Array<{ price: string }>;
  time: string; // or Date, depending on your API
}

export interface OandaInstrument {
  name: string;
  type: string;
  displayName: string;
  pipLocation: number;
  displayPrecision: number;
  tradeUnitsPrecision: number;
  minimumTradeSize: string;
  maximumTrailingStopDistance: string;
  minimumTrailingStopDistance: string;
  maximumPositionSize: string;
  maximumOrderUnits: string;
  marginRate: string;
  commission?: {
    commission: string;
    unitsTraded: string;
    minimumCommission: string;
  };
}

export interface OandaInstrumentsResponse {
  instruments: OandaInstrument[];
}