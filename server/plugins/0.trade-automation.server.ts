// server/plugins/0.trade-automation.server.ts
import '~/server/tasks/trade-automation'

export default defineNitroPlugin(() => {
  // This plugin ensures the trade automation task is imported and runs once on server start.
})
