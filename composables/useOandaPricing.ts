// composables/useOandaPricing.ts
import { ref, computed, watch } from "vue";
import type { PriceMessage } from "@/types/Oanda";

/**
 * useOandaPricing composable (SSE streaming)
 * - Streams OANDA pricing for a single instrument using EventSource
 * - Returns a reactive price, error, and pending state
 * - Provides subscribe/unsubscribe for manual control
 * - Automatically resubscribes on instrument change
 *
 * KISS: Simple, robust, and well-commented
 */
export function useOandaPricing(instrumentRef: any) {
  // Instrument can be a ref or string
  const instrument = computed(() =>
    typeof instrumentRef === "string" ? instrumentRef : instrumentRef.value
  );
  const price = ref<PriceMessage | null>(null);
  const error = ref<string | null>(null);
  const pending = ref(false);
  let eventSource: EventSource | null = null;

  /**
   * Subscribe to OANDA price stream for the current instrument
   * Opens SSE connection and updates price reactively
   */
  const subscribe = () => {
    unsubscribe(); // Always clean up previous connection
    if (!instrument.value) return;
    pending.value = true;
    const url = `/api/oanda/price-stream?instruments=${encodeURIComponent(
      instrument.value
    )}`;
    eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Only update price if type is PRICE
        if (data.type === "PRICE") {
          price.value = data;
          error.value = null;
        }
      } catch (e: any) {
        error.value = "Parse error: " + (e?.message || e);
      }
      pending.value = false;
    };

    eventSource.onerror = () => {
      error.value = "Streaming error";
      pending.value = false;
    };
  };

  /**
   * Unsubscribe from OANDA price stream
   * Closes SSE connection
   */
  const unsubscribe = () => {
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };

  // Auto-resubscribe when instrument changes
  watch(instrument, () => {
    subscribe();
  });

  // Return reactive state and controls
  return {
    price, // Latest price message (reactive)
    pending, // Is stream pending?
    error, // Error message (if any)
    subscribe, // Manually start stream
    unsubscribe, // Manually stop stream
  };
}
