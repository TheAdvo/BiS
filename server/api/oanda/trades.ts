import { oandaClient } from "~/server/utils/oandaClient";
import type { OandaTradesResponse } from "@/types/Oanda";

export default defineEventHandler(async (): Promise<OandaTradesResponse> => {
  const tradesData = (await oandaClient.getTrades()) as any;
  return {
    trades: tradesData.trades || [],
    lastTransactionID: tradesData.lastTransactionID,
  } as OandaTradesResponse;
});
