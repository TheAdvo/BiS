/**
 * Server-side logging utility for API routes
 */

export const createServerLogger = (apiName: string) => {
  const isDev = process.env.NODE_ENV === 'development'

  const log = (level: 'info' | 'warn' | 'error', message: string, data?: any) => {
    const timestamp = new Date().toISOString()
    const prefix = `[${timestamp}] [${apiName}] ${level.toUpperCase()}`

    if (isDev) {
      // In development, use console for immediate feedback
      switch (level) {
        case 'warn':
          console.warn(`⚠️ ${prefix}: ${message}`, data || '')
          break
        case 'error':
          console.error(`❌ ${prefix}: ${message}`, data || '')
          break
        default:
          console.log(`ℹ️ ${prefix}: ${message}`, data || '')
      }
    } else {
      // In production, you could integrate with proper logging services
      // Example: Winston, Pino, or cloud logging services
      // For now, keep minimal console output
      if (level === 'error') {
        console.error(`${prefix}: ${message}`)
      }
    }
  }

  return {
    info: (message: string, data?: any) => log('info', message, data),
    warn: (message: string, data?: any) => log('warn', message, data),
    error: (message: string, data?: any) => log('error', message, data)
  }
}
