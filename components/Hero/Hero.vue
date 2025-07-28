<template>
  <div class="relative overflow-hidden">
    <div class="max-w-[85rem] mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-24">
      <div class="text-center">
        <!-- Title -->
        <h1 class="text-4xl sm:text-6xl font-bold text-primary mb-6">
          AI-Powered Forex Trading
          <span class="text-foreground/80 block mt-1">Automated & Intelligent</span>
        </h1>

        <!-- Description -->
        <p class="mt-3 text-lg text-muted-foreground max-w-2xl mx-auto">
          Experience the power of AI-driven forex trading with our advanced algorithms.
          Join thousands of traders already maximizing their returns.
        </p>

        <!-- CTA Buttons -->
        <div class="mt-10 flex flex-col sm:flex-row justify-center gap-3">
          <Button variant="default" size="lg">
            Start Trading Now
            <Icon name="lucide:arrow-right" class="ml-2 h-5 w-5" />
          </Button>
          <Button variant="outline" size="lg">
            Watch Demo
            <Icon name="lucide:play" class="ml-2 h-5 w-5" />
          </Button>
        </div>

        <!-- Stats -->
        <div class="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          <Card v-for="(stat, index) in stats" :key="index" class="text-center">
            <CardHeader>
              <Icon :name="stat.icon" class="h-12 w-12 mx-auto text-primary" /> <!-- Increased from h-8 w-8 -->
            </CardHeader>
            <CardContent>
              <h4 class="text-4xl font-bold text-primary">{{ stat.value }}</h4>
              <p class="mt-1 text-muted-foreground">{{ stat.label }}</p>
            </CardContent>
          </Card>
        </div>

        <!-- Features -->
        <div class="mt-20 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <Card v-for="(feature, index) in features" :key="index" class="text-left">
            <CardHeader>
              <div class="flex justify-center mb-4">
                <Icon :name="feature.icon" class="h-14 w-14 text-primary" /> <!-- Increased from h-10 w-10 -->
              </div>
              <CardTitle class="text-center">{{ feature.title }}</CardTitle>
            </CardHeader>
            <CardContent>
              <p class="text-muted-foreground">{{ feature.description }}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

// Define prop types
interface Stat {
  value: string
  label: string
  icon: string
}

interface Feature {
  title: string
  description: string
  icon: string
}

interface Props {
  stats: Stat[]
  features: Feature[]
}

defineProps<Props>()
</script>