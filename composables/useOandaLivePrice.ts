// composables/useOandaPricing.ts
import type { OandaPricing } from '@/types/Oanda';

export const useOandaPricing = () => {
  return useAsyncData<OandaPricing>('oanda-pricing', () => $fetch('/api/oanda/pricing'));
};
