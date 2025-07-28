/**
 * Logging composable for consistent application logging
 * Provides different log levels and can be easily configured for production
 */

export interface LogEvent {
  level: 'info' | 'success' | 'warning' | 'error'
  title: string
  message?: string
  data?: any
}

export const useLogger = () => {
  const isDev = process.dev

  const log = (event: LogEvent) => {
    // In development, use console for immediate feedback
    if (isDev) {
      const timestamp = new Date().toLocaleTimeString()
      const prefix = `[${timestamp}] ${event.level.toUpperCase()}`

      switch (event.level) {
        case 'success':
          console.log(`✅ ${prefix}: ${event.title}`, event.message || '')
          break
        case 'warning':
          console.warn(`⚠️ ${prefix}: ${event.title}`, event.message || '')
          break
        case 'error':
          console.error(`❌ ${prefix}: ${event.title}`, event.message || '')
          break
        default:
          console.log(`ℹ️ ${prefix}: ${event.title}`, event.message || '')
      }

      if (event.data) {
        console.log('Data:', event.data)
      }
    }

    // In production, you could send to external logging service
    // Example: send to analytics, error tracking, etc.
    // if (!isDev) {
    //   sendToLoggingService(event)
    // }
  }

  return {
    info: (title: string, message?: string, data?: any) =>
      log({ level: 'info', title, message, data }),

    success: (title: string, message?: string, data?: any) =>
      log({ level: 'success', title, message, data }),

    warning: (title: string, message?: string, data?: any) =>
      log({ level: 'warning', title, message, data }),

    error: (title: string, message?: string, data?: any) =>
      log({ level: 'error', title, message, data })
  }
}
