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
import DashboardPositionsTable from '@/components/Dashboard/PositionsTable.vue'

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
  console.log('Positions loaded', 'Monitoring your open positions')
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

      <!-- Positions Content -->
      <div class="flex-1 p-6 bg-background">
        <div class="space-y-6">
          <!-- Page Title -->
          <div class="flex items-center justify-between">
            <div>
              <h1 class="text-3xl font-bold tracking-tight">Open Positions</h1>
              <p class="text-muted-foreground">Monitor and manage your active trading positions</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="px-3 py-1 text-sm bg-green-500/10 text-green-500 rounded-full border border-green-500/20">
                Live Trading
              </span>
            </div>
          </div>

          <!-- Positions Table -->
          <DashboardPositionsTable />
        </div>
      </div>
    </main>
  </SidebarProvider>
</template>
