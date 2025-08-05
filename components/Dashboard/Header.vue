<template>
  <header class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="flex h-14 items-center px-6">
      <!-- Left side - Sidebar trigger and Bot Engine title -->
      <div class="flex items-center gap-4">
        <SidebarTrigger />
        <h1 class="text-xl font-semibold">Trading Bot Engine</h1>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full" :class="accountTypeIndicatorColor"></div>
          <span class="text-sm text-muted-foreground">{{ accountTypeIndicator }}</span>
        </div>
      </div>

      <!-- Right side - User info and actions -->
      <div class="ml-auto flex items-center gap-4">
        <!-- Bot status indicator -->
        <div class="flex items-center gap-2 text-sm">
          <span class="text-muted-foreground">Bots:</span>
          <Badge variant="outline" class="text-xs">
            <div class="w-1.5 h-1.5 rounded-full mr-1 bg-green-500"></div>
            Active
          </Badge>
        </div>

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
            <div class="font-medium">{{ accountTypeText }}</div>
            <div class="text-xs" :class="accountStatusColor">
              {{ accountStatusText }}
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SidebarTrigger } from '@/components/ui/sidebar'

import { useAccountStore } from '@/stores/account'
import { storeToRefs } from 'pinia'
const accountStore = useAccountStore()
const { id, balance, currency, positions, loading, error } = storeToRefs(accountStore)
const fetchAccount = accountStore.fetchAccount
onMounted(() => { fetchAccount() })

// Reactive state
const unreadNotifications = ref(0) // Start with 0, will be populated from real data
const marketStatus = ref('closed') // Will be calculated based on forex market hours

// Update forex market status based on time
const updateMarketStatus = () => {
  const now = new Date()

  // Get current time in different forex market timezones
  const nySundayOpen = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const day = nyTime.getDay()
  const hour = nyTime.getHours()
  const minutes = nyTime.getMinutes()
  const totalMinutes = hour * 60 + minutes

  // Forex market hours: Sunday 5:00 PM ET to Friday 5:00 PM ET
  let isOpen = false

  if (day === 0) {
    // Sunday: Open from 5:00 PM onwards
    isOpen = totalMinutes >= 17 * 60 // 5:00 PM
  } else if (day >= 1 && day <= 4) {
    // Monday to Thursday: Open all day
    isOpen = true
  } else if (day === 5) {
    // Friday: Open until 5:00 PM
    isOpen = totalMinutes < 17 * 60 // Before 5:00 PM
  } else if (day === 6) {
    // Saturday: Closed
    isOpen = false
  }

  marketStatus.value = isOpen ? 'open' : 'closed'
}

// Computed properties for account data
const accountTypeText = computed(() => {
  if (loading.value) return 'Loading...'
  if (error.value) return 'Error'
  if (!id.value) return 'No Account'
  // You may want to add logic for live/demo based on id or another field
  if (id.value.includes('001')) {
    return 'Live Account'
  } else {
    return 'Demo Account'
  }
})

const accountStatusText = computed(() => {
  if (loading.value) return 'Connecting...'
  if (error.value) return 'Disconnected'
  if (!id.value) return 'Disconnected'
  return 'Connected'
})

const accountStatusColor = computed(() => {
  if (loading.value) return 'text-yellow-600'
  if (error.value) return 'text-red-600'
  if (!id.value) return 'text-red-600'
  return 'text-green-600'
})

const marketBadgeText = computed(() => {
  return marketStatus.value === 'open' ? 'Open' : 'Closed'
})

const marketBadgeColor = computed(() => {
  return marketStatus.value === 'open' ? 'bg-green-600' : 'bg-red-600'
})

const accountTypeIndicator = computed(() => {
  if (loading.value) return 'Loading'
  if (error.value) return 'Error'
  if (!id.value) return 'Offline'
  if (id.value.includes('001')) {
    return 'Live'
  } else {
    return 'Demo'
  }
})

const accountTypeIndicatorColor = computed(() => {
  if (loading.value) return 'bg-yellow-500'
  if (error.value) return 'bg-red-600'
  if (!id.value) return 'bg-gray-500'
  if (id.value.includes('001')) {
    return 'bg-green-600' // Live account - green
  } else {
    return 'bg-blue-500' // Demo account - blue
  }
})

// Actions
const toggleNotifications = () => {
  const logger = useLogger()
  if (unreadNotifications.value > 0) {
    // Provide context-aware notification messages
    const messages = []
    // You may want to add openTradeCount, pendingOrderCount, pl to the store if needed
    if (positions.value && positions.value.length > 0) {
      messages.push(`${positions.value.length} open position(s)`)
    }
    // Add more notification logic as needed
    if (messages.length > 0) {
      logger.info('Notifications', `Trading alerts: ${messages.join(', ')}`)
    } else {
      logger.info('Notifications', 'Trading activity detected')
    }
    unreadNotifications.value = Math.max(0, unreadNotifications.value - 1)
  } else {
    logger.info('Notifications', 'No new notifications')
  }
}

// Lifecycle
let marketStatusInterval: NodeJS.Timeout | null = null

onMounted(() => {
  updateMarketStatus()
  // Update market status every minute
  marketStatusInterval = setInterval(updateMarketStatus, 60000)
})

// Watch for account data changes to update notifications
watch(() => positions.value, (newPositions) => {
  if (newPositions) {
    unreadNotifications.value = Math.min(newPositions.length, 9)
  }
}, { immediate: true })

onUnmounted(() => {
  if (marketStatusInterval) {
    clearInterval(marketStatusInterval)
  }
})
</script>
