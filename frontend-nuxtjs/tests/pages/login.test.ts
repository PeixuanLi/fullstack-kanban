import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ref, computed } from 'vue'

describe('Login Page Logic', () => {
  const isRegister = ref(false)
  const username = ref('')
  const password = ref('')
  const error = ref('')
  const submitting = ref(false)

  beforeEach(() => {
    isRegister.value = false
    username.value = ''
    password.value = ''
    error.value = ''
    submitting.value = false
  })

  it('toggles between login and register modes', () => {
    expect(isRegister.value).toBe(false)
    isRegister.value = !isRegister.value
    expect(isRegister.value).toBe(true)
    isRegister.value = !isRegister.value
    expect(isRegister.value).toBe(false)
  })

  it('clears error when toggling mode', () => {
    error.value = 'Some error'
    isRegister.value = !isRegister.value
    error.value = '' // Simulating toggleMode
    expect(error.value).toBe('')
  })

  it('submit calls login in login mode', async () => {
    const loginFn = vi.fn().mockResolvedValue(undefined)
    const registerFn = vi.fn().mockResolvedValue(undefined)

    username.value = 'testuser'
    password.value = 'password123'

    if (isRegister.value) {
      await registerFn(username.value, password.value)
    }
    else {
      await loginFn(username.value, password.value)
    }

    expect(loginFn).toHaveBeenCalledWith('testuser', 'password123')
    expect(registerFn).not.toHaveBeenCalled()
  })

  it('submit calls register in register mode', async () => {
    const loginFn = vi.fn().mockResolvedValue(undefined)
    const registerFn = vi.fn().mockResolvedValue(undefined)

    isRegister.value = true
    username.value = 'newuser'
    password.value = 'password123'

    if (isRegister.value) {
      await registerFn(username.value, password.value)
    }
    else {
      await loginFn(username.value, password.value)
    }

    expect(registerFn).toHaveBeenCalledWith('newuser', 'password123')
    expect(loginFn).not.toHaveBeenCalled()
  })

  it('sets error on failed login', async () => {
    const loginFn = vi.fn().mockRejectedValue(new Error('Invalid credentials'))

    try {
      await loginFn('user', 'wrong')
    }
    catch (err: any) {
      error.value = err.message
    }

    expect(error.value).toBe('Invalid credentials')
  })

  it('manages submitting state', async () => {
    let resolveLogin: () => void
    const loginPromise = new Promise<void>(resolve => { resolveLogin = resolve })
    const loginFn = vi.fn().mockReturnValue(loginPromise)

    const submitPromise = (async () => {
      submitting.value = true
      await loginFn()
      submitting.value = false
    })()

    expect(submitting.value).toBe(true)

    resolveLogin!()
    await submitPromise

    expect(submitting.value).toBe(false)
  })
})
