<template>
  <div class="w-full h-[600px]">
    <Card class="h-full">
      <CardHeader class="pb-3 border-b">
        <div class="flex items-center justify-between">
          <CardTitle class="text-base font-bold flex items-center gap-2">
            <TrendingUp class="w-4 h-4" />
            <span>Recent Trades</span>
          </CardTitle>
          <div class="flex items-center gap-2">
            <select class="px-2 py-1 text-xs border border-border rounded bg-background">
              <option value="all">All Status</option>
              <option value="filled">Filled</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <Button variant="outline" size="sm" class="h-7 px-2 text-xs">
              Export
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent class="overflow-y-auto h-[530px] p-0">
        <!-- Table Header -->
        <div class="sticky top-0 bg-card border-b">
          <div class="grid grid-cols-8 gap-3 px-4 py-3 text-xs font-medium text-muted-foreground">
            <div>Time</div>
            <div>Instrument</div>
            <div>Side</div>
            <div>Size</div>
            <div>Price</div>
            <div>P&L</div>
            <div>Strategy</div>
            <div>Status</div>
          </div>
        </div>

        <!-- Trades List -->
        <div class="divide-y divide-border">
          <div v-for="trade in mockTrades" :key="trade.id" class="grid grid-cols-8 gap-3 px-4 py-3 hover:bg-accent/50 transition-colors">
            <!-- Time -->
            <div class="text-xs text-muted-foreground">
              <div>{{ trade.date }}</div>
              <div>{{ trade.time }}</div>
            </div>

            <!-- Instrument -->
            <div class="flex items-center gap-2">
              <span class="text-sm">{{ trade.flag }}</span>
              <div class="text-sm font-medium">{{ trade.instrument }}</div>
            </div>

            <!-- Side -->
            <div>
              <Badge :variant="trade.side === 'BUY' ? 'default' : 'destructive'" class="text-xs">
                {{ trade.side }}
              </Badge>
            </div>

            <!-- Size -->
            <div class="text-sm font-mono">{{ trade.size }}</div>

            <!-- Price -->
            <div class="text-sm font-mono">{{ trade.price }}</div>

            <!-- P&L -->
            <div class="text-sm font-mono" :class="trade.pnl >= 0 ? 'text-green-500' : 'text-red-500'">
              {{ trade.pnl >= 0 ? '+' : '' }}${{ trade.pnl.toFixed(2) }}
            </div>

            <!-- Strategy -->
            <div class="text-xs">
              <div class="px-2 py-1 bg-accent/50 rounded text-center">{{ trade.strategy }}</div>
            </div>

            <!-- Status -->
            <div>
              <Badge :variant="trade.status === 'FILLED' ? 'default' : trade.status === 'CANCELLED' ? 'destructive' : 'secondary'" class="text-xs">
                {{ trade.status }}
              </Badge>
            </div>
          </div>
        </div>

        <!-- Load More Button -->
        <div class="p-4 text-center border-t">
          <Button variant="outline" size="sm">
            Load More Trades
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
import { TrendingUp } from 'lucide-vue-next'
import { ref } from 'vue'

// Mock trades data
const mockTrades = ref([
  {
    id: 1,
    date: '2025-01-27',
    time: '14:32:15',
    instrument: 'EUR/USD',
    flag: '🇪🇺🇺🇸',
    side: 'BUY',
    size: '100,000',
    price: '1.0842',
    pnl: 145.80,
    strategy: 'EMA Cross',
    status: 'FILLED'
  },
  {
    id: 2,
    date: '2025-01-27',
    time: '14:28:42',
    instrument: 'GBP/USD',
    flag: '🇬🇧🇺🇸',
    side: 'SELL',
    size: '50,000',
    price: '1.2645',
    pnl: 75.20,
    strategy: 'RSI Scalp',
    status: 'FILLED'
  },
  {
    id: 3,
    date: '2025-01-27',
    time: '14:15:33',
    instrument: 'USD/JPY',
    flag: '🇺🇸🇯🇵',
    side: 'BUY',
    size: '75,000',
    price: '149.25',
    pnl: -25.40,
    strategy: 'Trend Follow',
    status: 'FILLED'
  },
  {
    id: 4,
    date: '2025-01-27',
    time: '14:12:18',
    instrument: 'AUD/USD',
    flag: '🇦🇺🇺🇸',
    side: 'SELL',
    size: '60,000',
    price: '0.6723',
    pnl: 38.60,
    strategy: 'Range Trade',
    status: 'FILLED'
  },
  {
    id: 5,
    date: '2025-01-27',
    time: '14:08:05',
    instrument: 'USD/CHF',
    flag: '🇺🇸🇨🇭',
    side: 'BUY',
    size: '40,000',
    price: '0.8912',
    pnl: 42.30,
    strategy: 'Breakout',
    status: 'FILLED'
  },
  {
    id: 6,
    date: '2025-01-27',
    time: '14:03:22',
    instrument: 'EUR/GBP',
    flag: '🇪🇺🇬🇧',
    side: 'SELL',
    size: '80,000',
    price: '0.8587',
    pnl: -15.75,
    strategy: 'Mean Reversion',
    status: 'CANCELLED'
  },
  {
    id: 7,
    date: '2025-01-27',
    time: '13:58:47',
    instrument: 'NZD/USD',
    flag: '🇳🇿🇺🇸',
    side: 'BUY',
    size: '30,000',
    price: '0.6145',
    pnl: 28.90,
    strategy: 'News Trade',
    status: 'FILLED'
  },
  {
    id: 8,
    date: '2025-01-27',
    time: '13:45:12',
    instrument: 'USD/CAD',
    flag: '🇺🇸🇨🇦',
    side: 'SELL',
    size: '55,000',
    price: '1.3456',
    pnl: 67.85,
    strategy: 'RSI Scalp',
    status: 'FILLED'
  }
])
</script>
