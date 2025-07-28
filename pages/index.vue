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
  title: 'Trading Bot Engine - Custom Strategy Development Platform',
  meta: [
    { name: 'description', content: 'Advanced trading bot engine with custom JavaScript strategy development, real-time execution, and comprehensive performance monitoring.' },
    { name: 'keywords', content: 'trading bot, strategy development, automated trading, forex trading, custom scripts' },
    { property: 'og:title', content: 'Trading Bot Engine' },
    { property: 'og:description', content: 'Custom strategy development platform for automated trading.' },
    { property: 'og:type', content: 'website' }
  ]
})

const stats = [
  { value: '24/7', label: 'Bot Operation', icon: 'lucide:activity' },
  { value: 'Real-time', label: 'Strategy Execution', icon: 'lucide:zap' },
  { value: 'Custom', label: 'JavaScript Strategies', icon: 'lucide:code' },
  { value: 'Live', label: 'Performance Monitoring', icon: 'lucide:trending-up' },
]

const features = [
  {
    title: 'Custom Strategy Development',
    description: 'Write and deploy custom JavaScript trading strategies with real-time execution',
    icon: 'lucide:code'
  },
  {
    title: 'Bot Management',
    description: 'Create, configure, and manage multiple trading bots with different strategies',
    icon: 'lucide:bot'
  },
  {
    title: 'Performance Monitoring',
    description: 'Comprehensive real-time performance tracking and analytics',
    icon: 'lucide:activity'
  },
  {
    title: 'Market Analysis',
    description: 'Advanced technical indicators and market sentiment analysis',
    icon: 'lucide:trending-up'
  }
]
</script>