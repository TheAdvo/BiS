// stores/strategy.ts - Centralized strategy management (Pinia)
import { defineStore } from 'pinia'

export const useStrategyStore = defineStore('strategy', {
  state: () => ({
    currentStrategyCode: '',
    isDeploying: false,
    error: null as string | null,
    strategies: [] as Array<{ name: string; code: string; language: string }>
  }),
  actions: {
    setCurrentStrategyCode(code: string) {
      this.currentStrategyCode = code
    },
    async saveStrategy(strategy: { name: string; code: string; language: string }) {
      try {
        this.error = null
        // Save to backend
        await $fetch('/api/trading-bot/strategies', {
          method: 'POST',
          body: strategy
        })
        this.strategies.push(strategy)
      } catch (err: any) {
        this.error = err?.message || 'Failed to save strategy'
        throw err
      }
    },
    async deployStrategy(payload: { code: string; config: any }) {
      try {
        this.isDeploying = true
        this.error = null
        await $fetch('/api/trading-bot/deploy', {
          method: 'POST',
          body: payload
        })
      } catch (err: any) {
        this.error = err?.message || 'Failed to deploy strategy'
        throw err
      } finally {
        this.isDeploying = false
      }
    }
  }
})
