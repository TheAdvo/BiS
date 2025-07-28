<script setup lang="ts">
// Use the dashboard layout
definePageMeta({
  layout: 'dashboard'
})

import { TrendingUp, Settings, BarChart3, Wallet } from "lucide-vue-next"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// SEO Meta Tags
useHead({
  title: 'Settings - ADVOAI Trading Engine',
  meta: [
    { name: 'description', content: 'Configure your trading platform settings, automation preferences, and account details.' },
    { name: 'robots', content: 'noindex, nofollow' } // Private dashboard
  ]
})
</script>

<template>
  <div class="flex-1 p-6 bg-background">
    <div class="max-w-4xl space-y-6">
      <!-- Page Title -->
      <div>
        <h1 class="text-3xl font-bold tracking-tight">Settings</h1>
        <p class="text-muted-foreground">Configure your trading platform and automation settings</p>
      </div>

      <!-- Trading Configuration -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <TrendingUp class="w-5 h-5" />
            Trading Configuration
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium">Default Risk per Trade</label>
              <select class="w-full px-3 py-2 border border-border rounded-md bg-background">
                <option value="1">1% of account</option>
                <option value="2">2% of account</option>
                <option value="3">3% of account</option>
                <option value="5">5% of account</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Maximum Daily Trades</label>
              <input type="number" value="10" class="w-full px-3 py-2 border border-border rounded-md bg-background" />
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium">Stop Loss (pips)</label>
              <input type="number" value="20" class="w-full px-3 py-2 border border-border rounded-md bg-background" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Take Profit (pips)</label>
              <input type="number" value="40" class="w-full px-3 py-2 border border-border rounded-md bg-background" />
            </div>
          </div>

          <div class="flex items-center gap-2">
            <input type="checkbox" id="autoTrading" checked class="rounded border-border" />
            <label for="autoTrading" class="text-sm font-medium">Enable Automated Trading</label>
            <Badge variant="default" class="text-xs">Active</Badge>
          </div>
        </CardContent>
      </Card>

      <!-- API Configuration -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Settings class="w-5 h-5" />
            API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium">OANDA Account Type</label>
              <select class="w-full px-3 py-2 border border-border rounded-md bg-background">
                <option value="practice">Practice Account</option>
                <option value="live">Live Account</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium">Connection Status</label>
              <div class="flex items-center gap-2">
                <Badge variant="default" class="flex items-center gap-1">
                  <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                  Connected
                </Badge>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">API Key</label>
            <input type="password" value="••••••••••••••••••••••••" class="w-full px-3 py-2 border border-border rounded-md bg-background" />
          </div>

          <Button variant="outline" size="sm">
            Test Connection
          </Button>
        </CardContent>
      </Card>

      <!-- Strategy Settings -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <BarChart3 class="w-5 h-5" />
            Strategy Settings
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-4">
            <div class="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <div class="font-medium">EUR/USD Scalper</div>
                <div class="text-sm text-muted-foreground">5-minute RSI + MACD strategy</div>
              </div>
              <div class="flex items-center gap-2">
                <Badge variant="default" class="text-xs">Active</Badge>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>

            <div class="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <div class="font-medium">GBP/USD Trend Follower</div>
                <div class="text-sm text-muted-foreground">1-hour EMA crossover strategy</div>
              </div>
              <div class="flex items-center gap-2">
                <Badge variant="secondary" class="text-xs">Paused</Badge>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>

            <div class="flex items-center justify-between p-3 border border-border rounded-lg">
              <div>
                <div class="font-medium">USD/JPY Range Trading</div>
                <div class="text-sm text-muted-foreground">15-minute support/resistance strategy</div>
              </div>
              <div class="flex items-center gap-2">
                <Badge variant="default" class="text-xs">Active</Badge>
                <Button variant="outline" size="sm">Configure</Button>
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm">
            + Add New Strategy
          </Button>
        </CardContent>
      </Card>

      <!-- Notifications -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Wallet class="w-5 h-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-3">
            <div class="flex items-center gap-2">
              <input type="checkbox" id="tradeNotifications" checked class="rounded border-border" />
              <label for="tradeNotifications" class="text-sm">Trade execution notifications</label>
            </div>

            <div class="flex items-center gap-2">
              <input type="checkbox" id="riskNotifications" checked class="rounded border-border" />
              <label for="riskNotifications" class="text-sm">Risk management alerts</label>
            </div>

            <div class="flex items-center gap-2">
              <input type="checkbox" id="systemNotifications" class="rounded border-border" />
              <label for="systemNotifications" class="text-sm">System status updates</label>
            </div>

            <div class="flex items-center gap-2">
              <input type="checkbox" id="marketNotifications" checked class="rounded border-border" />
              <label for="marketNotifications" class="text-sm">Market event notifications</label>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Actions -->
      <div class="flex gap-4">
        <Button>Save Settings</Button>
        <Button variant="outline">Reset to Defaults</Button>
      </div>
    </div>
  </div>
</template>
