<script setup lang="ts">
import { SidebarProvider, Sidebar, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar'
import DashboardHeader from '@/components/Dashboard/Header.vue'
import DashboardAccountData from '@/components/Dashboard/AccountData.vue'
import DashboardLivePricing from '@/components/Dashboard/LivePricingSimple.vue'
import DashboardMarketStatus from '@/components/Dashboard/MarketStatus.vue'
import DashboardTradingView from '@/components/Dashboard/TradingView.vue'

// Set page meta for dark theme
definePageMeta({
  layout: false
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <SidebarProvider>
      <div class="flex min-h-screen">
        <!-- Enhanced Sidebar -->
        <Sidebar class="min-h-screen border-r">
          <SidebarHeader class="border-b px-6 py-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span class="text-primary-foreground font-bold text-sm">B</span>
              </div>
              <span class="text-lg font-bold">BiS Trading</span>
            </div>
          </SidebarHeader>
          <SidebarMenu class="px-3 py-4">
            <SidebarMenuItem>
              <SidebarMenuButton as="a" href="/dashboard" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <Icon name="lucide:layout-dashboard" class="h-4 w-4" />
                Overview
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as="a" href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <Icon name="lucide:wallet" class="h-4 w-4" />
                Account
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as="a" href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <Icon name="lucide:briefcase" class="h-4 w-4" />
                Positions
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as="a" href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <Icon name="lucide:trending-up" class="h-4 w-4" />
                Trades
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as="a" href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <Icon name="lucide:bar-chart-3" class="h-4 w-4" />
                Analytics
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton as="a" href="#" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent transition-colors">
                <Icon name="lucide:settings" class="h-4 w-4" />
                Settings
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>

        <!-- Main Content Area -->
        <div class="flex-1 flex flex-col">
          <!-- Header -->
          <DashboardHeader />
          
          <!-- Dashboard Content -->
          <main class="flex-1 p-6 bg-muted/20">
            <div class="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full">
              <!-- Left side - Chart (3 columns) -->
              <div class="xl:col-span-3">
                <DashboardTradingView />
              </div>
              
              <!-- Right side - Data panels (1 column) -->
              <div class="space-y-6">
                <DashboardMarketStatus />
                <DashboardAccountData />
                <DashboardLivePricing />
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  </div>
</template>