<script setup lang="ts">
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger } from '@/components/ui/sidebar'
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
      <!-- Enhanced Collapsible Sidebar -->
      <Sidebar collapsible="icon">
        <SidebarHeader class="border-b px-6 py-4">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span class="text-primary-foreground font-bold text-sm">AD</span>
            </div>
            <span class="text-lg font-bold">ADVOAI Engine</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton as="a" href="/dashboard" tooltip="Overview">
                    <Icon name="lucide:layout-dashboard" class="h-4 w-4" />
                    <span>Overview</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton as="a" href="#" tooltip="Account">
                    <Icon name="lucide:wallet" class="h-4 w-4" />
                    <span>Account</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton as="a" href="#" tooltip="Positions">
                    <Icon name="lucide:briefcase" class="h-4 w-4" />
                    <span>Positions</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton as="a" href="#" tooltip="Trades">
                    <Icon name="lucide:trending-up" class="h-4 w-4" />
                    <span>Trades</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton as="a" href="#" tooltip="Analytics">
                    <Icon name="lucide:bar-chart-3" class="h-4 w-4" />
                    <span>Analytics</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton as="a" href="#" tooltip="Settings">
                    <Icon name="lucide:settings" class="h-4 w-4" />
                    <span>Settings</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col">
        <!-- Header -->
        <DashboardHeader />

        <!-- Dashboard Content -->
        <div class="flex-1 p-6 bg-background w-full">
          <div class="grid grid-cols-1 xl:grid-cols-4 gap-6 h-full w-full">
            <!-- Left side - Chart (3 columns) -->
            <div class="xl:col-span-3 w-full">
              <DashboardTradingView />
            </div>

            <!-- Right side - Data panels (1 column) -->
            <div class="space-y-6 w-full">
              <DashboardMarketStatus />
              <DashboardAccountData />
              <DashboardLivePricing />
            </div>
          </div>
        </div>
      </main>
    </SidebarProvider>
  </div>
</template>