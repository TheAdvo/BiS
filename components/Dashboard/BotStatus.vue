<template>
  <Card class="w-full text-muted-foreground">
    <CardHeader>
      <CardTitle>
        <div class="text-2xl font-bold text-primary">Bot Status</div>
      </CardTitle>
      <CardDescription>Live logs from the trade automation bot.</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="bg-muted font-mono h-64 overflow-y-auto p-2 text-xs">
        <div v-for="(log, index) in logs" :key="index">{{ log }}</div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const logs = ref<string[]>([])
let sse: EventSource | null = null

onMounted(() => {
  sse = new EventSource('/api/logs')

  sse.onmessage = (event: MessageEvent) => {
    logs.value.unshift(event.data)
    if (logs.value.length > 50) {
      logs.value.pop()
    }
  }

  sse.onerror = (err) => {
    console.error('SSE connection error:', err)
    if (sse) sse.close()
  }
})

onUnmounted(() => {
  if (sse) sse.close()
})
</script>
