<template>
  <div>
    <NavBar />
    <slot />
  </div>
</template>

<script setup lang="ts">
import NavBar from '@/components/NavBar/index.vue'
</script>
