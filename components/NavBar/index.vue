<script setup lang="ts">
import { ref } from 'vue'

// Define types
interface NavItem {
  title: string
  path: string
  icon: string
}

// Reactive state for the menu toggle
const isOpen = ref<boolean>(false)

// Navigation menu items
const items = ref<NavItem[]>([
  {
    title: "Home",
    path: "/",
    icon: "lucide:home", // Nuxt-icons
  },
  {
    title: "Login",
    path: "/login",
    icon: "lucide:align-left",
  },
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: "lucide:layout-dashboard",
  },
  {
    title: "Pricing",
    path: "#pricing",
    icon: "iconoir:money-square",
  },
  {
    title: "How it Works",
    path: "#how-it-works",
    icon: "lucide:workflow",
  },
  {
    title: "Support",
    path: "#support",
    icon: "ri:contacts-line",
  },
  {
    title: "Blog",
    path: "#blog",
    icon: "lucide:newspaper",
  },
]);

const toggleMenu = () => {
  isOpen.value = !isOpen.value;
};
</script>

<template>
  <nav class="sticky border-b-1">
    <div class="items-center justify-between px-4 max-w-screen-xl mx-auto md:flex md:px-5">
      <div class="flex items-center justify-between py-2 md:py-3 md:block">
        <NuxtLink to="/" class="font-bold flex items-center">
          <span class="text-xl text-forground">AdvoAI</span>
        </NuxtLink>
        <div class="lg:hidden">
          <Button @click="toggleMenu">
            <Icon name="lucide:menu" />
          </Button>
        </div>
      </div>

      <div :class="`flex-1 justify-self-center pb-2 mt-4 md:block md:pb-0 md:mt-0 ${isOpen ? 'block' : 'hidden'}`" class="transition-all duration-300">
        <ul class="justify-center items-center space-y-4 md:flex md:space-x-6 md:space-y-0">
          <li v-for="(item, idx) in items" :key="idx" class="flex items-center transition-colors hover:text-foreground/80">
            <Icon :name="item.icon" class="mr-2" />
            <NuxtLink :to="item.path">{{ item.title }}</NuxtLink>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<style scoped>
/* Optional styles */
</style>
