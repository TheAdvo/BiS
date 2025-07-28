<template>
  <div class="w-full h-[400px]">
    <Card class="h-full">
      <CardHeader class="pb-3 border-b">
        <div class="flex items-center justify-between">
          <CardTitle class="text-base font-bold flex items-center gap-2">
            <span>Live Pricing</span>
            <Badge variant="outline" class="text-xs">
              <div class="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
              Live
            </Badge>
          </CardTitle>
          <div class="text-xs text-muted-foreground">8 pairs</div>
        </div>
      </CardHeader>
      <CardContent class="overflow-y-auto h-[320px] p-0">
        <!-- Pricing List -->
        <div class="divide-y divide-border">
          <div v-for="pair in mockPairs" :key="pair.name" class="flex items-center justify-between px-3 py-3 hover:bg-accent/50 transition-colors cursor-pointer">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-xs font-medium">
                {{ pair.flag }}
              </div>
              <div>
                <div class="text-sm font-medium">{{ pair.name }}</div>
                <div class="text-xs text-muted-foreground">{{ pair.description }}</div>
              </div>
            </div>

            <div class="text-right">
              <div class="text-sm font-medium">{{ pair.price }}</div>
              <div class="text-xs" :class="pair.change > 0 ? 'text-green-500' : 'text-destructive'">
                {{ pair.change > 0 ? '+' : '' }}{{ pair.change }}%
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Mock data for demonstration
const mockPairs = ref([
  { name: 'EUR/USD', description: 'Euro / US Dollar', price: '1.0845', change: 0.12, flag: '🇪🇺' },
  { name: 'GBP/USD', description: 'British Pound / US Dollar', price: '1.2634', change: -0.08, flag: '🇬🇧' },
  { name: 'USD/JPY', description: 'US Dollar / Japanese Yen', price: '149.32', change: 0.23, flag: '🇺🇸' },
  { name: 'AUD/USD', description: 'Australian Dollar / US Dollar', price: '0.6723', change: -0.15, flag: '🇦🇺' },
  { name: 'USD/CHF', description: 'US Dollar / Swiss Franc', price: '0.8912', change: 0.09, flag: '🇺🇸' },
  { name: 'NZD/USD', description: 'New Zealand Dollar / US Dollar', price: '0.6145', change: -0.21, flag: '🇳🇿' },
  { name: 'USD/CAD', description: 'US Dollar / Canadian Dollar', price: '1.3456', change: 0.18, flag: '🇺🇸' },
  { name: 'XAU/USD', description: 'Gold / US Dollar', price: '2045.30', change: 0.34, flag: '🥇' }
])
</script>
