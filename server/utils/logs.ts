// server/utils/logs.ts
import { EventEmitter } from 'events'

const MAX_LOGS = 50
export const logs: string[] = []
export const logEmitter = new EventEmitter()

export function addLog(message: string) {
  const timestamp = new Date().toLocaleTimeString()
  const formattedMessage = `[${timestamp}] ${message}`
  logs.unshift(formattedMessage)
  if (logs.length > MAX_LOGS) {
    logs.pop()
  }
  logEmitter.emit('newLog', formattedMessage)
}
