import { defineStore } from "pinia";
import { ref, computed, watch, type Ref } from "vue";
import { useOandaCandles } from "@/composables/useOandaCandles";
import type { OandaCandle } from "@/types/Oanda";

export const useCandlesStore = defineStore("candles", () => {
  // reactive keys that the composable expects
  const instrument = ref("EUR_USD");
  const granularity = ref("M5");
  const count = 500;

  // livePrice ref that can be attached to an external SSE/WS pricing feed
  const livePrice = ref<any | null>(null);

  // reuse project composable for consistent fetch/caching/aborts
  // pass livePrice so the composable can append a synthetic candle for calculations
  const oandaCandles = useOandaCandles(
    instrument,
    granularity,
    count,
    livePrice
  );

  // expose convenient wrappers
  const candles = computed<OandaCandle[]>(
    () => oandaCandles.candles.value || []
  );
  const pending = computed(() => oandaCandles.pending.value);
  const error = computed(() => oandaCandles.error.value);

  // small debug/observability fields
  const lastRefresh = ref<number | null>(null);
  const lastRefreshStatus = ref<"idle" | "pending" | "success" | "error">(
    "idle"
  );

  const refresh = async () => {
    lastRefreshStatus.value = "pending";
    try {
      const res = await oandaCandles.refresh();
      lastRefresh.value = Date.now();
      lastRefreshStatus.value = "success";
      return res;
    } catch (e) {
      lastRefreshStatus.value = "error";
      throw e;
    }
  };

  const getClosePrices = () => {
    return oandaCandles.getClosePrices();
  };

  const getOHLCData = () => {
    return oandaCandles.getOHLCData();
  };

  function setInstrument(v: string) {
    instrument.value = v;
  }

  function setGranularity(g: string) {
    granularity.value = g;
  }

  // Attach an external reactive price ref (from your pricing store or component)
  // The function will keep `livePrice` in this store in sync with the external ref
  function attachLivePrice(externalRef: Ref<any | null>) {
    // immediate sync
    livePrice.value = externalRef.value;
    // keep syncing when external updates
    watch(
      externalRef,
      (v) => {
        livePrice.value = v;
      },
      { immediate: false }
    );
  }

  return {
    instrument,
    granularity,
    candles,
    pending,
    error,
    lastRefresh,
    lastRefreshStatus,
    refresh,
    getClosePrices,
    getOHLCData,
    setInstrument,
    setGranularity,
    attachLivePrice,
  };
});
