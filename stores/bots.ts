// stores/bots.ts - Centralized bot management (Pinia)
import { defineStore } from 'pinia'

export interface TradingBot {
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

export const useBotsStore = defineStore('bots', {
  state: () => ({
    bots: [] as TradingBot[],
    isRefreshing: false,
    error: null as string | null,
    showCreateBotDialog: false,
    newBot: {
      name: '',
      strategy: '',
      instruments: [] as string[],
      riskPerTrade: 1.0,
      maxPositions: 3
    }
  }),
  getters: {
    activeBots: (state) => state.bots.filter(bot => bot.status === 'running'),
    canCreateBot: (state) => {
      return state.newBot.name.trim() &&
        state.newBot.strategy &&
        state.newBot.instruments.length > 0
    }
  },
  actions: {
    async refreshBots() {
      try {
        this.isRefreshing = true
        const response = await $fetch<{ bots: TradingBot[] }>('/api/trading-bot/bots')
        this.bots = response.bots || []
      } catch (err: any) {
        this.error = err?.message || 'Failed to refresh bots'
        throw err
      } finally {
        this.isRefreshing = false
      }
    },
    async createBot() {
      try {
        const response = await $fetch<{ bot: TradingBot }>('/api/trading-bot/bots', {
          method: 'POST',
          body: this.newBot
        })
        this.bots.push(response.bot)
        this.showCreateBotDialog = false
        // Reset form
        this.newBot = {
          name: '',
          strategy: '',
          instruments: [],
          riskPerTrade: 1.0,
          maxPositions: 3
        }
      } catch (err: any) {
        this.error = err?.message || 'Failed to create bot'
        throw err
      }
    },
    async toggleBot(bot: TradingBot) {
      try {
        const action = bot.status === 'running' ? 'stop' : 'start'
        await $fetch(`/api/trading-bot/bots/${bot.id}/${action}`, {
          method: 'POST'
        })
        bot.status = action === 'start' ? 'running' : 'stopped'
      } catch (err: any) {
        this.error = err?.message || `Failed to ${bot.status === 'running' ? 'stop' : 'start'} bot`
        throw err
      }
    },
    async deleteBot(botId: string) {
      try {
        await $fetch(`/api/trading-bot/bots/${botId}`, {
          method: 'DELETE'
        })
        const index = this.bots.findIndex(bot => bot.id === botId)
        if (index > -1) {
          this.bots.splice(index, 1)
        }
      } catch (err: any) {
        this.error = err?.message || 'Failed to delete bot'
        throw err
      }
    },
    toggleInstrument(instrument: string) {
      const index = this.newBot.instruments.indexOf(instrument)
      if (index > -1) {
        this.newBot.instruments.splice(index, 1)
      } else {
        this.newBot.instruments.push(instrument)
      }
    },
    setShowCreateBotDialog(val: boolean) {
      this.showCreateBotDialog = val
    },
    setNewBotField(field: string, value: any) {
      (this.newBot as any)[field] = value
    },
    loadMockData() {
      this.bots = [
        {
          id: '1',
          name: 'Scalper Pro',
          strategy: 'sma_crossover',
          status: 'running',
          instruments: ['EUR_USD', 'GBP_USD'],
          pnl: 245.67,
          trades: 23,
          createdAt: '2025-07-28T10:00:00Z',
          riskPerTrade: 0.5,
          maxPositions: 2
        },
        {
          id: '2',
          name: 'Trend Rider',
          strategy: 'breakout',
          status: 'stopped',
          instruments: ['USD_JPY'],
          pnl: -12.34,
          trades: 8,
          createdAt: '2025-07-28T09:30:00Z',
          riskPerTrade: 1.0,
          maxPositions: 3
        }
      ]
    }
  }
})
