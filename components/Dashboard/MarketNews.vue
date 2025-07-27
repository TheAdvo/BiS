<template>
  <Card>
    <CardHeader>
      <div class="flex items-center justify-between">
        <CardTitle class="text-lg font-semibold flex items-center gap-2">
          <div class="w-3 h-3 rounded-full bg-blue-500"></div>
          <div class="text-2xl font-bold text-primary">Market News</div>
        </CardTitle>
        <Button variant="ghost" size="sm" @click="refreshNews" :disabled="loading">
          <RefreshCw :class="{ 'animate-spin': loading }" class="h-4 w-4" />
        </Button>
      </div>
      <CardDescription>Latest economic news and events</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="space-y-4">
        <!-- Loading State -->
        <div v-if="loading" class="space-y-3">
          <Skeleton v-for="i in 3" :key="i" class="h-16 w-full" />
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="text-center py-4">
          <p class="text-sm text-destructive">{{ error }}</p>
          <Button variant="outline" size="sm" @click="refreshNews" class="mt-2">
            Try Again
          </Button>
        </div>

        <!-- News Items -->
        <div v-else-if="newsItems.length > 0" class="space-y-3 max-h-96 overflow-y-auto">
          <div v-for="item in newsItems" :key="item.id" class="border rounded-lg p-3 hover:bg-accent/50 transition-colors cursor-pointer" @click="openNewsUrl(item.url)">
            <div class="flex items-start gap-3">
              <!-- Impact Indicator -->
              <div class="flex-shrink-0 mt-1">
                <div class="w-2 h-2 rounded-full" :class="getImpactColor(item.impact)" :title="`${item.impact} Impact`"></div>
              </div>

              <!-- News Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-xs font-medium text-muted-foreground">{{ item.country }}</span>
                  <span class="text-xs text-muted-foreground">{{ item.time }}</span>
                </div>
                <h4 class="text-sm font-medium line-clamp-2 mb-1 text-primary hover:underline">{{ item.title }}</h4>
                <p class="text-xs text-muted-foreground line-clamp-1 mb-1">{{ item.summary }}</p>
                <div class="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{{ item.publisher }}</span>
                  <span>{{ item.type }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- No Data State -->
        <div v-else class="text-center py-8">
          <p class="text-sm text-muted-foreground">No news items available</p>
          <Button variant="outline" size="sm" @click="refreshNews" class="mt-2">
            Load News
          </Button>
        </div>

        <!-- Last Updated -->
        <div v-if="lastUpdated" class="text-xs text-muted-foreground text-center pt-2 border-t">
          Last updated: {{ formatTime(lastUpdated) }}
        </div>
      </div>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { RefreshCw } from 'lucide-vue-next'
import { ref, onMounted, onUnmounted } from 'vue'

interface NewsItem {
  id: string
  title: string
  country: string
  time: string
  impact: 'low' | 'medium' | 'high'
  publisher: string
  summary: string
  url: string
  providerPublishTime: number
  type: string
}

const loading = ref(false)
const error = ref<string | null>(null)
const newsItems = ref<NewsItem[]>([])
const lastUpdated = ref<Date | null>(null)
let refreshInterval: NodeJS.Timeout | null = null

// Mock news data (replace with actual API call)
const mockNewsData: NewsItem[] = []

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high':
      return 'bg-red-500'
    case 'medium':
      return 'bg-yellow-500'
    case 'low':
      return 'bg-green-500'
    default:
      return 'bg-gray-500'
  }
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchNews = async () => {
  loading.value = true
  error.value = null

  try {
    // Use our Nuxt API route instead of direct Yahoo Finance call
    const response = await $fetch('/api/market/news', {
      query: {
        q: 'forex trading markets',
        newsCount: 15
      }
    }) as any

    if (response.success) {
      newsItems.value = response.news
      lastUpdated.value = new Date()
    } else {
      throw new Error(response.error || 'Failed to fetch news')
    }

  } catch (err) {
    error.value = 'Failed to fetch news from Yahoo Finance'
    console.error('Error fetching news:', err)

    // Fallback to empty array on error
    newsItems.value = []
  } finally {
    loading.value = false
  }
}

// Helper functions (moved to server-side API route)

const openNewsUrl = (url: string) => {
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

const refreshNews = () => {
  fetchNews()
}

// Auto-refresh every 5 minutes
onMounted(() => {
  fetchNews()
  refreshInterval = setInterval(fetchNews, 5 * 60 * 1000) // 5 minutes
})

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval)
  }
})

// Alternative API implementations you could use:

/*
// Alternative implementation for more specific financial news
const fetchFinancialNews = async () => {
  // Get market-specific news
  const marketNewsUrl = `https://query1.finance.yahoo.com/v1/finance/search?q=forex&lang=en-US&region=US&quotesCount=0&newsCount=10`

  // Get currency-specific news
  const currencyNewsUrl = `https://query2.finance.yahoo.com/v1/finance/search?q=EURUSD=X&lang=en-US&region=US&quotesCount=1&newsCount=5`

  // Get trending market news
  const trendingUrl = `https://query2.finance.yahoo.com/v1/finance/trending/US`

  const [marketRes, currencyRes, trendingRes] = await Promise.all([
    fetch(marketNewsUrl),
    fetch(currencyNewsUrl),
    fetch(trendingUrl)
  ])

  // Combine and process all news sources
}
*/
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
