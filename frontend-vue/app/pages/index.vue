<script setup lang="ts">
const { isAuthenticated, isLoading, login, register } = useAuth()

const isRegister = ref(false)
const username = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

// Redirect if already authenticated
watchEffect(() => {
  if (!isLoading.value && isAuthenticated.value) {
    navigateTo('/boards', { replace: true })
  }
})

async function handleSubmit() {
  error.value = ''
  submitting.value = true
  try {
    if (isRegister.value) {
      await register(username.value, password.value)
    }
    else {
      await login(username.value, password.value)
    }
    navigateTo('/boards')
  }
  catch (err: any) {
    error.value = err.data?.message || err.message || 'Operation failed'
  }
  finally {
    submitting.value = false
  }
}

function toggleMode() {
  isRegister.value = !isRegister.value
  error.value = ''
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background relative">
    <div class="absolute top-4 right-4">
      <UColorModeButton />
    </div>

    <UCard class="w-full max-w-sm">
      <template #header>
        <h1 class="text-center text-2xl font-bold">
          Kanban Board
        </h1>
        <p class="text-center text-sm text-muted">
          {{ isRegister ? 'Create a new account' : 'Sign in to your account' }}
        </p>
      </template>

      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <UFormField label="Username" name="username">
          <UInput
            v-model="username"
            type="text"
            required
            placeholder="Enter username"
          />
        </UFormField>

        <UFormField label="Password" name="password">
          <UInput
            v-model="password"
            type="password"
            required
            placeholder="Enter password"
          />
        </UFormField>

        <UAlert
          v-if="error"
          color="error"
          icon="i-lucide-circle-x"
          :title="error"
        />

        <UButton
          type="submit"
          block
          :loading="submitting"
        >
          {{ submitting ? 'Please wait...' : isRegister ? 'Register' : 'Login' }}
        </UButton>
      </form>

      <template #footer>
        <p class="text-center text-sm text-muted w-full">
          {{ isRegister ? 'Already have an account?' : "Don't have an account?" }}
          <UButton
            variant="link"
            @click="toggleMode"
          >
            {{ isRegister ? 'Login' : 'Register' }}
          </UButton>
        </p>
      </template>
    </UCard>
  </div>
</template>
