// composables/useOandaPricing.ts
import { ref, computed, watch } from 'vue'
import type { PriceMessage } from '@/types/Oanda'

/**
 * useOandaPricing composable (SSE streaming version)
 * - Streams OANDA pricing for one or more instruments using EventSource
 * - Returns a reactive price for a single instrument
 */
export function useOandaPricing(instrumentRef: any) {
  const instrument = computed(() => typeof instrumentRef === 'string' ? instrumentRef : instrumentRef.value)
  const price = ref<PriceMessage | null>(null)
  const error = ref<string | null>(null)
  const pending = ref(false)
  let eventSource: EventSource | null = null

  // Subscribe: open SSE connection to /api/oanda/price-stream
  const subscribe = () => {
    unsubscribe()
    if (!instrument.value) return
    pending.value = true
    const url = `/api/oanda/price-stream?instruments=${encodeURIComponent(instrument.value)}`
    eventSource = new EventSource(url)

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        // Only update price if type is PRICE
        if (data.type === 'PRICE') {
          price.value = data
          error.value = null
        }
      } catch (e: any) {
        error.value = 'Parse error: ' + (e?.message || e)
      }
      pending.value = false
    }

    eventSource.onerror = (event) => {
      error.value = 'Streaming error'
      pending.value = false
    }
  }

  // Unsubscribe: close SSE connection
  const unsubscribe = () => {
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }
  }

  // React to instrument changes
  watch(instrument, () => {
    subscribe()
  })

  return {
    price,
    pending,
    error,
    subscribe,
    unsubscribe
  }
}
