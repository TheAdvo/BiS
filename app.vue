<template>
  <div class="dark bg-background text-foreground dark:bg-background dark:text-foreground min-h-screen font-sans">
    <NuxtLayout>
      <NuxtLoadingIndicator />
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script setup lang="ts">
// Global error handling
useHead({
  htmlAttrs: {
    lang: 'en',
    class: 'light'
  }
})
import '@/assets/css/tailwind.css'
</script>
