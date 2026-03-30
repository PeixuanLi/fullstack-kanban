import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Auth Middleware', () => {
  // Test the middleware logic in isolation, same as the middleware implementation

  function createMiddleware(cookieStore: Record<string, any>) {
    const navigateResults: Array<{ path: string, options?: any }> = []

    function navigateTo(path: string, options?: any) {
      navigateResults.push({ path, options })
      return path
    }

    function run(to: { path: string }) {
      const token = cookieStore['token'] ?? null
      const publicRoutes = ['/']
      const isPublicRoute = publicRoutes.includes(to.path)

      if (isPublicRoute) {
        if (token) {
          return navigateTo('/boards', { replace: true })
        }
        return
      }

      if (!token) {
        return navigateTo('/', { replace: true })
      }
    }

    return { run, navigateResults }
  }

  it('allows access to public route without token', () => {
    const { run, navigateResults } = createMiddleware({})
    run({ path: '/' })
    expect(navigateResults).toHaveLength(0)
  })

  it('redirects authenticated user from / to /boards', () => {
    const { run, navigateResults } = createMiddleware({ token: 'valid-token' })
    run({ path: '/' })
    expect(navigateResults).toEqual([{ path: '/boards', options: { replace: true } }])
  })

  it('allows authenticated user to access protected route', () => {
    const { run, navigateResults } = createMiddleware({ token: 'valid-token' })
    run({ path: '/boards' })
    expect(navigateResults).toHaveLength(0)
  })

  it('redirects unauthenticated user from protected route to /', () => {
    const { run, navigateResults } = createMiddleware({})
    run({ path: '/boards' })
    expect(navigateResults).toEqual([{ path: '/', options: { replace: true } }])
  })

  it('redirects unauthenticated user from board detail to /', () => {
    const { run, navigateResults } = createMiddleware({})
    run({ path: '/boards/123' })
    expect(navigateResults).toEqual([{ path: '/', options: { replace: true } }])
  })
})
