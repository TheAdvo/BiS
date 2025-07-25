<template>
  <Card v-if="account">
    <CardHeader>
      <div class="flex items-center gap-2">
        <CardTitle class="text-2xl font-bold text-primary">Account Summary</CardTitle>
        <Badge :variant="account.alias?.includes('live') ? 'default' : 'secondary'">
          {{ account.alias?.includes('live') ? 'Live' : 'Demo' }}
        </Badge>
      </div>
      <CardDescription>Live OANDA stats for your trading account</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="overflow-x-auto w-full">
        <Table>
          <caption class="sr-only">OANDA Account Summary Table</caption>
          <TableBody>
            <TableRow>
              <TableCell scope="row" class="font-medium text-muted-foreground">Balance</TableCell>
              <TableCell>
                <span class="mr-1">{{ getFlag(account.currency) }}</span>
                {{ formattedAccount?.balance }}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row" class="font-medium text-muted-foreground">PnL (Unrealized)</TableCell>
              <TableCell :class="Number(account.pl) >= 0 ? 'text-primary' : 'text-destructive'">
                {{ formattedAccount?.pl }}
                <span v-if="previousPL !== null">
                  <span v-if="Number(account.pl) > previousPL" class="text-primary">▲</span>
                  <span v-else-if="Number(account.pl) < previousPL" class="text-destructive">▼</span>
                </span>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row" class="font-medium text-muted-foreground">NAV</TableCell>
              <TableCell>{{ formattedAccount?.NAV }}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row" class="font-medium text-muted-foreground">Realized PnL</TableCell>
              <TableCell class="text-primary">{{ formattedAccount?.resettablePL }}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row" class="font-medium text-muted-foreground">Position Value</TableCell>
              <TableCell>{{ formattedAccount?.positionValue }}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row" class="font-medium text-muted-foreground">Margin Used</TableCell>
              <TableCell>{{ formattedAccount?.marginUsed }}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row" class="font-medium text-muted-foreground">Margin Available</TableCell>
              <TableCell>{{ formattedAccount?.marginAvailable }}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell scope="row" class="font-medium text-muted-foreground">Open Trades</TableCell>
              <TableCell>{{ account.openTradeCount }}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row" class="font-medium text-muted-foreground">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger as-child>
                      <span>Leverage</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Leverage is the ratio of your position value to margin used. Example: "20:1" means $20 position for every $1 margin.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell>{{ formattedAccount?.leverage }}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell scope="row" class="font-medium text-muted-foreground">Account #</TableCell>
              <TableCell>
                <span>{{ formattedAccount?.accountId }}</span>
                <button @click="copyAccountId" class="ml-2 px-2 py-1 rounded bg-accent text-accent-foreground text-xs" title="Copy Account Number">Copy</button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
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
</template>

<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableRow, TableCell } from '@/components/ui/table'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
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
