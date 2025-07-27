<template>
  <div class="w-full h-[500px]">
    <Card class="h-full">
      <CardHeader class="pb-3 border-b">
        <div class="flex items-center justify-between">
          <CardTitle class="text-base font-bold flex items-center gap-2">
            <Briefcase class="w-4 h-4" />
            <span>Open Positions</span>
            <Badge variant="outline" class="text-xs">
              <div class="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></div>
              Live
            </Badge>
          </CardTitle>
          <div class="text-xs text-muted-foreground">3 active positions</div>
        </div>
      </CardHeader>
      <CardContent class="overflow-y-auto h-[430px] p-0">
        <!-- Table Header -->
        <div class="sticky top-0 bg-card border-b">
          <div class="grid grid-cols-7 gap-4 px-4 py-3 text-xs font-medium text-muted-foreground">
            <div>Instrument</div>
            <div>Side</div>
            <div>Size</div>
            <div>Entry Price</div>
            <div>Current Price</div>
            <div>P&L</div>
            <div>Actions</div>
          </div>
        </div>

        <!-- Positions List -->
        <div class="divide-y divide-border">
          <div v-for="position in mockPositions" :key="position.id" class="grid grid-cols-7 gap-4 px-4 py-4 hover:bg-accent/50 transition-colors">
            <!-- Instrument -->
            <div class="flex items-center gap-2">
              <span class="text-lg">{{ position.flag }}</span>
              <div>
                <div class="font-medium text-sm">{{ position.instrument }}</div>
                <div class="text-xs text-muted-foreground">{{ position.description }}</div>
              </div>
            </div>

            <!-- Side -->
            <div>
              <Badge :variant="position.side === 'LONG' ? 'default' : 'destructive'" class="text-xs">
                {{ position.side }}
              </Badge>
            </div>

            <!-- Size -->
            <div class="text-sm font-mono">{{ position.size }}</div>

            <!-- Entry Price -->
            <div class="text-sm font-mono">{{ position.entryPrice }}</div>

            <!-- Current Price -->
            <div class="text-sm font-mono">{{ position.currentPrice }}</div>

            <!-- P&L -->
            <div class="text-sm font-mono" :class="position.pnl >= 0 ? 'text-green-500' : 'text-red-500'">
              {{ position.pnl >= 0 ? '+' : '' }}${{ position.pnl.toFixed(2) }}
            </div>

            <!-- Actions -->
            <div class="flex items-center gap-2">
              <Button variant="outline" size="sm" class="h-6 px-2 text-xs">
                Close
              </Button>
              <Button variant="ghost" size="sm" class="h-6 w-6 p-0">
                <Settings class="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="mockPositions.length === 0" class="flex flex-col items-center justify-center h-32 text-center">
          <Briefcase class="w-8 h-8 text-muted-foreground mb-2" />
          <p class="text-sm text-muted-foreground">No open positions</p>
          <Button variant="outline" size="sm" class="mt-2">
            Start Trading
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Briefcase, Settings } from 'lucide-vue-next'
import { ref } from 'vue'

// Mock positions data
const mockPositions = ref([
  {
    id: 1,
    instrument: 'EUR/USD',
    description: 'Euro / US Dollar',
    flag: '🇪🇺🇺🇸',
    side: 'LONG',
    size: '100,000',
    entryPrice: '1.0842',
    currentPrice: '1.0855',
    pnl: 130.00
  },
  {
    id: 2,
    instrument: 'GBP/USD',
    description: 'British Pound / US Dollar',
    flag: '🇬🇧🇺🇸',
    side: 'SHORT',
    size: '50,000',
    entryPrice: '1.2645',
    currentPrice: '1.2634',
    pnl: 55.00
  },
  {
    id: 3,
    instrument: 'USD/JPY',
    description: 'US Dollar / Japanese Yen',
    flag: '🇺🇸🇯🇵',
    side: 'LONG',
    size: '75,000',
    entryPrice: '149.25',
    currentPrice: '149.18',
    pnl: -52.50
  }
])
</script>
