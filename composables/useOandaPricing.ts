// composables/useOandaPricing.ts
import { ref, computed, watch } from 'vue'
import type { PriceMessage } from '@/types/Oanda'

/**
 * useOandaPricing composable
 * - Fetches and auto-refreshes OANDA pricing for one or more instruments
 * - Returns a reactive price for a single instrument, or prices[] for a list
 * - No streaming, but fast polling for near-real-time updates
 */
export function useOandaPricing(instrumentRef: any) {
  // Accepts a ref or string
  const instrument = computed(() => typeof instrumentRef === 'string' ? instrumentRef : instrumentRef.value)
  const price = ref<PriceMessage | null>(null)
  const error = ref<string | null>(null)
  const pending = ref(false)
  let timer: ReturnType<typeof setInterval> | null = null

  // Fetch price for the current instrument
  const fetchPrice = async () => {
    if (!instrument.value) return
    pending.value = true
    try {
      const res = await $fetch<{ prices: PriceMessage[] }>('/api/oanda/pricing', {
        query: { instruments: instrument.value }
      })
      price.value = res.prices?.[0] || null
      error.value = null
    } catch (e: any) {
      error.value = e?.message || 'Failed to fetch price'
      price.value = null
    } finally {
      pending.value = false
    }
  }

  // Subscribe: start polling every 500ms (OANDA streaming-like responsiveness)
  const subscribe = () => {
    fetchPrice()
    if (timer) clearInterval(timer)
    timer = setInterval(fetchPrice, 500)
  }

  // Unsubscribe: stop polling
  const unsubscribe = () => {
    if (timer) clearInterval(timer)
    timer = null
  }

  // React to instrument changes
  watch(instrument, () => {
    fetchPrice()
  })

  return {
    price,
    pending,
    error,
    subscribe,
    unsubscribe
  }
}
