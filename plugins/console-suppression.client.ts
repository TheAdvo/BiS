// plugins/console-suppression.client.ts
export default defineNuxtPlugin(() => {
  if (process.dev) {
    const originalWarn = console.warn
    const originalLog = console.log
    const originalInfo = console.info

    // Function to check if message should be suppressed
    const shouldSuppress = (message: string): boolean => {
      // Suppress Suspense warnings
      if (message.includes('<Suspense> is an experimental feature')) {
        return true
      }

      // Suppress TradingView partitioned cookie warnings/info
      if (message.includes('Partitioned cookie or storage access') ||
          message.includes('tradingview-widget.com')) {
        return true
      }

      // Suppress font warnings
      if (message.includes('downloadable font:') || message.includes('glyf:')) {
        return true
      }

      // Suppress DevTools messages
      if (message.includes('✨ Nuxt DevTools') || message.includes('Press Shift + Alt + D')) {
        return true
      }

      return false
    }

    // Override console.warn
    console.warn = (...args: any[]) => {
      const message = args.join(' ')
      if (!shouldSuppress(message)) {
        originalWarn.apply(console, args)
      }
    }

    // Override console.log
    console.log = (...args: any[]) => {
      const message = args.join(' ')
      if (!shouldSuppress(message)) {
        originalLog.apply(console, args)
      }
    }

    // Override console.info
    console.info = (...args: any[]) => {
      const message = args.join(' ')
      if (!shouldSuppress(message)) {
        originalInfo.apply(console, args)
      }
    }
  }
})