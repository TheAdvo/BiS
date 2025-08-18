<template>
  <Card>
    <CardHeader class="flex items-center justify-between">
      <CardTitle class="text-sm">MA Crossover Bot</CardTitle>
      <Badge variant="outline">SMA</Badge>
    </CardHeader>
    <CardContent>
      <div class="space-y-2">
        <div class="text-sm text-muted-foreground">Instrument</div>
        <input v-model="instrumentLocal" class="input input-sm w-full" />

        <div class="flex gap-2">
          <div class="flex-1">
            <div class="text-sm text-muted-foreground">Short</div>
            <input type="number" v-model.number="shortLocal" class="input input-sm w-full" />
          </div>
          <div class="flex-1">
            <div class="text-sm text-muted-foreground">Long</div>
            <input type="number" v-model.number="longLocal" class="input input-sm w-full" />
          </div>
        </div>

        <div class="flex items-center gap-2">
          <Button size="sm" @click="toggleRunning">{{ (bot.isRunning as any).value ? 'Stop' : 'Start' }}</Button>
          <Button variant="outline" size="sm" @click="doPoll">Poll</Button>
          <Button variant="ghost" size="sm" @click="doBacktest">Backtest</Button>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-sm text-muted-foreground">Auto-poll</label>
          <input type="checkbox" v-model="autoPoll" class="checkbox" />
          <label class="text-sm text-muted-foreground">Interval (s)</label>
          <input type="number" v-model.number="pollIntervalSec" min="1" class="input input-sm w-20" />
        </div>

        <div v-if="lastSignal" class="text-sm">
          Last signal: <strong :class="lastSignal === 'buy' ? 'text-green-500' : 'text-destructive'">{{ lastSignal }}</strong>
        </div>

        <div v-if="backtestResults && backtestResults.length">
          <div class="text-sm font-medium">Backtest Results</div>
          <ul class="text-xs list-disc pl-5 max-h-40 overflow-auto">
            <li v-for="(t, idx) in backtestResults" :key="idx">{{ t.time }} — {{ t.signal }} @ {{ t.price }}</li>
          </ul>
        </div>

        <!-- Mini console / debug log -->
        <div class="mt-2">
          <div class="flex items-center justify-between mb-1">
            <div class="text-sm font-medium">Bot Console</div>
            <div class="flex items-center gap-2">
              <Button size="sm" variant="ghost" @click="clearLog">Clear</Button>
            </div>
          </div>
          <div class="bg-black bg-opacity-5 rounded p-2 text-xs font-mono max-h-40 overflow-auto">
            <div v-if="!logEntries.length" class="text-muted-foreground">No entries yet</div>
            <div v-for="(e, i) in logEntries" :key="e.ts + i" class="mb-2">
              <div class="flex items-center justify-between">
                <div class="text-[10px] text-muted-foreground">{{ e.ts }}</div>
                <div class="text-[11px]">
                  <span v-if="e.payload?.summary?.signal" :class="e.payload.summary.signal === 'buy' ? 'text-green-500' : 'text-destructive'" class="font-medium">{{ e.payload.summary.signal }}</span>
                  <span class="ml-2">{{ e.payload?.summary?.price ?? '' }}</span>
                </div>
              </div>
              <div class="text-[11px]">
                <div>index: {{ e.payload?.summary?.index ?? '—' }}</div>
                <div>shortNow: {{ e.payload?.summary?.shortNow ?? '—' }} • longNow: {{ e.payload?.summary?.longNow ?? '—' }}</div>
                <div>shortPrev: {{ e.payload?.summary?.shortPrev ?? '—' }} • longPrev: {{ e.payload?.summary?.longPrev ?? '—' }}</div>
                <div v-if="e.payload?.summary?.closesLast">closes(last 8): {{ (e.payload.summary.closesLast).join(', ') }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useMaCrossoverBot } from '@/composables/useMaCrossoverBot'

const bot = useMaCrossoverBot()
import { computed } from 'vue'
const lastSignal = computed(() => (bot.lastSignal as any).value)
// initialize local primitives from bot's refs
const instrumentLocal = ref((bot.instrument as any).value || 'EUR_USD')
const shortLocal = ref((bot.shortPeriod as any).value || 9)
const longLocal = ref((bot.longPeriod as any).value || 21)
const backtestResults = ref<any[] | null>(null)
const logEntries = ref<any[]>([])
const isPolling = ref(false)
const autoPoll = ref(false)
const pollIntervalSec = ref(10)
let pollTimer: ReturnType<typeof setInterval> | null = null

function formatNum(n: number | undefined | null) {
  if (n === null || n === undefined || !isFinite(n)) return '—'
  return Number(n).toFixed(5)
}

