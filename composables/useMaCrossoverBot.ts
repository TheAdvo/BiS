import { ref, computed } from "vue";
import type { Ref } from "vue";
import { useOandaStore } from "@/stores/oanda";
import { useCandlesStore } from "@/stores/candles";

type Signal = "buy" | "sell" | null;

function sma(values: number[], period: number): number[] {
  const res: number[] = [];
  let sum = 0;
  for (let i = 0; i < values.length; i++) {
    sum += values[i];
    if (i >= period) {
      sum -= values[i - period];
    }
    if (i >= period - 1) {
      res.push(sum / period);
    } else {
      res.push(NaN);
    }
  }
  return res;
}

export function useMaCrossoverBot() {
  const oanda = useOandaStore();
  const candlesStore = useCandlesStore();

  const isRunning = ref(false);
  const liveMode = ref(false);
  const instrument = ref("EUR_USD");
  const granularity = ref("M5");
  const shortPeriod = ref(9);
  const longPeriod = ref(21);
  // the canonical candles store is used for fetching/refreshing
  const lastSignal: Ref<Signal> = ref(null);
  const simulatedTrades = ref<
    Array<{ signal: Signal; time: string; price: number }>
  >([]);

  async function pollOnce(count = 200) {
    // Delegate to the richer pollWithDebug for consistency
    const d = await pollWithDebug(count);
    if (!d) return null;
    return { signal: d.signal, price: d.price, time: d.time };
  }

  // Provide a detailed poll that returns arrays and intermediate SMA values for debugging / UI
  async function pollWithDebug(count = 200) {
    // refresh via the candles store and extract close prices + raw candles
    candlesStore.setInstrument(instrument.value);
    candlesStore.setGranularity(granularity.value);
    await candlesStore.refresh();
    const closes: number[] = candlesStore.getClosePrices();
    const candlesRaw = (candlesStore.candles || []) as any[];
    if (closes.length === 0) return null;

    const short = sma(closes, shortPeriod.value);
    const long = sma(closes, longPeriod.value);

    const i = closes.length - 1;
    const prev = i - 1;
    if (prev < 0)
      return {
        signal: null as Signal,
        price: closes[i] || NaN,
        time: candlesRaw[i]?.time,
        closes,
        short,
        long,
        shortPrev: NaN,
        longPrev: NaN,
        shortNow: short[i],
        longNow: long[i],
        index: i,
      };

    const shortPrev = short[prev];
    const longPrev = long[prev];
    const shortNow = short[i];
    const longNow = long[i];

    if (
      !isFinite(shortPrev) ||
      !isFinite(longPrev) ||
      !isFinite(shortNow) ||
      !isFinite(longNow)
    )
      return {
        signal: null as Signal,
        price: closes[i],
        time: candlesRaw[i]?.time,
        closes,
        short,
        long,
        shortPrev,
        longPrev,
        shortNow,
        longNow,
        index: i,
      };

    let signal: Signal = null;
    if (shortPrev <= longPrev && shortNow > longNow) signal = "buy";
    else if (shortPrev >= longPrev && shortNow < longNow) signal = "sell";

    return {
      signal,
      price: closes[i],
      time: candlesRaw[i]?.time,
      closes,
      short,
      long,
      shortPrev,
      longPrev,
      shortNow,
      longNow,
      index: i,
    };
  }

  async function start() {
    isRunning.value = true;
    const res = await pollOnce();
    if (res && res.signal) {
      lastSignal.value = res.signal;
      simulatedTrades.value.push({
        signal: res.signal,
        time: res.time || new Date().toISOString(),
        price: res.price,
      });
      if (liveMode.value) {
        try {
          await oanda.placeOrder({
            instrument: instrument.value,
            units: 100,
            side: res.signal === "buy" ? "buy" : "sell",
          });
        } catch (e) {
          console.error("Live order failed", e);
        }
      }
    }
  }

  function stop() {
    isRunning.value = false;
  }

  function backtest(
    candles: any[],
    shortP = shortPeriod.value,
    longP = longPeriod.value
  ) {
    const closes = candles.map((c: any) =>
      parseFloat((c.mid && c.mid.c) || c.close || c.c || c.o || 0)
    );
    const short = sma(closes, shortP);
    const long = sma(closes, longP);
    const trades: Array<{ signal: Signal; time: string; price: number }> = [];
    for (let i = 1; i < closes.length; i++) {
      const sPrev = short[i - 1];
      const lPrev = long[i - 1];
      const sNow = short[i];
      const lNow = long[i];
      if (
        !isFinite(sPrev) ||
        !isFinite(lPrev) ||
        !isFinite(sNow) ||
        !isFinite(lNow)
      )
        continue;
      if (sPrev <= lPrev && sNow > lNow) {
        trades.push({
          signal: "buy",
          time: candles[i].time || new Date().toISOString(),
          price: closes[i],
        });
      } else if (sPrev >= lPrev && sNow < lNow) {
        trades.push({
          signal: "sell",
          time: candles[i].time || new Date().toISOString(),
          price: closes[i],
        });
      }
    }
    return trades;
  }

  return {
    isRunning: computed(() => isRunning.value),
    liveMode,
    instrument,
    granularity,
    shortPeriod,
    longPeriod,
    lastSignal: computed(() => lastSignal.value),
    simulatedTrades: computed(() => simulatedTrades.value),
    pollOnce,
    start,
    stop,
    backtest,
  };
}
