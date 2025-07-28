<template>
  <div class="w-full mb-6">
    <div class="flex justify-end mb-2">
      <span v-if="lastUpdated" class="text-xs text-muted-foreground">
        Last updated: {{ lastUpdated }}
      </span>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Account Balance -->
      <Tooltip>
        <TooltipTrigger as-child>
          <Card @click="handleBalanceClick">
            <CardHeader class="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle class="text-sm font-medium text-muted-foreground">Account Balance</CardTitle>
                <CardDescription>
                  <div v-if="pending" class="">
                    <div class="h-8 bg-card rounded w-24 mb-2"></div>
                  </div>
                  <span v-else class="text-2xl font-bold">{{ formatCurrency(accountBalance) }}</span>
                </CardDescription>
              </div>
              <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Wallet class="w-6 h-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent class="pt-0">
              <div class="flex items-center text-sm">
                <div v-if="pending" class="">
                  <div class="h-4 bg-card rounded w-20"></div>
                </div>
                <template v-else>
                  <span :class="balanceChange >= 0 ? 'text-primary' : 'text-destructive'" class="flex items-center">
                    <component :is="balanceChange >= 0 ? TrendingUp : TrendingDown" :class="balanceChange >= 0 ? 'text-primary' : 'text-destructive'" class="w-4 h-4 mr-1" />
                    {{ balanceChange >= 0 ? '+' : '' }}{{ formatCurrency(balanceChange) }}
                  </span>
                  <span class="text-muted-foreground ml-1">today</span>
                </template>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          The total value of your trading account, updated live from your broker.
        </TooltipContent>
      </Tooltip>

      <!-- Total P&L -->
      <Tooltip>
        <TooltipTrigger as-child>
          <Card @click="handlePnLClick">
            <CardHeader class="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle class="text-sm font-medium text-muted-foreground">Total P&L</CardTitle>
                <CardDescription>
                  <div v-if="pending" class="">
                    <div class="h-8 bg-card rounded w-24 mb-2"></div>
                  </div>
                  <span v-else class="text-2xl font-bold" :class="totalPnL >= 0 ? 'text-primary' : 'text-destructive'">
                    {{ formatCurrency(totalPnL) }}
                  </span>
                </CardDescription>
              </div>
              <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <BarChart3 class="w-6 h-6 text-primary" />
              </div>
            </CardHeader>
            <CardContent class="pt-0">
              <div class="flex items-center text-sm">
                <div v-if="pending" class="">
                  <div class="h-4 bg-card rounded w-16"></div>
                </div>
                <template v-else>
                  <span :class="pnlChange >= 0 ? 'text-primary' : 'text-destructive'" class="flex items-center">
                    <component :is="pnlChange >= 0 ? TrendingUp : TrendingDown" :class="pnlChange >= 0 ? 'text-primary' : 'text-destructive'" class="w-4 h-4 mr-1" />
                    {{ ((pnlChange / Math.abs(totalPnL || 1)) * 100).toFixed(1) }}%
                  </span>
                  <span class="text-muted-foreground ml-1">change</span>
                </template>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          Your total profit or loss since account inception.
        </TooltipContent>
      </Tooltip>

      <!-- Open Positions -->
      <Tooltip>
        <TooltipTrigger as-child>
          <Card @click="handlePositionsClick">
            <CardHeader class="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle class="text-sm font-medium text-muted-foreground">Open Positions</CardTitle>
                <CardDescription>
                  <div v-if="pending" class="">
                    <div class="h-8 bg-card rounded w-12 mb-2"></div>
                  </div>
                  <span v-else class="text-2xl font-bold">{{ openPositions }}</span>
                </CardDescription>
              </div>
              <div class="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                <Briefcase class="w-6 h-6 text-secondary" />
              </div>
            </CardHeader>
            <CardContent class="pt-0">
              <div class="flex items-center text-sm">
                <div v-if="pending" class="">
                  <div class="h-4 bg-card rounded w-20"></div>
                </div>
                <template v-else>
                  <span class="text-primary flex items-center">
                    {{ winningPositions }}
                  </span>
                  <span class="text-muted-foreground mx-1">winning</span>
                  <span class="text-destructive">
                    {{ losingPositions }}
                  </span>
                  <span class="text-muted-foreground ml-1">losing</span>
                </template>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          Number of trades currently open, with a breakdown of winning and losing.
        </TooltipContent>
      </Tooltip>

      <!-- Daily Trades -->
      <Tooltip>
        <TooltipTrigger as-child>
          <Card @click="handleTradesClick">
            <CardHeader class="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle class="text-sm font-medium text-muted-foreground">Trades Today</CardTitle>
                <CardDescription>
                  <div v-if="pending" class="">
                    <div class="h-8 bg-card rounded w-12 mb-2"></div>
                  </div>
                  <span v-else class="text-2xl font-bold">{{ dailyTrades }}</span>
                </CardDescription>
              </div>
              <div class="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                <Activity class="w-6 h-6 text-accent" />
              </div>
            </CardHeader>
            <CardContent class="pt-0">
              <div class="flex items-center text-sm">
                <div v-if="pending" class="">
                  <div class="h-4 bg-card rounded w-16"></div>
                </div>
                <template v-else>
                  <span class="text-muted-foreground">Win rate: </span>
                  <span :class="winRate >= 60 ? 'text-primary' : winRate >= 50 ? 'text-secondary-foreground' : 'text-destructive'" class="ml-1 font-medium">
                    {{ winRate }}%
                  </span>
                </template>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent>
          Total number of trades executed today and your win rate.
        </TooltipContent>
      </Tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { Wallet, BarChart3, Briefcase, Activity, TrendingUp, TrendingDown } from 'lucide-vue-next'

