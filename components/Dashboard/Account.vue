<template>
  <Card v-if="account">
    <CardHeader>
      <CardTitle class="text-2xl font-bold text-primary">Account Summary</CardTitle>
      <CardDescription>Live OANDA stats for your trading account</CardDescription>
    </CardHeader>

    <CardContent class="font-mono">
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
        <div>
          <p class="text-sm text-muted-foreground">Balance</p>
          <p class="text-lg">${{ Number(account.balance).toFixed(2) }}</p>
        </div>

        <div>
          <p class="text-sm text-muted-foreground">PnL (Unrealized)</p>
          <p :class="['text-lg', Number(account.pl) >= 0 ? 'text-green-600' : 'text-destructive']">
            ${{ Number(account.pl).toFixed(2) }}
          </p>
        </div>

        <div>
          <p class="text-sm text-muted-foreground">NAV</p>
          <p class="text-lg">${{ Number(account.NAV).toFixed(2) }}</p>
        </div>

        <div>
          <p class="text-sm text-muted-foreground">Realized PnL</p>
          <p class="text-lg text-primary">${{ Number(account.resettablePL).toFixed(2) }}</p>
        </div>

        <div>
          <p class="text-sm text-muted-foreground">Position Value</p>
          <p class="text-lg">${{ Number(account.positionValue).toFixed(2) }}</p>
        </div>

        <div>
          <p class="text-sm text-muted-foreground">Margin Used</p>
          <p class="text-lg">${{ Number(account.marginUsed).toFixed(2) }}</p>
        </div>

        <div>
          <p class="text-sm text-muted-foreground">Margin Available</p>
          <p class="text-lg">${{ Number(account.marginAvailable).toFixed(2) }}</p>
        </div>

        <div>
          <p class="text-sm text-muted-foreground">Open Trades</p>
          <p class="text-lg">{{ account.openTradeCount }}</p>
        </div>

        <div>
          <p class="text-sm text-muted-foreground">Leverage</p>
          <p class="text-lg">
            {{
              calculateLeverage(account.marginUsed, account.positionValue)
            }}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>

  <div class="mt-4">
    <p v-if="pending" class="text-sm text-muted-foreground">Loading account...</p>
    <p v-if="error" class="text-sm text-red-600">Error: {{ error.message }}</p>
  </div>
</template>

<script setup lang="ts">
const { data, pending, error } = useOandaAccount();
const account = computed(() => data.value);

const calculateLeverage = (used: string, value: string) => {
  const marginUsed = parseFloat(used);
  const positionValue = parseFloat(value);

  if (marginUsed === 0 || isNaN(marginUsed) || isNaN(positionValue)) return '—';
  const leverage = positionValue / marginUsed;
  return `${Math.round(leverage)}:1`;
};
</script>
