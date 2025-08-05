<script setup lang="ts">
import { LayoutDashboard, Briefcase, TrendingUp, BarChart3, Settings, Home } from "lucide-vue-next"
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
  SidebarHeader,
} from "@/components/ui/sidebar"
import DashboardHeader from '@/components/Dashboard/Header.vue'

// Menu items - focused on trading bot functionality
const items = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Bot Engine",
    url: "/dashboard",
    icon: LayoutDashboard,
  }
]
</script>

<template>
  <SidebarProvider>
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div class="flex items-center gap-2 py-2">
          <div class="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <span class="text-primary-foreground font-bold text-sm">TB</span>
          </div>
          <span class="text-lg font-bold truncate group-data-[collapsible=icon]:hidden">Trading Bot Engine</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Trading Bot Platform</SidebarGroupLabel>
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

      <!-- Page content with loading state -->
      <Suspense>
        <slot />
        <template #fallback>
          <div class="flex items-center justify-center py-12">
            <div class="text-center">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p class="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </template>
      </Suspense>
    </main>
  </SidebarProvider>
</template>
