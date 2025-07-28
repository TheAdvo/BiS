// Authentication middleware for protecting dashboard routes
export default defineNuxtRouteMiddleware((to) => {
  // TODO: Replace with actual authentication logic
  // For now, this is a placeholder that can be activated later

  // Example implementation:
  // const { $auth } = useNuxtApp()
  // const user = $auth.user

  // if (!user) {
  //   return navigateTo('/login')
  // }

  // For development, allow access to all routes
  // Remove this when implementing real authentication
  return
})