function formatArray(arr: number[] | undefined | null) {
  if (!arr || !Array.isArray(arr)) return ''
  return arr.map((n: number) => Number(n).toFixed(5)).join(', ')
}

function pushLog(entry: any) {
  logEntries.value.unshift({ ts: new Date().toISOString(), ...entry })
  // keep only the last 200 entries
  if (logEntries.value.length > 200) logEntries.value.splice(200)
}

async function doPoll() {
  if (isPolling.value) {
    pushLog({ type: 'error', payload: { message: 'poll skipped: already running' } })
    return
  }
  isPolling.value = true
  try {
    // sync local values into bot's refs
    if ((bot.instrument as any).value !== undefined) (bot.instrument as any).value = instrumentLocal.value
    if ((bot.shortPeriod as any).value !== undefined) (bot.shortPeriod as any).value = shortLocal.value
    if ((bot.longPeriod as any).value !== undefined) (bot.longPeriod as any).value = longLocal.value

    const raw = (bot as any).pollWithDebug ? await (bot as any).pollWithDebug() : await bot.pollOnce()
    if (!raw) {
      pushLog({ type: 'poll', payload: { summary: { message: 'no data' } } })
      return
    }

    // Build a compact summary for readability with fallbacks from raw arrays
    const rawCloses: number[] = raw.closes || []
    const rawShort: number[] = raw.short || []
    const rawLong: number[] = raw.long || []
    const idx = raw.index ?? (rawCloses.length ? rawCloses.length - 1 : null)

    function lastFinite(arr: number[] | undefined | null, i: number | null) {
      if (!arr || arr.length === 0 || i === null || i === undefined) return null
      let j = Math.min(i, arr.length - 1)
      for (; j >= 0; j--) {
        const v = arr[j]
        if (isFinite(v)) return v
      }
      return null
    }

    const shortNowVal = isFinite(raw.shortNow) ? raw.shortNow : lastFinite(rawShort, idx)
    const longNowVal = isFinite(raw.longNow) ? raw.longNow : lastFinite(rawLong, idx)
    const shortPrevVal = isFinite(raw.shortPrev) ? raw.shortPrev : lastFinite(rawShort, (idx === null ? null : idx - 1))
    const longPrevVal = isFinite(raw.longPrev) ? raw.longPrev : lastFinite(rawLong, (idx === null ? null : idx - 1))

    const summary: any = {
      signal: raw.signal || null,
      price: typeof raw.price === 'number' && isFinite(raw.price) ? Number(raw.price).toFixed(5) : null,
      time: raw.time || null,
      index: idx !== null ? idx : '—',
      shortNow: shortNowVal !== null && shortNowVal !== undefined && isFinite(shortNowVal) ? Number(shortNowVal).toFixed(5) : '—',
      longNow: longNowVal !== null && longNowVal !== undefined && isFinite(longNowVal) ? Number(longNowVal).toFixed(5) : '—',
      shortPrev: shortPrevVal !== null && shortPrevVal !== undefined && isFinite(shortPrevVal) ? Number(shortPrevVal).toFixed(5) : '—',
      longPrev: longPrevVal !== null && longPrevVal !== undefined && isFinite(longPrevVal) ? Number(longPrevVal).toFixed(5) : '—',
      closesLast: rawCloses ? rawCloses.slice(-8).map((n: number) => Number(n).toFixed(5)) : []
    }

    // push a compact entry and keep a small raw snapshot
    pushLog({ type: 'poll', payload: { summary, raw: { closes: raw.closes ? raw.closes.slice(-40) : [], short: raw.short ? raw.short.slice(-40) : [], long: raw.long ? raw.long.slice(-40) : [] } } })

  } catch (err: any) {
    pushLog({ type: 'error', payload: { message: String(err?.message || err) } })
  } finally {
    isPolling.value = false
  }
}

function toggleRunning() {
  if ((bot.isRunning as any).value) {
    bot.stop()
  } else {
    bot.start()
  }
}

// auto-poll management
function startAutoPoll() {
  stopAutoPoll()
  pollTimer = setInterval(() => {
    doPoll()
  }, Math.max(1000, pollIntervalSec.value * 1000))
}

function stopAutoPoll() {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

import { watch, onUnmounted } from 'vue'
watch([autoPoll, pollIntervalSec], ([enabled]) => {
  if (enabled) startAutoPoll()
  else stopAutoPoll()
})
onUnmounted(() => stopAutoPoll())

async function doBacktest() {
  // fetch a larger candle set for backtest
  const data = await (await import('@/stores/oanda')).useOandaStore().getCandlesData(instrumentLocal.value, 'H1', 500)
  backtestResults.value = bot.backtest(data.candles || [], shortLocal.value, longLocal.value)
}

function clearLog() {
  logEntries.value = []
}
</script>
