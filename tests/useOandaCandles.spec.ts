import { describe, it, expect } from "vitest";
import { extractClosePrices } from "../composables/useOandaCandles";
import type { OandaCandle, OandaCandlesResponse } from "../types/Oanda";

const sampleCandles: OandaCandle[] = [
  {
    time: "t1",
    mid: { o: "1", h: "1", l: "1", c: "1.1" },
    volume: 10,
    complete: true,
  },
  {
    time: "t2",
    mid: { o: "2", h: "2", l: "2", c: "2.2" },
    volume: 20,
    complete: true,
  },
];

const sampleResponse: OandaCandlesResponse = {
  instrument: "EUR_USD",
  granularity: "M5",
  candles: sampleCandles,
};

describe("extractClosePrices", () => {
  it("extracts closes from response object", () => {
    const res = extractClosePrices(sampleResponse);
    expect(res).toEqual([1.1, 2.2]);
  });

  it("extracts closes from array directly", () => {
    const res = extractClosePrices(sampleCandles);
    expect(res).toEqual([1.1, 2.2]);
  });

  it("returns empty for null/undefined", () => {
    expect(extractClosePrices(null)).toEqual([]);
    expect(extractClosePrices(undefined)).toEqual([]);
  });
});
