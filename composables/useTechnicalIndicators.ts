import { computed, type Ref } from "vue";
import type { OandaCandlesResponse } from "@/types/Oanda";

// Lightweight, efficient technical indicator helpers for MarketOverview
export function useTechnicalIndicators(
  candlesRef: Ref<OandaCandlesResponse["candles"] | null>
) {
  // Precomputed numeric price array (filtered and parsed once)
  const prices = computed(() => {
    const c = candlesRef.value;
    if (!c) return [] as number[];
    return c
      .filter((x) => x.complete && x.mid?.c)
      .map((x) => parseFloat(x.mid!.c));
  });

  const rsi = computed(() => {
    const p = prices.value;
    if (p.length < 14) return 50;

    const slice = p.slice(-14);
    let gains = 0;
    let losses = 0;
    const changeCount = Math.min(13, slice.length - 1);

    for (let i = 1; i <= changeCount; i++) {
      const change = slice[i] - slice[i - 1];
      if (change > 0) gains += change;
      else losses += Math.abs(change);
    }

    const avgGain = gains / changeCount;
    const avgLoss = losses / changeCount;
    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - 100 / (1 + rs);
  });

  const macdSignal = computed(() => {
    const p = prices.value;
    if (p.length < 26) return "neutral";

    const last26 = p.slice(-26);
    const sum12 = last26.slice(-12).reduce((a, b) => a + b, 0);
    const sum26 = last26.reduce((a, b) => a + b, 0);
    const ema12 = sum12 / 12;
    const ema26 = sum26 / 26;
    const macd = ema12 - ema26;
    return macd > 0 ? "bullish" : "bearish";
  });

  const trend = computed(() => {
    const p = prices.value;
    if (p.length < 20) return "neutral";

    const slice = p.slice(-20);
    const firstHalf = slice.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
    const secondHalf = slice.slice(-10).reduce((a, b) => a + b, 0) / 10;

    if (secondHalf > firstHalf * 1.001) return "up";
    if (secondHalf < firstHalf * 0.999) return "down";
    return "neutral";
  });

  return { prices, rsi, macdSignal, trend };
}