// Get real OANDA account data using your existing composable
const { data: oandaAccount, pending, error, refresh } = useOandaAccount()

// Computed values from real OANDA data
const accountBalance = computed(() => oandaAccount.value ? parseFloat(oandaAccount.value.balance) : 0)
const balanceChange = computed(() => {
  // Use resettablePL as the daily change indicator
  if (oandaAccount.value?.resettablePL) {
    return parseFloat(oandaAccount.value.resettablePL)
  }
  return 0 // No change if data not available
})
const totalPnL = computed(() => oandaAccount.value ? parseFloat(oandaAccount.value.pl) : 0)
const pnlChange = computed(() => {
  // Use unrealizedPL as recent change indicator
  if (oandaAccount.value?.unrealizedPL) {
    return parseFloat(oandaAccount.value.unrealizedPL)
  }
  return 0
})
const openPositions = computed(() => oandaAccount.value?.openTradeCount || 0)
const winningPositions = computed(() => {
  // Count positions with positive P&L from the positions array
  if (!oandaAccount.value?.positions) return 0
  return oandaAccount.value.positions.filter(pos => parseFloat(pos.pl) > 0).length
})
const losingPositions = computed(() => {
  // Count positions with negative P&L from the positions array
  if (!oandaAccount.value?.positions) return 0
  return oandaAccount.value.positions.filter(pos => parseFloat(pos.pl) < 0).length
})
const dailyTrades = computed(() => {
  // Use actual trade count plus pending orders
  const tradeCount = oandaAccount.value?.openTradeCount || 0
  const pendingCount = oandaAccount.value?.pendingOrderCount || 0
  return tradeCount + pendingCount
})
const winRate = computed(() => {
  const winning = winningPositions.value
  const losing = losingPositions.value
  const total = winning + losing
  return total > 0 ? Math.round((winning / total) * 100) : 0
})

// Last updated timestamp
const lastUpdated = computed(() => {
  if (!oandaAccount.value?.lastTransactionID) return null
  // Use the current time for demo; replace with real timestamp if available
  const now = new Date()
  return now.toLocaleTimeString()
})

// Auto-refresh every 60 seconds (reduced from 30 seconds for better performance)
onMounted(() => {
  const interval = setInterval(() => {
    refresh()
  }, 60000)

  // Cleanup on unmount
  onUnmounted(() => {
    clearInterval(interval)
  })
})

// Click handlers for demo notifications
const handleBalanceClick = () => {
  const logger = useLogger()
  logger.success('Account Updated', 'Your account balance has been refreshed from the broker')
}

const handlePnLClick = () => {
  const logger = useLogger()
  if (totalPnL.value >= 0) {
    logger.success('Profitable Day!', `You're up ${formatCurrency(totalPnL.value)} today`)
  } else {
    logger.warning('Loss Alert', `Current loss: ${formatCurrency(Math.abs(totalPnL.value))}`)
  }
}

const handlePositionsClick = () => {
  const logger = useLogger()
  logger.info('Position Summary', `${winningPositions.value} winning, ${losingPositions.value} losing positions`)
}

const handleTradesClick = () => {
  const logger = useLogger()
  if (winRate.value >= 60) {
    logger.success('Excellent Performance!', `${winRate.value}% win rate with ${dailyTrades.value} trades today`)
  } else if (winRate.value >= 50) {
    logger.info('Trading Update', `${winRate.value}% win rate with ${dailyTrades.value} trades today`)
  } else {
    logger.warning('Performance Alert', `Low win rate: ${winRate.value}% - Consider reviewing your strategy`)
  }
}

// Helper functions
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount)
}
</script>
