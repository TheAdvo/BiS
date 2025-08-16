// composables/useVolumeAnalysis.ts
import type { OandaCandle } from "@/types/Oanda";

interface VolumeProfile {
  priceLevel: number;
  volume: number;
  percentage: number;
  type: "high" | "medium" | "low";
}

interface VolumeIndicators {
  vwap: number | null; // Volume Weighted Average Price
  obvOBV: number | null; // On Balance Volume
  adl: number | null; // Accumulation/Distribution Line
  mfi: number | null; // Money Flow Index
  volumeMA: number | null; // Volume Moving Average
  volumeRatio: number | null; // Current volume vs average
  priceVolumeConfirmation: "bullish" | "bearish" | "neutral";
}

interface VolumeAlert {
  id: string;
  type: "high_volume" | "volume_spike" | "accumulation" | "distribution";
  timestamp: Date;
  price: number;
  volume: number;
  description: string;
  significance: "low" | "medium" | "high";
}

export interface UseVolumeAnalysisReturn {
  volumeProfile: import("vue").Ref<VolumeProfile[]>;
  volumeIndicators: import("vue").Ref<VolumeIndicators>;
  volumeAlerts: import("vue").Ref<VolumeAlert[]>;
  volumeStrength: import("vue").ComputedRef<{
    strength: string;
    score: number;
  }>;
  pointOfControl: import("vue").ComputedRef<VolumeProfile | null>;
  valueArea: import("vue").ComputedRef<{
    high: number;
    low: number;
    levels: VolumeProfile[];
  } | null>;
  loading: import("vue").Ref<boolean>;
  calculateVolumeIndicators: (
    candles: import("@/types/Oanda").OandaCandle[]
  ) => void;
  generateVolumeProfile: (
    candles: import("@/types/Oanda").OandaCandle[],
    levels?: number
  ) => VolumeProfile[];
  generateVolumeAlerts: (
    candles: import("@/types/Oanda").OandaCandle[]
  ) => VolumeAlert[];
}
export const useVolumeAnalysis = () => {
  const volumeProfile = ref<VolumeProfile[]>([]);
  const volumeIndicators = ref<VolumeIndicators>({
    vwap: null,
    obvOBV: null,
    adl: null,
    mfi: null,
    volumeMA: null,
    volumeRatio: null,
    priceVolumeConfirmation: "neutral",
  });
  const volumeAlerts = ref<VolumeAlert[]>([]);
  const loading = ref(false);

  // Calculate Volume Weighted Average Price (VWAP)
  const calculateVWAP = (candles: OandaCandle[]): number | null => {
    if (candles.length === 0) return null;

    let totalVolume = 0;
    let totalVolumePrice = 0;

    candles.forEach((candle) => {
      if (candle.complete && candle.mid && candle.volume) {
        const typical =
          (parseFloat(candle.mid.h) +
            parseFloat(candle.mid.l) +
            parseFloat(candle.mid.c)) /
          3;
        const volume = candle.volume;

        totalVolumePrice += typical * volume;
        totalVolume += volume;
      }
    });

    return totalVolume > 0 ? totalVolumePrice / totalVolume : null;
  };

  // Calculate On Balance Volume (OBV)
  const calculateOBV = (candles: OandaCandle[]): number | null => {
    if (candles.length < 2) return null;

    let obv = 0;

    for (let i = 1; i < candles.length; i++) {
      const current = candles[i];
      const previous = candles[i - 1];

      if (
        current.complete &&
        previous.complete &&
        current.mid &&
        previous.mid &&
        current.volume
      ) {
        const currentClose = parseFloat(current.mid.c);
        const previousClose = parseFloat(previous.mid.c);

        if (currentClose > previousClose) {
          obv += current.volume;
        } else if (currentClose < previousClose) {
          obv -= current.volume;
        }
        // Volume stays the same if price is unchanged
      }
    }

    return obv;
  };

  // Calculate Accumulation/Distribution Line (ADL)
  const calculateADL = (candles: OandaCandle[]): number | null => {
    if (candles.length === 0) return null;

    let adl = 0;

    candles.forEach((candle) => {
      if (candle.complete && candle.mid && candle.volume) {
        const high = parseFloat(candle.mid.h);
        const low = parseFloat(candle.mid.l);
        const close = parseFloat(candle.mid.c);
        const volume = candle.volume;

        if (high !== low) {
          const moneyFlowMultiplier =
            (close - low - (high - close)) / (high - low);
          const moneyFlowVolume = moneyFlowMultiplier * volume;
          adl += moneyFlowVolume;
        }
      }
    });

    return adl;
  };

  // Calculate Money Flow Index (MFI)
  const calculateMFI = (
    candles: OandaCandle[],
    period: number = 14
  ): number | null => {
    if (candles.length < period + 1) return null;

    const recentCandles = candles.slice(-period - 1);
    let positiveFlow = 0;
    let negativeFlow = 0;

    for (let i = 1; i < recentCandles.length; i++) {
      const current = recentCandles[i];
      const previous = recentCandles[i - 1];

      if (
        current.complete &&
        previous.complete &&
        current.mid &&
        previous.mid &&
        current.volume
      ) {
        const currentTypical =
          (parseFloat(current.mid.h) +
            parseFloat(current.mid.l) +
            parseFloat(current.mid.c)) /
          3;
        const previousTypical =
          (parseFloat(previous.mid.h) +
            parseFloat(previous.mid.l) +
            parseFloat(previous.mid.c)) /
          3;

        const rawMoneyFlow = currentTypical * current.volume;

        if (currentTypical > previousTypical) {
          positiveFlow += rawMoneyFlow;
        } else if (currentTypical < previousTypical) {
          negativeFlow += rawMoneyFlow;
        }
      }
    }

    if (negativeFlow === 0) return 100;

    const moneyFlowRatio = positiveFlow / negativeFlow;
    return 100 - 100 / (1 + moneyFlowRatio);
  };

  // Generate Volume Profile
  const generateVolumeProfile = (
    candles: OandaCandle[],
    levels: number = 20
  ): VolumeProfile[] => {
    if (candles.length === 0) return [];

    const validCandles = candles.filter((c) => c.complete && c.mid && c.volume);
    if (validCandles.length === 0) return [];

    // Find price range
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    validCandles.forEach((candle) => {
      const high = parseFloat(candle.mid!.h);
      const low = parseFloat(candle.mid!.l);
      minPrice = Math.min(minPrice, low);
      maxPrice = Math.max(maxPrice, high);
    });

    const priceStep = (maxPrice - minPrice) / levels;
    const volumeByLevel: { [key: number]: number } = {};

    // Distribute volume across price levels
    validCandles.forEach((candle) => {
      const high = parseFloat(candle.mid!.h);
      const low = parseFloat(candle.mid!.l);
      const volume = candle.volume!;

      // Distribute volume evenly across the candle's price range
      const candleLevels = Math.ceil((high - low) / priceStep) || 1;
      const volumePerLevel = volume / candleLevels;

      for (let price = low; price <= high; price += priceStep) {
        const levelIndex = Math.floor((price - minPrice) / priceStep);
        const levelPrice = minPrice + levelIndex * priceStep;
        volumeByLevel[levelPrice] =
          (volumeByLevel[levelPrice] || 0) + volumePerLevel;
      }
    });

    // Convert to array and calculate percentages
    const totalVolume = Object.values(volumeByLevel).reduce(
      (sum, vol) => sum + vol,
      0
    );
    const maxVolumeAtLevel = Math.max(...Object.values(volumeByLevel));

    const profile: VolumeProfile[] = Object.entries(volumeByLevel)
      .map(([price, volume]) => ({
        priceLevel: parseFloat(price),
        volume,
        percentage: (volume / totalVolume) * 100,
        type:
          volume > maxVolumeAtLevel * 0.7
            ? ("high" as const)
            : volume > maxVolumeAtLevel * 0.3
            ? ("medium" as const)
            : ("low" as const),
      }))
      .sort((a, b) => b.volume - a.volume);

    return profile.slice(0, levels);
  };

  // Analyze Price-Volume Relationship
  const analyzePriceVolumeRelationship = (
    candles: OandaCandle[]
  ): "bullish" | "bearish" | "neutral" => {
    if (candles.length < 10) return "neutral";

    const recentCandles = candles.slice(-10);
    let bullishDivergence = 0;
    let bearishDivergence = 0;

    for (let i = 1; i < recentCandles.length; i++) {
      const current = recentCandles[i];
      const previous = recentCandles[i - 1];

      if (
        current.complete &&
        previous.complete &&
        current.mid &&
        previous.mid &&
        current.volume &&
        previous.volume
      ) {
        const priceChange =
          parseFloat(current.mid.c) - parseFloat(previous.mid.c);
        const volumeChange = current.volume - previous.volume;

        // Price up with volume up = bullish confirmation
        // Price down with volume up = bearish confirmation
        if (priceChange > 0 && volumeChange > 0) bullishDivergence++;
        else if (priceChange < 0 && volumeChange > 0) bearishDivergence++;
        // Price up with volume down = potential weakness
        else if (priceChange > 0 && volumeChange < 0) bearishDivergence += 0.5;
        // Price down with volume down = potential strength
        else if (priceChange < 0 && volumeChange < 0) bullishDivergence += 0.5;
      }
    }

    if (bullishDivergence > bearishDivergence * 1.5) return "bullish";
    if (bearishDivergence > bullishDivergence * 1.5) return "bearish";
    return "neutral";
  };

  // Generate Volume Alerts
  const generateVolumeAlerts = (candles: OandaCandle[]): VolumeAlert[] => {
    if (candles.length < 20) return [];

    const alerts: VolumeAlert[] = [];
    const recent = candles.slice(-20);
    const current = candles[candles.length - 1];

    if (!current.complete || !current.mid || !current.volume) return [];

    // Calculate average volume
    const avgVolume =
      recent
        .filter((c) => c.complete && c.volume)
        .reduce((sum, c) => sum + c.volume!, 0) / recent.length;

    const currentVolume = current.volume;
    const currentPrice = parseFloat(current.mid.c);

    // High volume alert
    if (currentVolume > avgVolume * 2) {
      alerts.push({
        id: `vol_alert_${Date.now()}`,
        type: "high_volume",
        timestamp: new Date(),
        price: currentPrice,
        volume: currentVolume,
        description: `Volume spike: ${Math.round(
          (currentVolume / avgVolume) * 100
        )}% above average`,
        significance: currentVolume > avgVolume * 3 ? "high" : "medium",
      });
    }

    // Volume spike with price movement
    if (currentVolume > avgVolume * 1.5) {
      const priceChange =
        recent.length > 1
          ? currentPrice - parseFloat(recent[recent.length - 2].mid!.c)
          : 0;

      if (Math.abs(priceChange) > 0.001) {
        // Significant price movement
        alerts.push({
          id: `vol_spike_${Date.now()}`,
          type: "volume_spike",
          timestamp: new Date(),
          price: currentPrice,
          volume: currentVolume,
          description: `Volume spike with ${
            priceChange > 0 ? "bullish" : "bearish"
          } price action`,
          significance: "high",
        });
      }
    }

    return alerts;
  };

  // Calculate all volume indicators
  const calculateVolumeIndicators = (candles: OandaCandle[]) => {
    loading.value = true;

    try {
      const vwap = calculateVWAP(candles);
      const obvOBV = calculateOBV(candles);
      const adl = calculateADL(candles);
      const mfi = calculateMFI(candles);

      // Volume moving average
      const volumeMA =
        candles.length >= 20
          ? candles
              .slice(-20)
              .filter((c) => c.complete && c.volume)
              .reduce((sum, c) => sum + c.volume!, 0) / 20
          : null;

      // Current volume ratio
      const currentVolume = candles[candles.length - 1]?.volume;
      const volumeRatio =
        volumeMA && currentVolume ? currentVolume / volumeMA : null;

      const priceVolumeConfirmation = analyzePriceVolumeRelationship(candles);

      volumeIndicators.value = {
        vwap,
        obvOBV,
        adl,
        mfi,
        volumeMA,
        volumeRatio,
        priceVolumeConfirmation,
      };

      // Generate volume profile
      volumeProfile.value = generateVolumeProfile(candles);

      // Generate alerts
      const newAlerts = generateVolumeAlerts(candles);
      volumeAlerts.value = [...newAlerts, ...volumeAlerts.value].slice(0, 20); // Keep last 20 alerts
    } finally {
      loading.value = false;
    }
  };

  // Get volume strength assessment
  const volumeStrength = computed(() => {
    const { volumeRatio, mfi, priceVolumeConfirmation } =
      volumeIndicators.value;

    let strength = "neutral";
    let score = 0;

    if (volumeRatio) {
      if (volumeRatio > 1.5) score += 2;
      else if (volumeRatio > 1.2) score += 1;
      else if (volumeRatio < 0.8) score -= 1;
    }

    if (mfi) {
      if (mfi > 80) score -= 1; // Overbought
      else if (mfi < 20) score += 1; // Oversold
    }

    if (priceVolumeConfirmation === "bullish") score += 1;
    else if (priceVolumeConfirmation === "bearish") score -= 1;

    if (score >= 2) strength = "strong";
    else if (score >= 1) strength = "moderate";
    else if (score <= -2) strength = "weak";
    else if (score <= -1) strength = "declining";

    return { strength, score };
  });

  // Get Point of Control (highest volume price level)
  const pointOfControl = computed(() => {
    if (volumeProfile.value.length === 0) return null;
    return volumeProfile.value[0]; // Already sorted by volume descending
  });

  // Get Value Area (70% of volume)
  const valueArea = computed(() => {
    if (volumeProfile.value.length === 0) return null;

    const totalVolume = volumeProfile.value.reduce(
      (sum, level) => sum + level.volume,
      0
    );
    const targetVolume = totalVolume * 0.7;

    let accumulatedVolume = 0;
    const valueAreaLevels: VolumeProfile[] = [];

    for (const level of volumeProfile.value) {
      valueAreaLevels.push(level);
      accumulatedVolume += level.volume;

      if (accumulatedVolume >= targetVolume) break;
    }

    const prices = valueAreaLevels
      .map((l) => l.priceLevel)
      .sort((a, b) => a - b);

    return {
      high: prices[prices.length - 1],
      low: prices[0],
      levels: valueAreaLevels,
    };
  });

  return {
    volumeProfile: readonly(volumeProfile),
    volumeIndicators: readonly(volumeIndicators),
    volumeAlerts: readonly(volumeAlerts),
    volumeStrength,
    pointOfControl,
    valueArea,
    loading: readonly(loading),
    calculateVolumeIndicators,
    generateVolumeProfile,
    generateVolumeAlerts,
  };
};
