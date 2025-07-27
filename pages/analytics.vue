<script setup lang="ts">
import { LayoutDashboard, Wallet, Briefcase, TrendingUp, BarChart3, Settings } from "lucide-vue-next"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
} from "@/components/ui/sidebar"
import DashboardHeader from '@/components/Dashboard/Header.vue'
import DashboardPerformanceChart from '@/components/Dashboard/PerformanceChart.vue'
import DashboardStrategyMetrics from '@/components/Dashboard/StrategyMetrics.vue'

// Menu items
const items = [
  {
    title: "Overview",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Account",
    url: "#",
    icon: Wallet,
  },
  {
    title: "Positions",
    url: "/positions",
    icon: Briefcase,
  },
  {
    title: "Trades",
    url: "/trades",
    icon: TrendingUp,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

// Set page meta for dark theme
definePageMeta({
  layout: false
})
</script>

<template>
  <SidebarProvider>
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div class="flex items-center gap-2 py-2">
          <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <span class="text-primary-foreground font-bold text-sm">AD</span>
          </div>
          <span class="text-lg font-bold truncate group-data-[collapsible=icon]:hidden">ADVOAI Engine</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Trading Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem v-for="item in items" :key="item.title">
                <SidebarMenuButton as-child :tooltip="item.title">
                  <NuxtLink :to="item.url" :class="{ 'bg-accent': $route.path === item.url }">
                    <component :is="item.icon" />
                    <span>{{ item.title }}</span>
                  </NuxtLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
    <main class="flex-1">
      <!-- Header -->
      <DashboardHeader />

      <!-- Analytics Content -->
      <div class="flex-1 p-6 bg-background">
        <div class="space-y-6">
          <!-- Page Title -->
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold tracking-tight">Analytics & Strategy Performance</h1>
              <p class="text-muted-foreground">Deep dive into your trading performance and strategy effectiveness</p>
            </div>
            <div class="flex items-center gap-3">
              <select class="px-3 py-2 text-sm border border-border rounded-md bg-background">
                <option value="1d">24 Hours</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
                <option value="90d">90 Days</option>
              </select>
            </div>
          </div>

          <!-- Key Performance Indicators -->
          <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div class="p-4 border border-border rounded-lg bg-card">
              <div class="text-sm font-medium text-muted-foreground">Sharpe Ratio</div>
              <div class="text-2xl font-bold text-green-500">1.24</div>
              <div class="text-xs text-muted-foreground">Risk-adjusted return</div>
            </div>
            <div class="p-4 border border-border rounded-lg bg-card">
              <div class="text-sm font-medium text-muted-foreground">Max Drawdown</div>
              <div class="text-2xl font-bold text-red-500">-5.2%</div>
              <div class="text-xs text-muted-foreground">Peak to trough</div>
            </div>
            <div class="p-4 border border-border rounded-lg bg-card">
              <div class="text-sm font-medium text-muted-foreground">Profit Factor</div>
              <div class="text-2xl font-bold text-green-500">2.18</div>
              <div class="text-xs text-muted-foreground">Gross profit / loss</div>
            </div>
            <div class="p-4 border border-border rounded-lg bg-card">
              <div class="text-sm font-medium text-muted-foreground">Avg Hold Time</div>
              <div class="text-2xl font-bold">4.2h</div>
              <div class="text-xs text-muted-foreground">Per position</div>
            </div>
            <div class="p-4 border border-border rounded-lg bg-card">
              <div class="text-sm font-medium text-muted-foreground">Recovery Factor</div>
              <div class="text-2xl font-bold text-green-500">4.12</div>
              <div class="text-xs text-muted-foreground">Return / max DD</div>
            </div>
            <div class="p-4 border border-border rounded-lg bg-card">
              <div class="text-sm font-medium text-muted-foreground">Kelly %</div>
              <div class="text-2xl font-bold">15.8%</div>
              <div class="text-xs text-muted-foreground">Optimal position size</div>
            </div>
          </div>

          <!-- Performance Chart and Strategy Metrics -->
          <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <!-- Performance Chart (2 columns) -->
            <div class="xl:col-span-2">
              <DashboardPerformanceChart />
            </div>

            <!-- Strategy Metrics (1 column) -->
            <div>
              <DashboardStrategyMetrics />
            </div>
          </div>

          <!-- Strategy Breakdown -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Active Strategies -->
            <div class="p-6 border border-border rounded-lg bg-card">
              <h3 class="text-lg font-semibold mb-4">Active Strategies</h3>
              <div class="space-y-4">
                <div class="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                  <div>
                    <div class="font-medium">EUR/USD Scalper</div>
                    <div class="text-sm text-muted-foreground">5m timeframe • RSI + MACD</div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-medium text-green-500">+$340.20</div>
                    <div class="text-xs text-muted-foreground">68% win rate</div>
                  </div>
                </div>
                <div class="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                  <div>
                    <div class="font-medium">GBP/USD Trend</div>
                    <div class="text-sm text-muted-foreground">1h timeframe • EMA Crossover</div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-medium text-green-500">+$180.50</div>
                    <div class="text-xs text-muted-foreground">72% win rate</div>
                  </div>
                </div>
                <div class="flex items-center justify-between p-3 bg-accent/30 rounded-lg">
                  <div>
                    <div class="font-medium">USD/JPY Range</div>
                    <div class="text-sm text-muted-foreground">15m timeframe • Support/Resistance</div>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-medium text-red-500">-$45.30</div>
                    <div class="text-xs text-muted-foreground">55% win rate</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Currency Pair Performance -->
            <div class="p-6 border border-border rounded-lg bg-card">
              <h3 class="text-lg font-semibold mb-4">Currency Pair Performance</h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">🇪🇺🇺🇸</span>
                    <span class="font-medium">EUR/USD</span>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-medium text-green-500">+$420.80</div>
                    <div class="text-xs text-muted-foreground">45 trades</div>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">🇬🇧🇺🇸</span>
                    <span class="font-medium">GBP/USD</span>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-medium text-green-500">+$280.40</div>
                    <div class="text-xs text-muted-foreground">32 trades</div>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">🇺🇸🇯🇵</span>
                    <span class="font-medium">USD/JPY</span>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-medium text-green-500">+$190.20</div>
                    <div class="text-xs text-muted-foreground">28 trades</div>
                  </div>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="text-lg">🇦🇺🇺🇸</span>
                    <span class="font-medium">AUD/USD</span>
                  </div>
                  <div class="text-right">
                    <div class="text-sm font-medium text-red-500">-$85.60</div>
                    <div class="text-xs text-muted-foreground">22 trades</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </SidebarProvider>
</template>
