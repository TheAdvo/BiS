// stores/account.ts
// Pinia store for OANDA account data
// Usage: import { useAccountStore } from '@/stores/account'

import { defineStore } from 'pinia'

export const useAccountStore = defineStore('account', {
  state: () => ({
    // Account info
    id: '',
    balance: 0,
    currency: '',
    positions: [], // Array of open positions
    // Add more fields as needed
    loading: false,
    error: null as string | null,
  }),
  actions: {
    async fetchAccount() {
      this.loading = true
      this.error = null
      try {
        // Example: fetch from your Nuxt API endpoint
        const res = await fetch('/api/oanda/account')
        if (!res.ok) throw new Error('Failed to fetch account')
        const data = await res.json()
        this.id = data.id
        this.balance = data.balance
        this.currency = data.currency
        this.positions = data.positions || []
      } catch (err) {
        this.error = err instanceof Error ? err.message : String(err)
      } finally {
        this.loading = false
      }
    },
    // Add more actions for updating, resetting, etc.
  },
})
