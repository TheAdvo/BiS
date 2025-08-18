<template>
  <Card class="mb-4">
    <CardHeader class="flex items-center justify-between gap-4">
      <div>
        <div class="text-xs text-muted-foreground">Account</div>
        <div class="flex gap-4 items-baseline">
          <span class="font-semibold text-sm">{{ id || '—' }}</span>
          <span class="text-sm">${{ formatBalance(balance) }} <span class="text-xs text-muted-foreground">{{ currency }}</span></span>
        </div>
      </div>

      <div class="text-right">
        <template v-if="loading">
          <span class="text-sm text-muted">Loading account...</span>
        </template>
        <template v-else-if="error">
          <span class="text-sm text-error">Error: {{ error }}</span>
        </template>
        <template v-else-if="id">
          <span class="text-sm text-primary">Connected</span>
        </template>
      </div>
    </CardHeader>
    <CardContent class="pt-0">
      <!-- Placeholder for quick actions or summary stats -->
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { useAccountStore } from '@/stores/account'
import { storeToRefs } from 'pinia'

const accountStore = useAccountStore()
const { id, balance, currency, positions, loading, error } = storeToRefs(accountStore)

const unrealizedPL = computed(() => {
  const ps = positions.value ?? []
  try {
    return ps.reduce((acc: number, p: any) => acc + (Number(p.unrealizedPL ?? p.unrealized_profit ?? 0) || 0), 0)
  } catch {
    return 0
  }
})

const equity = computed(() => {
  const b = Number(balance.value ?? 0)
  return Number((b + (unrealizedPL.value ?? 0)).toFixed(2))
})

const buyingPower = computed(() => Math.round(equity.value * 10))

function formatBalance(bal: number | string | { value?: number }) {
  const raw = typeof bal === 'number' ? bal : (bal && typeof bal === 'object' ? bal.value ?? 0 : parseFloat(String(bal)))
  if (!isFinite(Number(raw))) return String(bal)
  return new Intl.NumberFormat(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(raw))
}
</script>

<style scoped>
/* small visual tweak if needed */
</style>
