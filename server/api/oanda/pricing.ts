import { oandaClient } from "~/server/utils/oandaClient";
import type { OandaTradesResponse } from "@/types/Oanda";
import { parseInstruments } from "./_helpers";

export default defineEventHandler(async (event) => {
  const instruments = parseInstruments(event);
  const data = (await oandaClient.getPricing(instruments as string[])) as any;
  return { prices: data.prices || data } as any;
});
