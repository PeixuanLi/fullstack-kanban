interface User {
  username: string
}

export function useAuth() {
  const { $api } = useNuxtApp()
  const tokenCookie = useCookie<string | null>('token')
  const userCookie = useCookie<User | null>('user')

  const user = computed(() => userCookie.value)
  const isAuthenticated = computed(() => !!tokenCookie.value)
  const isLoading = ref(false)

  async function login(username: string, password: string) {
    isLoading.value = true
    try {
      const data = await $api<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: { username, password }
      })
      tokenCookie.value = data.access_token
      userCookie.value = { username }
    }
    finally {
      isLoading.value = false
    }
  }

  async function register(username: string, password: string) {
    isLoading.value = true
    try {
      const data = await $api<{ access_token: string }>('/auth/register', {
        method: 'POST',
        body: { username, password }
      })
      tokenCookie.value = data.access_token
      userCookie.value = { username }
    }
    finally {
      isLoading.value = false
    }
  }

  function logout() {
    tokenCookie.value = null
    userCookie.value = null
  }

  return { user, isAuthenticated, isLoading, login, register, logout }
}
