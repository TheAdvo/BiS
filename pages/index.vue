<template>
  <div>
    <Hero :stats="stats" :features="features" />
  </div>
</template>

<script setup lang="ts">
// Use the default layout (with NavBar)
definePageMeta({
  layout: 'default'
})

// SEO Meta Tags
useHead({
  title: 'ADVOAI Trading Engine - Advanced AI-Powered Forex Trading',
  meta: [
    { name: 'description', content: 'Advanced AI trading platform with 99.8% accuracy, real-time analytics, and automated risk management for forex trading.' },
    { name: 'keywords', content: 'AI trading, forex, automated trading, trading bot, financial technology' },
    { property: 'og:title', content: 'ADVOAI Trading Engine' },
    { property: 'og:description', content: 'Advanced AI trading platform with 99.8% accuracy and real-time analytics.' },
    { property: 'og:type', content: 'website' }
  ]
})

const stats = [
  { value: '99.8%', label: 'Trading Accuracy', icon: 'lucide:target' },
  { value: '$14.2M', label: 'Monthly Volume', icon: 'lucide:trending-up' },
  { value: '0.42s', label: 'Execution Speed', icon: 'lucide:zap' },
  { value: '24/7', label: 'Market Coverage', icon: 'lucide:globe' },
]

const features = [
  {
    title: 'Advanced AI Trading',
    description: 'Deep learning algorithms that adapt to market conditions in real-time',
    icon: 'lucide:cpu'
  },
  {
    title: 'Risk Management',
    description: 'Smart position sizing and stop-loss optimization',
    icon: 'lucide:shield'
  },
  {
    title: 'Multi-Currency Support',
    description: 'Trade major, minor, and exotic currency pairs',
    icon: 'lucide:currency'
  },
  {
    title: 'Real-time Analytics',
    description: 'Comprehensive dashboards and performance metrics',
    icon: 'lucide:bar-chart'
  }
]
</script>