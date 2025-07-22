// server/api/logs.ts
import { defineEventHandler } from 'h3'
import { logEmitter, logs } from '~/server/utils/logs'

export default defineEventHandler((event) => {
  event.node.res.setHeader('Content-Type', 'text/event-stream')
  event.node.res.setHeader('Cache-Control', 'no-cache')
  event.node.res.setHeader('Connection', 'keep-alive')
  event.node.res.flushHeaders?.()

  // Send existing logs
  for (const log of logs) {
    event.node.res.write(`data: ${log}\n\n`)
  }

  const listener = (message: string) => {
    event.node.res.write(`data: ${message}\n\n`)
  }

  logEmitter.on('newLog', listener)

  event.node.req.on('close', () => {
    logEmitter.off('newLog', listener)
  })
})
