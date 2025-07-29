// composables/useEconomicCalendar.ts
interface EconomicEvent {
  id: string
  date: Date
  time: string
  currency: string
  event: string
  importance: 'low' | 'medium' | 'high'
  forecast: string | null
  previous: string | null
  actual: string | null
  impact: 'positive' | 'negative' | 'neutral'
  description: string
  affectedPairs: string[]
}

interface CalendarFilter {
  importance: ('low' | 'medium' | 'high')[]
  currencies: string[]
  dateRange: {
    start: Date
    end: Date
  }
}

export const useEconomicCalendar = () => {
  const events = ref<EconomicEvent[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const lastUpdate = ref<Date | null>(null)

  const filter = ref<CalendarFilter>({
    importance: ['medium', 'high'],
    currencies: ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD'],
    dateRange: {
      start: new Date(),
      end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
    }
  })

  // Mock economic events data (in real implementation, this would come from an API)
  const generateMockEvents = (): EconomicEvent[] => {
    const now = new Date()
    const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD']
    const eventTypes = [
      { name: 'Non-Farm Payrolls', importance: 'high' as const, currency: 'USD' },
      { name: 'Interest Rate Decision', importance: 'high' as const, currency: 'USD' },
      { name: 'GDP Growth Rate', importance: 'high' as const, currency: 'EUR' },
      { name: 'CPI Inflation', importance: 'high' as const, currency: 'USD' },
      { name: 'Retail Sales', importance: 'medium' as const, currency: 'EUR' },
      { name: 'Manufacturing PMI', importance: 'medium' as const, currency: 'GBP' },
      { name: 'Unemployment Rate', importance: 'medium' as const, currency: 'USD' },
      { name: 'Trade Balance', importance: 'low' as const, currency: 'JPY' },
      { name: 'Consumer Confidence', importance: 'medium' as const, currency: 'EUR' },
      { name: 'Industrial Production', importance: 'low' as const, currency: 'GBP' }
    ]

    const mockEvents: EconomicEvent[] = []

    for (let i = 0; i < 30; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
      const eventDate = new Date(now.getTime() + (Math.random() * 14 - 7) * 24 * 60 * 60 * 1000)

      const event: EconomicEvent = {
        id: `event_${Date.now()}_${i}`,
        date: eventDate,
        time: `${Math.floor(Math.random() * 12) + 8}:${Math.random() > 0.5 ? '00' : '30'}`,
        currency: eventType.currency,
        event: eventType.name,
        importance: eventType.importance,
        forecast: eventType.importance === 'high' ? `${(Math.random() * 2 + 1).toFixed(1)}%` : null,
        previous: eventType.importance !== 'low' ? `${(Math.random() * 2 + 0.5).toFixed(1)}%` : null,
        actual: eventDate < now ? `${(Math.random() * 2 + 0.8).toFixed(1)}%` : null,
        impact: eventDate < now ? (Math.random() > 0.5 ? 'positive' : 'negative') : 'neutral',
        description: `${eventType.name} measures economic activity and can significantly impact ${eventType.currency} currency pairs.`,
        affectedPairs: getAffectedPairs(eventType.currency)
      }

      mockEvents.push(event)
    }

    return mockEvents.sort((a, b) => a.date.getTime() - b.date.getTime())
  }

  // Get currency pairs affected by an event
  const getAffectedPairs = (currency: string): string[] => {
    const pairs: { [key: string]: string[] } = {
      USD: ['EUR_USD', 'GBP_USD', 'USD_JPY', 'USD_CHF', 'USD_CAD', 'AUD_USD', 'NZD_USD'],
      EUR: ['EUR_USD', 'EUR_GBP', 'EUR_JPY', 'EUR_CHF', 'EUR_CAD', 'EUR_AUD'],
      GBP: ['GBP_USD', 'EUR_GBP', 'GBP_JPY', 'GBP_CHF', 'GBP_CAD', 'GBP_AUD'],
      JPY: ['USD_JPY', 'EUR_JPY', 'GBP_JPY', 'CHF_JPY', 'CAD_JPY', 'AUD_JPY'],
      CHF: ['USD_CHF', 'EUR_CHF', 'GBP_CHF', 'CHF_JPY', 'AUD_CHF'],
      CAD: ['USD_CAD', 'EUR_CAD', 'GBP_CAD', 'CAD_JPY', 'AUD_CAD'],
      AUD: ['AUD_USD', 'EUR_AUD', 'GBP_AUD', 'AUD_JPY', 'AUD_CHF', 'AUD_CAD'],
      NZD: ['NZD_USD', 'NZD_JPY', 'NZD_CHF', 'NZD_CAD']
    }

    return pairs[currency] || []
  }

  // Fetch economic calendar data
  const fetchCalendarData = async () => {
    loading.value = true
    error.value = null

    try {
      // In real implementation, this would be an API call
      // const response = await $fetch('/api/economic-calendar', { query: filter.value })

      // For now, using mock data
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API delay
      events.value = generateMockEvents()
      lastUpdate.value = new Date()
    } catch (err) {
      error.value = 'Failed to fetch economic calendar data'
      console.error('Economic calendar error:', err)
    } finally {
      loading.value = false
    }
  }

  // Filter events based on current filter settings
  const filteredEvents = computed(() => {
    return events.value.filter(event => {
      // Filter by importance
      if (!filter.value.importance.includes(event.importance)) {
        return false
      }

      // Filter by currency
      if (!filter.value.currencies.includes(event.currency)) {
        return false
      }

      // Filter by date range
      const eventDate = new Date(event.date)
      if (eventDate < filter.value.dateRange.start || eventDate > filter.value.dateRange.end) {
        return false
      }

      return true
    })
  })

  // Get upcoming events (next 24 hours)
  const upcomingEvents = computed(() => {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)

    return filteredEvents.value.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate >= now && eventDate <= tomorrow
    })
  })

  // Get high impact events
  const highImpactEvents = computed(() => {
    return filteredEvents.value.filter(event => event.importance === 'high')
  })

  // Get events for a specific currency
  const getEventsForCurrency = (currency: string) => {
    return filteredEvents.value.filter(event => event.currency === currency)
  }

  // Get events affecting a specific pair
  const getEventsForPair = (pair: string) => {
    return filteredEvents.value.filter(event =>
      event.affectedPairs.includes(pair)
    )
  }

  // Calculate market impact score for current time
  const currentMarketImpact = computed(() => {
    const now = new Date()
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000)

    const nearTermEvents = filteredEvents.value.filter(event => {
      const eventDate = new Date(event.date)
      return eventDate >= now && eventDate <= nextHour
    })

    let impactScore = 0
    nearTermEvents.forEach(event => {
      if (event.importance === 'high') impactScore += 3
      else if (event.importance === 'medium') impactScore += 2
      else impactScore += 1
    })

    return {
      score: impactScore,
      level: impactScore >= 6 ? 'high' : impactScore >= 3 ? 'medium' : 'low',
      events: nearTermEvents
    }
  })

  // Get calendar statistics
  const calendarStats = computed(() => {
    const total = filteredEvents.value.length
    const high = filteredEvents.value.filter(e => e.importance === 'high').length
    const medium = filteredEvents.value.filter(e => e.importance === 'medium').length
    const low = filteredEvents.value.filter(e => e.importance === 'low').length

    const today = new Date().toDateString()
    const todayEvents = filteredEvents.value.filter(e => e.date.toDateString() === today).length

    return { total, high, medium, low, todayEvents }
  })

  // News impact analysis for trading pairs
  const getNewsImpactForPair = (pair: string) => {
    const [base, quote] = pair.split('_')
    const baseEvents = getEventsForCurrency(base)
    const quoteEvents = getEventsForCurrency(quote)

    const upcomingBaseEvents = baseEvents.filter(e => new Date(e.date) > new Date())
    const upcomingQuoteEvents = quoteEvents.filter(e => new Date(e.date) > new Date())

    let riskLevel = 'low'
    const totalHighImpact = [...upcomingBaseEvents, ...upcomingQuoteEvents]
      .filter(e => e.importance === 'high').length

    if (totalHighImpact >= 2) riskLevel = 'high'
    else if (totalHighImpact >= 1) riskLevel = 'medium'

    return {
      riskLevel,
      baseEvents: upcomingBaseEvents,
      quoteEvents: upcomingQuoteEvents,
      recommendation: riskLevel === 'high'
        ? 'Consider reducing position size or avoiding trades'
        : riskLevel === 'medium'
        ? 'Trade with caution and tight stops'
        : 'Normal trading conditions'
    }
  }

  // Auto-refresh calendar data
  const startAutoRefresh = () => {
    const refreshInterval = 30 * 60 * 1000 // 30 minutes
    setInterval(fetchCalendarData, refreshInterval)
  }

  return {
    events: readonly(events),
    loading: readonly(loading),
    error: readonly(error),
    lastUpdate: readonly(lastUpdate),
    filter,
    filteredEvents,
    upcomingEvents,
    highImpactEvents,
    currentMarketImpact,
    calendarStats,
    fetchCalendarData,
    getEventsForCurrency,
    getEventsForPair,
    getNewsImpactForPair,
    startAutoRefresh
  }
}
