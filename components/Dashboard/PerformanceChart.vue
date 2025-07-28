<template>
  <div class="w-full h-[400px]">
    <Card class="h-full">
      <CardHeader class="pb-3 border-b">
        <CardTitle class="text-base font-bold flex items-center gap-2">
          <BarChart3 class="w-4 h-4" />
          <span>Performance Chart</span>
        </CardTitle>
      </CardHeader>
      <CardContent class="h-[320px] p-4">
        <!-- Performance Chart -->
        <div v-if="chartData.length > 0" class="w-full h-full">
          <!-- Simple line chart representation -->
          <div class="h-full flex flex-col">
            <!-- Chart Title and Stats -->
            <div class="flex justify-between items-center mb-4">
              <div class="text-sm font-medium">Account Equity</div>
              <div class="flex gap-4 text-xs">
                <span class="text-muted-foreground">Start: {{ formatCurrency(startValue) }}</span>
                <span class="text-muted-foreground">Current: {{ formatCurrency(currentValue) }}</span>
                <span :class="totalReturn >= 0 ? 'text-green-500' : 'text-red-500'">
                  Return: {{ totalReturn >= 0 ? '+' : '' }}{{ totalReturn.toFixed(2) }}%
                </span>
              </div>
            </div>

            <!-- Simple chart visualization -->
            <div class="flex-1 bg-accent/20 rounded-lg border-2 border-dashed border-border p-4">
              <div class="h-full flex items-end justify-between gap-1">
                <div v-for="(point, index) in normalizedData" :key="index" class="flex-1 bg-primary/60 rounded-t-sm transition-all hover:bg-primary" :style="{ height: `${point.height}%` }" :title="`${new Date(point.timestamp).toLocaleDateString()}: ${formatCurrency(point.balance)}`"></div>
              </div>
            </div>

            <!-- Time labels -->
            <div class="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{{ formatDate(chartData[0]?.timestamp) }}</span>
              <span>{{ formatDate(chartData[chartData.length - 1]?.timestamp) }}</span>
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div v-else-if="loading" class="w-full h-full flex items-center justify-center">
          <div class="text-center">
            <BarChart3 class="w-8 h-8 mx-auto text-muted-foreground mb-2" />
            <p class="text-sm text-muted-foreground">Loading chart data...</p>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="w-full h-full flex items-center justify-center bg-accent/20 rounded-lg border-2 border-dashed border-border">
          <div class="text-center">
            <BarChart3 class="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p class="text-sm font-medium text-muted-foreground">No Performance Data</p>
            <p class="text-xs text-muted-foreground mt-1">Start trading to see your equity curve</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3 } from 'lucide-vue-next'
import type { PerformanceDataPoint } from '@/types/Analytics'

// Props
interface Props {
  data?: PerformanceDataPoint[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  data: () => [],
  loading: false
})

// Computed values
const chartData = computed(() => props.data || [])

const startValue = computed(() => {
  return chartData.value.length > 0 ? chartData.value[0].balance : 0
})

const currentValue = computed(() => {
  return chartData.value.length > 0 ? chartData.value[chartData.value.length - 1].balance : 0
})

const totalReturn = computed(() => {
  if (chartData.value.length === 0 || startValue.value === 0) return 0
  return ((currentValue.value - startValue.value) / startValue.value) * 100
})

// Normalize data for chart visualization
const normalizedData = computed(() => {
  if (chartData.value.length === 0) return []

  const values = chartData.value.map(d => d.balance)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min

  if (range === 0) {
    return chartData.value.map(d => ({ ...d, height: 50 }))
  }

  return chartData.value.map(d => ({
    ...d,
    height: 10 + ((d.balance - min) / range) * 80 // 10% to 90% height
  }))
})

// Helper functions
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value)
}

const formatDate = (timestamp?: string): string => {
  if (!timestamp) return ''
  return new Date(timestamp).toLocaleDateString()
}
</script>
