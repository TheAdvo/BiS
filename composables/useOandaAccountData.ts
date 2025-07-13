import type { OandaAccount } from '@/types/Oanda';

export const useOandaAccount = () => {
  return useAsyncData<OandaAccount>('oanda-account', async () => {
    const data = await $fetch<OandaAccount>('/api/oanda/account');
    return data;
  });
};
