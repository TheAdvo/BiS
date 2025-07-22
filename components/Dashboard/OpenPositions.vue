<template>
  <Card v-if="positions.length">
    <CardHeader>
      <CardTitle class="text-lg font-semibold text-primary">Open Positions</CardTitle>
      <CardDescription>Live floating PnL by pair</CardDescription>
    </CardHeader>

    <CardContent>
      <div class="space-y-4">
        <div v-for="pos in positions" :key="pos.instrument" class="flex justify-between items-center">
          <div>
            <p class="text-sm font-medium text-muted-foreground">{{ pos.instrument }}</p>
            <p class="text-xs text-muted-foreground">{{ pos.units > 0 ? 'Long' : 'Short' }} {{ Math.abs(pos.units) }} units</p>
          </div>
          <div :class="[
            'text-sm font-bold',
            pos.pl >= 0 ? 'text-green-600' : 'text-red-600'
          ]">
            ${{ Number(pos.pl).toFixed(2) }}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
const { data } = useOandaAccount();
const account = computed(() => data.value);

// Extract and flatten long/short positions
const positions = computed(() => {
  if (!account.value?.positions) return [];

  return account.value.positions.flatMap((pos: any) => {
    const result = [];

    if (Number(pos.long.units) !== 0) {
      result.push({
        instrument: pos.instrument,
        units: Number(pos.long.units),
        pl: Number(pos.long.pl),
      });
    }

    if (Number(pos.short.units) !== 0) {
      result.push({
        instrument: pos.instrument,
        units: Number(pos.short.units),
        pl: Number(pos.short.pl),
      });
    }

    return result;
  });
});
</script>
