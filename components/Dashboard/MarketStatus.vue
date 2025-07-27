<template>
  <div class="w-full h-[500px]">
    <Card class="h-full">
      <CardHeader>
        <CardTitle class="text-lg font-semibold flex items-center gap-2">
          <div class="w-3 h-3 rounded-full animate-pulse" :class="statusIndicator.color"></div>
          <div class="text-2xl font-bold text-primary">Market Status</div>
        </CardTitle>
      </CardHeader>
      <CardContent class="overflow-y-auto h-[400px]">
        <div class="space-y-4">
          <!-- Multiple Market Status -->
          <div class="grid grid-cols-2 gap-4">
            <div v-for="market in marketStatuses" :key="market.name" class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">{{ market.name }}:</span>
                <Badge :variant="market.isOpen ? 'default' : 'secondary'" class="flex items-center gap-1">
                  <div class="w-2 h-2 rounded-full" :class="market.isOpen ? 'bg-green-500' : 'bg-red-500'"></div>
                  {{ market.isOpen ? 'Open' : 'Closed' }}
                </Badge>
              </div>
              <div class="text-xs text-muted-foreground">
                {{ market.hours }}
              </div>
            </div>
          </div>

          <!-- Current Times in Different Zones -->
          <div class="border-t pt-3">
            <h4 class="text-sm font-medium mb-2">Current Time</h4>
            <div class="grid grid-cols-1 gap-1">
              <div v-for="timezone in timezones" :key="timezone.zone" class="flex items-center justify-between">
                <span class="text-xs font-medium">{{ timezone.label }}:</span>
                <span class="text-xs text-muted-foreground font-mono">{{ timezone.time }}</span>
              </div>
            </div>
          </div>

          <!-- Market Sessions Progress -->
          <div class="border-t pt-3">
            <h4 class="text-sm font-medium mb-2">Session Progress</h4>
            <div class="space-y-2">
              <div v-for="session in activeSessions" :key="session.name" class="space-y-1">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-medium">{{ session.name }}</span>
                  <span class="text-xs text-muted-foreground">{{ session.progress }}%</span>
                </div>
                <div class="w-full bg-muted rounded-full h-1.5">
                  <div class="h-1.5 rounded-full transition-all duration-500" :class="session.progressColor" :style="{ width: `${session.progress}%` }"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Next Events -->
          <div class="border-t pt-3">
            <h4 class="text-sm font-medium mb-2">Upcoming Events</h4>
            <div class="space-y-2">
              <div v-for="event in upcomingEvents" :key="event.id" class="flex items-center justify-between">
                <div class="flex flex-col">
                  <span class="text-sm">{{ event.text }}</span>
                  <span class="text-xs text-muted-foreground">{{ event.market }}</span>
                </div>
                <div class="text-right">
                  <div class="text-sm font-medium" :class="event.urgency">{{ event.countdown }}</div>
                  <div class="text-xs text-muted-foreground">{{ event.exactTime }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Trading Volume Indicator -->
          <div class="border-t pt-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Market Activity:</span>
              <Badge :variant="volumeIndicator.variant" class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full animate-pulse" :class="volumeIndicator.color"></div>
                {{ volumeIndicator.text }}
              </Badge>
            </div>
          </div>

          <!-- Connection Status -->
          <div class="border-t pt-3">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Data Status:</span>
              <Badge :variant="connectionStatus.variant" class="flex items-center gap-1">
                <div class="w-2 h-2 rounded-full" :class="connectionStatus.color"></div>
                {{ connectionStatus.text }}
              </Badge>
            </div>
            <div class="text-xs text-muted-foreground mt-1">
              Last updated: {{ lastUpdate }}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { computed, ref, onMounted, onUnmounted } from 'vue'

// Current time reactive reference
const currentTime = ref(new Date())
let timeInterval: NodeJS.Timeout | null = null

// Update time every second
onMounted(() => {
  timeInterval = setInterval(() => {
    currentTime.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})

// Timezone conversions
const timezones = computed(() => {
  const now = currentTime.value

  return [
    {
      label: 'New York (ET)',
      zone: 'America/New_York',
      time: now.toLocaleString('en-US', {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    },
    {
      label: 'London (GMT)',
      zone: 'Europe/London',
      time: now.toLocaleString('en-US', {
        timeZone: 'Europe/London',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    },
    {
      label: 'Tokyo (JST)',
      zone: 'Asia/Tokyo',
      time: now.toLocaleString('en-US', {
        timeZone: 'Asia/Tokyo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    },
    {
      label: 'Sydney (AEST)',
      zone: 'Australia/Sydney',
      time: now.toLocaleString('en-US', {
        timeZone: 'Australia/Sydney',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    }
  ]
})

// Market status for different markets
const marketStatuses = computed(() => {
  const now = currentTime.value

  // Get times in different zones
  const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const londonTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }))
  const tokyoTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }))
  const sydneyTime = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }))

  return [
    {
      name: 'NYSE',
      isOpen: isMarketOpenForTime(nyTime, 9.5, 16), // 9:30 AM - 4:00 PM
      hours: '9:30 AM - 4:00 PM ET',
      timezone: 'ET'
    },
    {
      name: 'LSE',
      isOpen: isMarketOpenForTime(londonTime, 8, 16.5), // 8:00 AM - 4:30 PM
      hours: '8:00 AM - 4:30 PM GMT',
      timezone: 'GMT'
    },
    {
      name: 'TSE',
      isOpen: isMarketOpenForTime(tokyoTime, 9, 11.5) || isMarketOpenForTime(tokyoTime, 12.5, 15), // 9:00-11:30, 12:30-15:00
      hours: '9:00 AM - 3:00 PM JST',
      timezone: 'JST'
    },
    {
      name: 'ASX',
      isOpen: isMarketOpenForTime(sydneyTime, 10, 16), // 10:00 AM - 4:00 PM
      hours: '10:00 AM - 4:00 PM AEST',
      timezone: 'AEST'
    },
    {
      name: 'Forex',
      isOpen: isForexOpen(now),
      hours: 'Sun 5:00 PM - Fri 5:00 PM ET',
      timezone: 'Global'
    },
    {
      name: 'Crypto',
      isOpen: true,
      hours: '24/7',
      timezone: 'Global'
    }
  ]
})

// Helper function to check if market is open for a given time
function isMarketOpenForTime(time: Date, openHour: number, closeHour: number): boolean {
  const day = time.getDay()
  if (day === 0 || day === 6) return false // Weekend

  const hour = time.getHours() + time.getMinutes() / 60
  return hour >= openHour && hour < closeHour
}

// Check if Forex market is open (24/5)
function isForexOpen(time: Date): boolean {
  const day = time.getDay()
  const hour = time.getHours()

  // Forex closes Friday 5 PM ET and opens Sunday 5 PM ET
  if (day === 6) return false // Saturday
  if (day === 0 && hour < 17) return false // Sunday before 5 PM
  if (day === 5 && hour >= 17) return false // Friday after 5 PM

  return true
}

// Active trading sessions with progress
const activeSessions = computed(() => {
  const sessions = []
  const now = currentTime.value

  for (const market of marketStatuses.value) {
    if (market.isOpen && market.name !== 'Crypto' && market.name !== 'Forex') {
      let progress = 0
      let progressColor = 'bg-blue-500'

      // Calculate session progress based on market
      if (market.name === 'NYSE') {
        const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
        const sessionStart = 9.5 * 60 // 9:30 AM in minutes
        const sessionEnd = 16 * 60 // 4:00 PM in minutes
        const currentMinutes = nyTime.getHours() * 60 + nyTime.getMinutes()
        progress = Math.round(((currentMinutes - sessionStart) / (sessionEnd - sessionStart)) * 100)

        if (progress > 80) progressColor = 'bg-red-500'
        else if (progress > 60) progressColor = 'bg-yellow-500'
        else progressColor = 'bg-green-500'
      }

      sessions.push({
        name: market.name,
        progress: Math.max(0, Math.min(100, progress)),
        progressColor
      })
    }
  }

  return sessions
})

// Main status indicator (based on NYSE for primary status)
const statusIndicator = computed(() => {
  const nyseMarket = marketStatuses.value.find(m => m.name === 'NYSE')
  if (nyseMarket?.isOpen) {
    return {
      text: 'Open',
      color: 'bg-green-500',
      variant: 'default' as const
    }
  } else {
    return {
      text: 'Closed',
      color: 'bg-red-500',
      variant: 'secondary' as const
    }
  }
})

// Upcoming events
const upcomingEvents = computed(() => {
  const events = []
  const now = currentTime.value

  // NYSE events
  const nyTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const nyDay = nyTime.getDay()
  const nyHour = nyTime.getHours() + nyTime.getMinutes() / 60

  if (nyDay >= 1 && nyDay <= 5) { // Weekday
    if (nyHour < 9.5) {
      // Before market open
      const minutesUntil = Math.round((9.5 - nyHour) * 60)
      const hours = Math.floor(minutesUntil / 60)
      const mins = minutesUntil % 60
      events.push({
        id: 'nyse-open',
        text: 'NYSE Opens',
        market: 'New York Stock Exchange',
        countdown: `${hours}h ${mins}m`,
        exactTime: '9:30 AM ET',
        urgency: minutesUntil < 30 ? 'text-red-500' : 'text-foreground'
      })
    } else if (nyHour < 16) {
      // Market open, show close time
      const minutesUntil = Math.round((16 - nyHour) * 60)
      const hours = Math.floor(minutesUntil / 60)
      const mins = minutesUntil % 60
      events.push({
        id: 'nyse-close',
        text: 'NYSE Closes',
        market: 'New York Stock Exchange',
        countdown: `${hours}h ${mins}m`,
        exactTime: '4:00 PM ET',
        urgency: minutesUntil < 30 ? 'text-red-500' : 'text-foreground'
      })
    }
  }

  // Add weekend countdown if it's Friday after close or weekend
  if ((nyDay === 5 && nyHour >= 16) || nyDay === 6 || nyDay === 0) {
    const daysUntilMonday = nyDay === 5 ? 3 : nyDay === 6 ? 2 : 1
    events.push({
      id: 'weekend',
      text: 'NYSE Opens Monday',
      market: 'New York Stock Exchange',
      countdown: `${daysUntilMonday} day${daysUntilMonday > 1 ? 's' : ''}`,
      exactTime: '9:30 AM ET',
      urgency: 'text-muted-foreground'
    })
  }

  return events.slice(0, 3) // Show max 3 events
})

// Volume/Activity indicator
const volumeIndicator = computed(() => {
  const openMarkets = marketStatuses.value.filter(m => m.isOpen).length

  if (openMarkets >= 4) {
    return { text: 'High', variant: 'default' as const, color: 'bg-green-500' }
  } else if (openMarkets >= 2) {
    return { text: 'Medium', variant: 'secondary' as const, color: 'bg-yellow-500' }
  } else if (openMarkets >= 1) {
    return { text: 'Low', variant: 'secondary' as const, color: 'bg-orange-500' }
  } else {
    return { text: 'Minimal', variant: 'outline' as const, color: 'bg-red-500' }
  }
})

// Connection status
const connectionStatus = computed(() => {
  // In a real app, this would check actual data connection
  return {
    text: 'Live',
    variant: 'default' as const,
    color: 'bg-green-500'
  }
})

// Last update timestamp
const lastUpdate = computed(() => {
  return currentTime.value.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
})
</script>
