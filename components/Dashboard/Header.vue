<template>
  <header class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="flex h-14 items-center px-6">
      <!-- Left side - Sidebar trigger and App title -->
      <div class="flex items-center gap-4">
        <SidebarTrigger />
        <h1 class="text-xl font-semibold">ADVOAI Engine</h1>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
          <span class="text-sm text-muted-foreground">Live</span>
        </div>
      </div>

      <!-- Right side - User info and actions -->
      <div class="ml-auto flex items-center gap-4">
        <!-- Market status indicator -->
        <div class="flex items-center gap-2 text-sm">
          <span class="text-muted-foreground">Markets:</span>
          <Badge variant="outline" class="text-xs">
            <div class="w-1.5 h-1.5 rounded-full mr-1" :class="marketBadgeColor"></div>
            {{ marketBadgeText }}
          </Badge>
        </div>

        <!-- Notifications -->
        <Button variant="ghost" size="sm" class="h-8 w-8 p-0 relative" @click="toggleNotifications">
          <Icon name="lucide:bell" class="h-4 w-4" />
          <span v-if="unreadNotifications > 0" class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {{ unreadNotifications }}
          </span>
        </Button>

        <!-- Settings -->
        <Button variant="ghost" size="sm" class="h-8 w-8 p-0" @click="$router.push('/settings')">
          <Icon name="lucide:settings" class="h-4 w-4" />
        </Button>

        <!-- User menu -->
        <div class="flex items-center gap-2 pl-2 border-l">
          <div class="text-right text-sm">
            <div class="font-medium">Live Account</div>
            <div class="text-xs" :class="accountStatus === 'connected' ? 'text-green-600' : 'text-red-600'">
              {{ accountStatus === 'connected' ? 'Connected' : 'Disconnected' }}
            </div>
          </div>
          <Button variant="ghost" size="sm" class="h-8 w-8 p-0 rounded-full">
            <Icon name="lucide:user" class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SidebarTrigger } from '@/components/ui/sidebar'

// Reactive state
const unreadNotifications = ref(3)
const marketStatus = ref('open')
const accountStatus = ref('connected')

// Update market status based on time
const updateMarketStatus = () => {
  const now = new Date()
  const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = nyTime.getDay()
  const hour = nyTime.getHours()

  // Simple market hours check (9:30 AM - 4:00 PM ET, Monday-Friday)
  if (day >= 1 && day <= 5 && hour >= 9.5 && hour < 16) {
    marketStatus.value = 'open'
  } else {
    marketStatus.value = 'closed'
  }
}

// Computed properties
const marketBadgeText = computed(() => {
  return marketStatus.value === 'open' ? 'Open' : 'Closed'
})

const marketBadgeColor = computed(() => {
  return marketStatus.value === 'open' ? 'bg-green-600' : 'bg-red-600'
})

// Actions
const toggleNotifications = () => {
  const logger = useLogger()
  logger.info('Notifications', 'You have 3 unread trading alerts')
  unreadNotifications.value = Math.max(0, unreadNotifications.value - 1)
}

// Lifecycle
onMounted(() => {
  updateMarketStatus()
  // Update market status every minute
  setInterval(updateMarketStatus, 60000)
})
</script>
