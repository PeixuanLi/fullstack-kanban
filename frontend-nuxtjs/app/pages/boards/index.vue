<script setup lang="ts">
const { user, logout } = useAuth()
const { $api } = useNuxtApp()
const toast = useToast()

const boards = ref<Board[]>([])
const loading = ref(true)
const showForm = ref(false)
const newTitle = ref('')
const error = ref('')
const deleteBoardId = ref<number | null>(null)
const deleteModalOpen = computed({
  get: () => deleteBoardId.value !== null,
  set: (v: boolean) => { if (!v) deleteBoardId.value = null }
})

const boardToDelete = computed(() =>
  boards.value.find(b => b.id === deleteBoardId.value)
)

async function fetchBoards() {
  try {
    boards.value = await $api<Board[]>('/boards')
  }
  catch {
    error.value = 'Failed to load boards'
  }
  finally {
    loading.value = false
  }
}

async function createBoard() {
  if (!newTitle.value.trim()) return
  try {
    const board = await $api<Board>('/boards', {
      method: 'POST',
      body: { title: newTitle.value.trim() }
    })
    boards.value.push(board)
    newTitle.value = ''
    showForm.value = false
  }
  catch {
    error.value = 'Failed to create board'
  }
}

async function deleteBoard() {
  if (!boardToDelete.value) return
  try {
    await $api(`/boards/${boardToDelete.value.id}`, { method: 'DELETE' })
    boards.value = boards.value.filter(b => b.id !== boardToDelete.value!.id)
    deleteBoardId.value = null
  }
  catch {
    error.value = 'Failed to delete board'
  }
}

function handleLogout() {
  logout()
  navigateTo('/', { replace: true })
}

onMounted(() => {
  fetchBoards()
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="flex items-center justify-between px-6 py-4 bg-elevated/50 backdrop-blur">
      <h1 class="text-xl font-bold text-primary">
        My Boards
      </h1>
      <div class="flex items-center gap-3">
        <span class="text-sm text-muted">{{ user?.username }}</span>
        <UColorModeButton />
        <UButton
          variant="ghost"
          size="sm"
          icon="i-lucide-log-out"
          @click="handleLogout"
        >
          Logout
        </UButton>
      </div>
    </header>

    <USeparator />

    <main class="p-6 min-h-[calc(100vh-65px)]">
      <UAlert
        v-if="error"
        color="error"
        icon="i-lucide-circle-x"
        :title="error"
        class="mb-4"
      />

      <div class="mb-6">
        <form
          v-if="showForm"
          class="flex gap-2"
          @submit.prevent="createBoard"
        >
          <UInput
            v-model="newTitle"
            placeholder="Board title"
            autofocus
          />
          <UButton type="submit">
            Create
          </UButton>
          <UButton
            type="button"
            variant="ghost"
            @click="showForm = false; newTitle = ''"
          >
            Cancel
          </UButton>
        </form>
        <UButton
          v-else
          icon="i-lucide-plus"
          @click="showForm = true"
        >
          New Board
        </UButton>
      </div>

      <div
        v-if="loading"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <USkeleton
          v-for="i in 4"
          :key="i"
          class="h-32 w-full"
        />
      </div>

      <UEmpty
        v-else-if="boards.length === 0"
        icon="i-lucide-folder"
        title="No boards yet"
        description="Create your first board to get started."
      >
        <UButton @click="showForm = true">
          Create Board
        </UButton>
      </UEmpty>

      <div
        v-else
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <UCard
          v-for="board in boards"
          :key="board.id"
          class="group transition-all hover:shadow-lg"
        >
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ board.title }}
            </h3>
            <p class="text-sm text-muted">
              Created {{ new Date(board.createdAt).toLocaleDateString() }}
            </p>
          </template>

          <template #footer>
            <div class="flex justify-between w-full">
              <UButton
                variant="ghost"
                class="flex-1 justify-start"
                @click="navigateTo(`/boards/${board.id}`)"
              >
                Open
              </UButton>
              <UButton
                variant="ghost"
                icon="i-lucide-trash"
                color="error"
                @click="deleteBoardId = board.id"
              />
            </div>
          </template>
        </UCard>
      </div>
    </main>

    <UModal v-model:open="deleteModalOpen">
      <template #header>
        <h3 class="text-lg font-semibold">
          Delete Board
        </h3>
      </template>
      <p class="text-muted">
        Are you sure you want to delete "{{ boardToDelete?.title }}"? This action cannot be undone.
      </p>
      <template #footer>
        <UButton
          variant="ghost"
          @click="deleteBoardId = null"
        >
          Cancel
        </UButton>
        <UButton
          color="error"
          @click="deleteBoard"
        >
          Delete
        </UButton>
      </template>
    </UModal>
  </div>
</template>
