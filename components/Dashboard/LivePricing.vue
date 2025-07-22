<template>
  <Card class="w-full text-muted-foreground">
    <CardHeader>
      <CardTitle>
        <div class="text-2xl font-bold text-primary">Live Pricing</div>
      </CardTitle>
      <CardDescription>Live OANDA pricing for defined pairs.</CardDescription>
    </CardHeader>
    <CardContent>
      <div v-if="error" class="text-destructive p-2">{{ error }}</div>
      <div v-else-if="Object.keys(prices).length === 0">Waiting for live prices...</div>
      <div v-else v-for="(price, pair) in prices" :key="pair">
        <div class="text-sm text-muted-foreground">{{ pair }}</div>
        <div class="font-mono p-2 text-sm text-secondary">Bid: {{ price.bids?.[0]?.price }} / Ask: {{ price.asks?.[0]?.price }}</div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface PriceMessage {
  type: string
  instrument: string
  bids: Array<{ price: string }>
  asks: Array<{ price: string }>
}

const prices = ref<Record<string, PriceMessage>>({})
const error = ref<string | null>(null)
let sse: EventSource | null = null

onMounted(() => {
  sse = new EventSource('/api/oanda/pricing-stream')

  sse.onmessage = (event: MessageEvent) => {
    const raw = event.data.trim()
    try {
      const msg = JSON.parse(raw)
      if (msg.type === 'PRICE') {
        prices.value[msg.instrument] = msg
      }
    } catch (e) {
      // Ignore junk lines
    }
  }

  sse.onerror = (err) => {
    error.value = 'SSE connection error. Please refresh.'
    console.error('SSE connection error:', err)
    if (sse) sse.close()
  }
})

onUnmounted(() => {
  if (sse) sse.close()
})
</script>
