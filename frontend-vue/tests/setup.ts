import { vi } from 'vitest'

// Mock Nuxt auto-imported globals
vi.stubGlobal('defineNuxtPlugin', (fn: any) => fn)
vi.stubGlobal('navigateTo', vi.fn((path: string) => path))
vi.stubGlobal('useCookie', vi.fn((name: string) => {
  let value: any = null
  return {
    get value() { return value },
    set value(v: any) { value = v }
  }
}))
vi.stubGlobal('useRuntimeConfig', vi.fn(() => ({
  public: {
    apiBase: 'http://localhost:3001'
  }
})))
vi.stubGlobal('useNuxtApp', vi.fn(() => ({
  $api: vi.fn()
})))
vi.stubGlobal('useState', vi.fn((key: string, init: () => any) => {
  return ref(init())
}))
vi.stubGlobal('useToast', vi.fn(() => ({
  add: vi.fn(),
  remove: vi.fn(),
  clear: vi.fn()
})))
vi.stubGlobal('ref', (await import('vue')).ref)
vi.stubGlobal('computed', (await import('vue')).computed)
vi.stubGlobal('reactive', (await import('vue')).reactive)
vi.stubGlobal('useHead', vi.fn())
vi.stubGlobal('useSeoMeta', vi.fn())
vi.stubGlobal('useRoute', vi.fn(() => ({ params: {} })))
vi.stubGlobal('useRouter', vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  forward: vi.fn()
})))
vi.stubGlobal('useAsyncData', vi.fn())
vi.stubGlobal('useFetch', vi.fn())
vi.stubGlobal('definePageMeta', vi.fn())
vi.stubGlobal('definePage', vi.fn())
vi.stubGlobal('setPageLayout', vi.fn())
vi.stubGlobal('useRequestURL', vi.fn(() => ({
  origin: 'http://localhost:3000'
})))
vi.stubGlobal('useColorMode', vi.fn(() => ({
  preference: ref('system'),
  value: ref('light')
})))

// Import ref/computed from vue for the stubs above
async function setup() {
  const { ref: vueRef, computed: vueComputed } = await import('vue')
  vi.stubGlobal('ref', vueRef)
  vi.stubGlobal('computed', vueComputed)
}
setup()
