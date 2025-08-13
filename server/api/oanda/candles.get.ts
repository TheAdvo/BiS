// server/api/oanda/candles.get.ts
import { getQuery, createError, defineEventHandler } from "h3";
import { oandaClient } from "~/server/utils/oandaClient";
import type { OandaCandlesResponse } from "@/types/Oanda";

const ALLOWED_GRANULARITIES = new Set(["M1", "M5", "M15", "H1", "H4", "D"]);

export default defineEventHandler(async (event) => {
  const q = getQuery(event);
  const instrument = (q.instrument ?? "").toString().trim();
  const granularity = ((q.granularity ?? "M5") as string).toUpperCase();
  const price = ((q.price ?? "M") as string).toUpperCase() as
    | "M"
    | "B"
    | "A"
    | "MBA";
  const rawCount = Number(q.count ?? 100);
  const count =
    Number.isFinite(rawCount) && rawCount > 0 ? Math.min(rawCount, 5000) : 100;

  if (!instrument) {
    throw createError({
      statusCode: 400,
      statusMessage: "instrument is required (e.g., EUR_USD)",
    });
  }

  if (!ALLOWED_GRANULARITIES.has(granularity)) {
    throw createError({
      statusCode: 400,
      statusMessage: `Invalid granularity: ${granularity}`,
    });
  }

  try {
    const data = (await oandaClient.getCandles(instrument, granularity, count, {
      price,
      cache: false,
    })) as OandaCandlesResponse;
    const candles = data.candles || [];
    return data.candles ? data : { candles: [] };
  } catch (err: any) {
    const statusCode = err?.statusCode || 500;
    const statusMessage = err?.statusMessage || "Failed to fetch candle data";
    throw createError({ statusCode, statusMessage });
  }
});
