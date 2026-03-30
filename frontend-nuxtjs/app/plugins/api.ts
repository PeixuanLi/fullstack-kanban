export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  const api = $fetch.create({
    baseURL: config.public.apiBase,
    onRequest({ options }) {
      const token = useCookie('token')
      if (token.value) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token.value}`
        } as HeadersInit
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        const tokenCookie = useCookie('token')
        const userCookie = useCookie('user')
        tokenCookie.value = null
        userCookie.value = null
        navigateTo('/', { replace: true })
      }
    }
  })

  return {
    provide: {
      api
    }
  }
})
