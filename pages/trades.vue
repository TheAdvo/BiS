<script setup lang="ts">
import { onMounted } from 'vue'
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
import DashboardTradesTable from '@/components/Dashboard/TradesTable.vue'

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

onMounted(() => {
  console.log('Trades loaded', 'Viewing your trading history')
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

      <!-- Trades Content -->
      <div class="flex-1 p-6 bg-background">
        <div class="space-y-6">
          <!-- Page Title -->
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold tracking-tight">Trade History</h1>
              <p class="text-muted-foreground">Review your executed trades and performance history</p>
            </div>
            <div class="flex items-center gap-3">
              <select class="px-3 py-2 text-sm border border-border rounded-md bg-background">
                <option value="all">All Trades</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
              <button class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                Export Data
              </button>
            </div>
          </div>

          <!-- Trade Statistics Cards -->
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div class="p-4 border border-border rounded-lg bg-card">
              <div class="text-sm font-medium text-muted-foreground">Total Trades</div>
              <div class="text-2xl font-bold">127</div>
              <div class="text-xs text-green-500">+12 this week</div>
            </div>
            <div class="p-4 border border-border rounded-lg bg-card">
              <div class="text-sm font-medium text-muted-foreground">Win Rate</div>
              <div class="text-2xl font-bold text-green-500">68.5%</div>
              <div class="text-xs text-green-500">+2.3% this month</div>
            </div>
            <div class="p-4 border border-border rounded-lg bg-card">
              <div class="text-sm font-medium text-muted-foreground">Total P&L</div>
              <div class="text-2xl font-bold text-green-500">+$4,250.80</div>
              <div class="text-xs text-green-500">+$340.20 today</div>
            </div>
            <div class="p-4 border border-border rounded-lg bg-card">
              <div class="text-sm font-medium text-muted-foreground">Avg Trade</div>
              <div class="text-2xl font-bold">$33.47</div>
              <div class="text-xs text-muted-foreground">Per trade profit</div>
            </div>
          </div>

          <!-- Trades Table -->
          <DashboardTradesTable />
        </div>
      </div>
    </main>
  </SidebarProvider>
</template>
