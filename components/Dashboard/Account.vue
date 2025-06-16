<template>

  <Card v-if="account">
    <CardHeader>
      <CardTitle class="text-2xl font-bold text-primary">Account Summary</CardTitle>
      <CardDescription>Live OANDA stats for your trading account</CardDescription>
    </CardHeader>

    <CardContent>
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
        <div>
          <p class="text-sm text-muted-foreground">Balance</p>
          <p class="text-lg font-semibold">${{ Number(account.balance).toFixed(2) }}</p>
        </div>

        <div>
          <p class="text-sm text-muted-foreground">PnL (Unrealized)</p>
          <p :class="[
            'text-lg font-semibold',
            Number(account.pl) >= 0 ? 'text-green-600' : 'text-red-600'
          ]">
            ${{ Number(account.pl).toFixed(2) }}
          </p>
        </div>

        <div>
          <p class="text-sm text-muted-foreground">NAV</p>
          <p class="text-lg font-semibold">${{ Number(account.NAV).toFixed(2) }}</p>
        </div>

        <div>
          <p class="text-sm text-muted-foreground">Margin Available</p>
          <p class="text-lg font-semibold">${{ Number(account.marginAvailable).toFixed(2) }}</p>
        </div>

        <div>
          <p class="text-sm text-muted-foreground">Open Trades</p>
          <p class="text-lg font-semibold">{{ account.openTradeCount }}</p>
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
</script>