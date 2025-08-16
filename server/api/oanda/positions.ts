import { oandaClient } from "~/server/utils/oandaClient";
import type { OandaPositionsResponse } from "@/types/Oanda";

export default defineEventHandler(async (): Promise<OandaPositionsResponse> => {
  const positionsData = (await oandaClient.getPositions()) as any;
  return {
    positions: positionsData.positions || [],
    lastTransactionID: positionsData.lastTransactionID,
  } as OandaPositionsResponse;
});
