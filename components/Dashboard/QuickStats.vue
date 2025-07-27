<template>
  <div class="w-full mb-6">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Account Balance -->
      <Card class="p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer" @click="handleBalanceClick">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Account Balance</p>
            <p class="text-2xl font-bold">{{ formatCurrency(accountBalance) }}</p>
          </div>
          <div class="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Wallet class="w-6 h-6 text-primary" />
          </div>
        </div>
        <div class="mt-2 flex items-center text-sm">
          <span :class="balanceChange >= 0 ? 'text-green-600' : 'text-red-600'" class="flex items-center">
            <component :is="balanceChange >= 0 ? TrendingUp : TrendingDown" class="w-4 h-4 mr-1" />
            {{ balanceChange >= 0 ? '+' : '' }}{{ formatCurrency(balanceChange) }}
          </span>
          <span class="text-muted-foreground ml-1">today</span>
        </div>
      </Card>

      <!-- Total P&L -->
      <Card class="p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer" @click="handlePnLClick">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Total P&L</p>
            <p class="text-2xl font-bold" :class="totalPnL >= 0 ? 'text-green-600' : 'text-red-600'">
              {{ formatCurrency(totalPnL) }}
            </p>
          </div>
          <div class="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
            <BarChart3 class="w-6 h-6 text-green-600" />
          </div>
        </div>
        <div class="mt-2 flex items-center text-sm">
          <span :class="pnlChange >= 0 ? 'text-green-600' : 'text-red-600'" class="flex items-center">
            <component :is="pnlChange >= 0 ? TrendingUp : TrendingDown" class="w-4 h-4 mr-1" />
            {{ ((pnlChange / Math.abs(totalPnL || 1)) * 100).toFixed(1) }}%
          </span>
          <span class="text-muted-foreground ml-1">change</span>
        </div>
      </Card>

      <!-- Open Positions -->
      <Card class="p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer" @click="handlePositionsClick">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Open Positions</p>
            <p class="text-2xl font-bold">{{ openPositions }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
            <Briefcase class="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <div class="mt-2 flex items-center text-sm">
          <span class="text-green-600 flex items-center">
            {{ winningPositions }}
          </span>
          <span class="text-muted-foreground mx-1">winning</span>
          <span class="text-red-600">
            {{ losingPositions }}
          </span>
          <span class="text-muted-foreground ml-1">losing</span>
        </div>
      </Card>

      <!-- Daily Trades -->
      <Card class="p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.02] cursor-pointer" @click="handleTradesClick">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-muted-foreground">Trades Today</p>
            <p class="text-2xl font-bold">{{ dailyTrades }}</p>
          </div>
          <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
            <Activity class="w-6 h-6 text-orange-600" />
          </div>
        </div>
        <div class="mt-2 flex items-center text-sm">
          <span class="text-muted-foreground">Win rate: </span>
          <span :class="winRate >= 60 ? 'text-green-600' : winRate >= 50 ? 'text-yellow-600' : 'text-red-600'" class="ml-1 font-medium">
            {{ winRate }}%
          </span>
        </div>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Card } from '@/components/ui/card'
import { Wallet, BarChart3, Briefcase, Activity, TrendingUp, TrendingDown } from 'lucide-vue-next'

// Mock data - replace with real data from your trading API
const accountBalance = ref(50000)
const balanceChange = ref(1250.50)
const totalPnL = ref(2350.75)
const pnlChange = ref(150.25)
const openPositions = ref(3)
const winningPositions = ref(2)
const losingPositions = ref(1)
const dailyTrades = ref(8)
const winRate = ref(65)

// Click handlers for demo notifications
const handleBalanceClick = () => {
  console.log('Account Updated', 'Your account balance has been refreshed from the broker')
}

const handlePnLClick = () => {
  if (totalPnL.value >= 0) {
    console.log('Profitable Day!', `You're up ${formatCurrency(totalPnL.value)} today`)
  } else {
    console.log('Loss Alert', `Current loss: ${formatCurrency(Math.abs(totalPnL.value))}`)
  }
}

const handlePositionsClick = () => {
  console.log('Position Summary', `${winningPositions.value} winning, ${losingPositions.value} losing positions`)
}

const handleTradesClick = () => {
  if (winRate.value >= 60) {
    console.log('Excellent Performance!', `${winRate.value}% win rate with ${dailyTrades.value} trades today`)
  } else if (winRate.value >= 50) {
    console.log('Trading Update', `${winRate.value}% win rate with ${dailyTrades.value} trades today`)
  } else {
    console.log('Performance Alert', `Low win rate: ${winRate.value}% - Consider reviewing your strategy`)
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
