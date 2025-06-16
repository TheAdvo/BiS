<template>
  <div>
    <Hero :stats="stats" :features="features" />
  </div>
</template>

<script setup>
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