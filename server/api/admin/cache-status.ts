// server/api/admin/cache-status.ts
import { serverCache } from '~/server/utils/cache'

export default defineEventHandler(async (event) => {
  // Simple auth check (in production, use proper authentication)
  const query = getQuery(event)
  if (query.admin !== 'true') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }

  return {
    cache: serverCache.getStats(),
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  }
})
