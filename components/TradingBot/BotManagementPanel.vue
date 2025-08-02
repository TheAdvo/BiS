<template>
  <div class="w-full h-[400px]">
    <Card class="h-full">
      <CardHeader class="pb-3 border-b">
        <div class="flex items-center justify-between">
          <CardTitle class="text-base font-bold flex items-center gap-2">
            <Bot class="w-4 h-4" />
            <span>Bot Management</span>
            <Badge variant="outline" class="text-xs">
              <div class="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
              {{ activeBots.length }} Active
            </Badge>
          </CardTitle>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" @click="refreshBots">
              <RefreshCw class="w-3 h-3 mr-1" :class="{ 'animate-spin': isRefreshing }" />
              Refresh
            </Button>
            <Button size="sm" @click="showCreateBotDialog = true">
              <Plus class="w-3 h-3 mr-1" />
              New Bot
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent class="overflow-y-auto h-[320px] p-0">
        <!-- Bot List -->
        <div v-if="bots.length > 0" class="divide-y divide-border">
          <div v-for="bot in bots" :key="bot.id" class="flex items-center justify-between px-4 py-4 hover:bg-accent/50 transition-colors">
            <div class="flex items-center gap-3">
              <div class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium" :class="getBotStatusColor(bot.status)">
                <Bot class="w-4 h-4" />
              </div>
              <div>
                <div class="text-sm font-medium">{{ bot.name }}</div>
                <div class="text-xs text-muted-foreground">{{ bot.strategy }} • {{ bot.instruments.join(', ') }}</div>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <Badge :variant="getBotStatusVariant(bot.status)" class="text-xs">
                {{ bot.status }}
              </Badge>
              <div class="text-xs text-muted-foreground">
                P&L: <span :class="bot.pnl >= 0 ? 'text-green-500' : 'text-red-500'">
                  {{ bot.pnl >= 0 ? '+' : '' }}${{ bot.pnl.toFixed(2) }}
                </span>
              </div>
              <div class="flex items-center gap-1">
                <Button variant="ghost" size="sm" class="h-6 w-6 p-0" @click="toggleBot(bot)" :disabled="bot.status === 'deploying'">
                  <Play v-if="bot.status === 'stopped'" class="h-3 w-3" />
                  <Pause v-else-if="bot.status === 'running'" class="h-3 w-3" />
                  <Loader2 v-else class="h-3 w-3 animate-spin" />
                </Button>
                <Button variant="ghost" size="sm" class="h-6 w-6 p-0" @click="editBot(bot)">
                  <Settings class="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" class="h-6 w-6 p-0" @click="deleteBot(bot.id)">
                  <Trash2 class="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="flex flex-col items-center justify-center h-32 text-center">
          <Bot class="w-8 h-8 text-muted-foreground mb-2" />
          <p class="text-sm text-muted-foreground">No trading bots created</p>
          <Button variant="outline" size="sm" class="mt-2" @click="showCreateBotDialog = true">
            Create Your First Bot
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- Create Bot Dialog -->
    <Dialog v-model:open="showCreateBotDialog">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Trading Bot</DialogTitle>
          <DialogDescription>
            Configure a new automated trading bot with custom parameters.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div>
            <Label for="bot-name">Bot Name</Label>
            <Input id="bot-name" v-model="newBot.name" placeholder="My Trading Bot" />
          </div>

          <div>
            <Label for="strategy-select">Strategy</Label>
            <Select v-model="newBot.strategy">
              <SelectTrigger>
                <SelectValue placeholder="Select a strategy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom Script</SelectItem>
                <SelectItem value="sma_crossover">SMA Crossover</SelectItem>
                <SelectItem value="rsi_reversal">RSI Reversal</SelectItem>
                <SelectItem value="breakout">Breakout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label for="instruments">Trading Instruments</Label>
            <div class="flex flex-wrap gap-2 mt-2">
              <Badge v-for="instrument in availableInstruments" :key="instrument" :variant="newBot.instruments.includes(instrument) ? 'default' : 'outline'" class="cursor-pointer" @click="toggleInstrument(instrument)">
                {{ instrument }}
              </Badge>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label for="risk-per-trade">Risk Per Trade (%)</Label>
              <Input id="risk-per-trade" v-model.number="newBot.riskPerTrade" type="number" min="0.1" max="10" step="0.1" />
            </div>
            <div>
              <Label for="max-positions">Max Positions</Label>
              <Input id="max-positions" v-model.number="newBot.maxPositions" type="number" min="1" max="20" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" @click="showCreateBotDialog = false">
            Cancel
          </Button>
          <Button @click="createBot" :disabled="!canCreateBot">
            Create Bot
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bot, RefreshCw, Plus, Play, Pause, Settings, Trash2, Loader2 } from 'lucide-vue-next'
import { computed, onMounted } from 'vue'
import { useBotsStore } from '@/stores/bots'

// Types
interface TradingBot {
  id: string
  name: string
  strategy: string
  status: 'running' | 'stopped' | 'deploying' | 'error'
  instruments: string[]
  pnl: number
  trades: number
  createdAt: string
  riskPerTrade: number
  maxPositions: number
}

interface BotResponse {
  bots: TradingBot[]
}

interface CreateBotResponse {
  bot: TradingBot
}

// ---[ Pinia Store: Centralized bot management ]---
const botsStore = useBotsStore()
const bots = computed(() => botsStore.bots)
const isRefreshing = computed(() => botsStore.isRefreshing)
const showCreateBotDialog = computed({
  get: () => botsStore.showCreateBotDialog,
  set: (val: boolean) => botsStore.setShowCreateBotDialog(val)
})
const newBot = computed(() => botsStore.newBot)
const availableInstruments = ['EUR_USD', 'GBP_USD', 'USD_JPY', 'AUD_USD', 'USD_CAD', 'USD_CHF', 'NZD_USD', 'XAU_USD']
const activeBots = computed(() => botsStore.activeBots)
const canCreateBot = computed(() => botsStore.canCreateBot)

// Methods
const getBotStatusColor = (status: string) => {
  switch (status) {
    case 'running': return 'bg-green-500 text-white'
    case 'stopped': return 'bg-gray-500 text-white'
    case 'deploying': return 'bg-blue-500 text-white'
    case 'error': return 'bg-red-500 text-white'
    default: return 'bg-gray-500 text-white'
  }
}

const getBotStatusVariant = (status: string) => {
  switch (status) {
    case 'running': return 'default'
    case 'stopped': return 'secondary'
    case 'deploying': return 'default'
    case 'error': return 'destructive'
    default: return 'secondary'
  }
}

const toggleInstrument = (instrument: string) => botsStore.toggleInstrument(instrument)
const refreshBots = async () => botsStore.refreshBots()
const createBot = async () => botsStore.createBot()
const toggleBot = async (bot: any) => botsStore.toggleBot(bot)
const editBot = (bot: any) => { /* TODO: Open edit dialog */ console.log('Edit bot:', bot) }
const deleteBot = async (botId: string) => botsStore.deleteBot(botId)

// Lifecycle
onMounted(() => {
  botsStore.loadMockData()
  // botsStore.refreshBots()
})
</script>
