<template>
  <div class="w-full h-[400px]">
    <Card v-if="account" class="h-full border-0 shadow-lg bg-card/50 backdrop-blur">
      <CardHeader class="pb-3 border-b">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <CardTitle class="text-base font-bold">Account Summary</CardTitle>
            <Badge :variant="account.alias?.includes('live') ? 'default' : 'secondary'" class="text-xs">
              {{ account.alias?.includes('live') ? 'Live' : 'Demo' }}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent class="overflow-y-auto h-[320px] p-3">
        <div class="space-y-3">
          <!-- Key Metrics -->
          <div class="grid grid-cols-2 gap-3">
            <div class="p-3 rounded-lg bg-muted/30">
              <div class="text-xs text-muted-foreground uppercase tracking-wide">Balance</div>
              <div class="text-lg font-bold flex items-center gap-1">
                <span>{{ getFlag(account.currency) }}</span>
                {{ formattedAccount?.balance }}
              </div>
            </div>
            <div class="p-3 rounded-lg bg-muted/30">
              <div class="text-xs text-muted-foreground uppercase tracking-wide">PnL</div>
              <div class="text-lg font-bold" :class="Number(account.pl) >= 0 ? 'text-green-500' : 'text-red-500'">
                {{ formattedAccount?.pl }}
                <span v-if="previousPL !== null" class="text-xs ml-1">
                  <span v-if="Number(account.pl) > previousPL" class="text-green-500">▲</span>
                  <span v-else-if="Number(account.pl) < previousPL" class="text-red-500">▼</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Account Details -->
          <div class="space-y-2 text-sm">
            <div class="flex items-center justify-between py-1">
              <span class="text-muted-foreground">NAV</span>
              <span class="font-medium">{{ formattedAccount?.NAV }}</span>
            </div>
            <div class="flex items-center justify-between py-1">
              <span class="text-muted-foreground">Margin Used</span>
              <span class="font-medium">{{ formattedAccount?.marginUsed }}</span>
            </div>
            <div class="flex items-center justify-between py-1">
              <span class="text-muted-foreground">Margin Available</span>
              <span class="font-medium">{{ formattedAccount?.marginAvailable }}</span>
            </div>
            <div class="flex items-center justify-between py-1">
              <span class="text-muted-foreground">Open Trades</span>
              <span class="font-medium">{{ account.openTradeCount }}</span>
            </div>
            <div class="flex items-center justify-between py-1">
              <span class="text-muted-foreground">Leverage</span>
              <span class="font-medium">{{ formattedAccount?.leverage }}</span>
            </div>
          </div>

          <!-- Account ID -->
          <div class="border-t pt-3">
            <div class="flex items-center justify-between">
              <span class="text-xs text-muted-foreground">Account #</span>
              <div class="flex items-center gap-2">
                <span class="text-xs font-mono">{{ formattedAccount?.accountId }}</span>
                <Button variant="ghost" size="sm" class="h-6 w-6 p-0" @click="copyAccountId">
                  <Icon name="lucide:copy" class="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
    <Skeleton v-else-if="pending" class="w-full px-4 py-6">
      <Skeleton class="w-1/3 h-4 mb-4" />
      <Skeleton class="w-2/3 h-6 mb-4" />
      <Skeleton class="w-1/2 h-4 mb-4" />
      <Skeleton class="w-2/3 h-6 mb-4" />
      <Skeleton class="w-1/3 h-4 mb-4" />
    </Skeleton>
    <div v-else-if="!pending && !error" class="text-muted-foreground mt-4">
      No account data available.
    </div>
    <div class="mt-4">
      <p v-if="error" class="text-sm text-red-600">Error: {{ error.message }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { OandaAccount } from '@/types/Oanda'

const { data, pending, error } = useOandaAccount();
const account = computed<OandaAccount | null>(() => data.value ?? null);

/**
 * Calculates account leverage as a ratio (e.g., "20:1").
 * Returns "—" if values are invalid.
 * @param used - Margin used (string)
 * @param value - Position value (string)
 * @returns {string} Leverage ratio or "—"
 */
const calculateLeverage = (used: string, value: string): string => {
  const marginUsed = parseFloat(used);
  const positionValue = parseFloat(value);

  if (marginUsed === 0 || isNaN(marginUsed) || isNaN(positionValue)) return '—';
  const leverage = positionValue / marginUsed;
  return `${Math.round(leverage)}:1`;
};

/**
 * Formats a number or string as USD currency.
 * Returns "—" if value is not a valid number.
 * @param value - The value to format
 * @returns {string} Formatted currency string
 */
const formatCurrency = (value: string | number): string =>
  isNaN(Number(value)) ? '—' : `$${Number(value).toFixed(2)}`;

/**
 * Returns formatted account data for display.
 */
const formattedAccount = computed(() => {
  if (!account.value) return null;
  return {
    balance: formatCurrency(account.value.balance),
    pl: formatCurrency(account.value.pl),
    NAV: formatCurrency(account.value.NAV),
    resettablePL: formatCurrency(account.value.resettablePL),
    positionValue: formatCurrency(account.value.positionValue),
    marginUsed: formatCurrency(account.value.marginUsed),
    marginAvailable: formatCurrency(account.value.marginAvailable),
    openTradeCount: account.value.openTradeCount,
    leverage: calculateLeverage(account.value.marginUsed, account.value.positionValue),
    accountId: account.value.accountID || '—', // Only use accountID
  };
});

watch(() => account.value?.pl, (_, oldPL) => {
  if (typeof oldPL === 'number') previousPL.value = oldPL
})

const getFlag = (currency: string): string => {
  const flags: Record<string, string> = {
    USD: '🇺🇸',
    EUR: '🇪🇺',
    GBP: '🇬🇧',
    JPY: '🇯🇵',
    AUD: '🇦🇺',
    CAD: '🇨🇦',
    CHF: '🇨🇭',
    NZD: '🇳🇿',
  }
  return flags[currency] || ''
}

const previousPL = ref<number | null>(null)
watch(() => account.value?.pl, (newPL, oldPL) => {
  if (typeof oldPL === 'number') previousPL.value = oldPL
})

const copyAccountId = async () => {
  const id = formattedAccount.value?.accountId;
  if (id && id !== '—') {
    try {
      await navigator.clipboard.writeText(id);
    } catch (e) {
      alert('Failed to copy account ID');
    }
  }
}
</script>
