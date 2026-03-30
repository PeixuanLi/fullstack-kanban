export default defineNuxtRouteMiddleware((to) => {
  const tokenCookie = useCookie<string | null>('token')
  const publicRoutes = ['/']
  const isPublicRoute = publicRoutes.includes(to.path)

  if (isPublicRoute) {
    if (tokenCookie.value) {
      return navigateTo('/boards', { replace: true })
    }
    return
  }

  if (!tokenCookie.value) {
    return navigateTo('/', { replace: true })
  }
})
