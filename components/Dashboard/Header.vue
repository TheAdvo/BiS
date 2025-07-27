<template>
  <header class="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
    <div class="flex h-14 items-center px-6">
      <!-- Left side - App title -->
      <div class="flex items-center gap-4">
        <h1 class="text-xl font-semibold">Trading Dashboard</h1>
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
          <span class="text-sm text-muted-foreground">Live</span>
        </div>
      </div>

      <!-- Right side - User info and actions -->
      <div class="ml-auto flex items-center gap-4">
        <!-- Market status indicator -->
        <div class="flex items-center gap-2 text-sm">
          <span class="text-muted-foreground">Markets:</span>
          <Badge variant="outline" class="text-xs">
            <div class="w-1.5 h-1.5 bg-green-600 rounded-full mr-1"></div>
            Open
          </Badge>
        </div>

        <!-- Notifications -->
        <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
          <Icon name="lucide:bell" class="h-4 w-4" />
        </Button>

        <!-- Settings -->
        <Button variant="ghost" size="sm" class="h-8 w-8 p-0">
          <Icon name="lucide:settings" class="h-4 w-4" />
        </Button>

        <!-- User menu -->
        <div class="flex items-center gap-2 pl-2 border-l">
          <div class="text-right text-sm">
            <div class="font-medium">Live Account</div>
            <div class="text-xs text-muted-foreground">Connected</div>
          </div>
          <Button variant="ghost" size="sm" class="h-8 w-8 p-0 rounded-full">
            <Icon name="lucide:user" class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
</script>
