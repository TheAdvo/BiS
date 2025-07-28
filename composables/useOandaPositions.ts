import type { OandaPositionsResponse, OandaTradesResponse } from '@/types/Oanda';

export const useOandaPositions = () => {
  return useAsyncData<OandaPositionsResponse>('oanda-positions', async () => {
    const data = await $fetch<OandaPositionsResponse>('/api/oanda/positions');
    return data;
  }, {
    // Refresh positions data more frequently than account data
    server: false,
    default: () => ({ positions: [], lastTransactionID: '' })
  });
};

export const useOandaTrades = () => {
  return useAsyncData<OandaTradesResponse>('oanda-trades', async () => {
    const data = await $fetch<OandaTradesResponse>('/api/oanda/trades');
    return data;
  }, {
    // Refresh trades data more frequently than account data
    server: false,
    default: () => ({ trades: [], lastTransactionID: '' })
  });
};
