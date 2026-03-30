<script setup lang="ts">
const route = useRoute('/boards/[boardId]')
const { $api } = useNuxtApp()

const board = ref<Board | null>(null)
const loading = ref(true)
const error = ref('')
const editingTitle = ref(false)
const title = ref('')
const deleteModalOpen = ref(false)

async function fetchBoard() {
  try {
    const data = await $api<Board>(`/boards/${route.params.boardId}`)
    board.value = data
    title.value = data.title
  }
  catch {
    error.value = 'Failed to load board'
  }
  finally {
    loading.value = false
  }
}

async function handleTitleSave() {
  if (!title.value.trim() || !board.value) return
  try {
    await $api(`/boards/${board.value.id}`, {
      method: 'PATCH',
      body: { title: title.value.trim() }
    })
    if (board.value) {
      board.value.title = title.value.trim()
    }
    editingTitle.value = false
  }
  catch {
    error.value = 'Failed to update title'
  }
}

async function handleDeleteBoard() {
  if (!board.value) return
  try {
    await $api(`/boards/${board.value.id}`, { method: 'DELETE' })
    deleteModalOpen.value = false
    navigateTo('/boards')
  }
  catch {
    error.value = 'Failed to delete board'
  }
}

function updateBoard(newBoard: Board | null) {
  board.value = newBoard
}

onMounted(() => {
  fetchBoard()
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-background">
    <header class="flex items-center justify-between border-b px-6 py-3 bg-elevated/50 backdrop-blur">
      <div class="flex items-center gap-3">
        <UButton
          variant="ghost"
          icon="i-lucide-arrow-left"
          @click="navigateTo('/boards')"
        />
        <USeparator orientation="vertical" class="h-6" />
        <form
          v-if="editingTitle && board"
          @submit.prevent="handleTitleSave"
        >
          <UInput
            v-model="title"
            class="h-7 text-lg font-bold"
            autofocus
            @blur="handleTitleSave"
          />
        </form>
        <h1
          v-else
          class="cursor-pointer text-lg font-bold hover:text-primary transition-colors"
          @click="board && (editingTitle = true)"
        >
          {{ board?.title || 'Board' }}
        </h1>
      </div>
      <div class="flex items-center gap-2">
        <UColorModeButton />
        <UButton
          color="error"
          size="sm"
          icon="i-lucide-trash"
          @click="deleteModalOpen = true"
        >
          Delete Board
        </UButton>
      </div>
    </header>

    <UAlert
      v-if="error"
      color="error"
      icon="i-lucide-circle-x"
      :title="error"
      class="mx-6 mt-4"
    />

    <main class="flex-1">
      <BoardComponent
        v-if="board"
        :board="board"
        :on-update="fetchBoard"
        :on-board-change="updateBoard"
      />
    </main>

    <UModal v-model:open="deleteModalOpen">
      <template #header>
        <h3 class="text-lg font-semibold">
          Delete Board
        </h3>
      </template>
      <p class="text-muted">
        Are you sure you want to delete "{{ board?.title }}"? This cannot be undone.
      </p>
      <template #footer>
        <UButton variant="ghost" @click="deleteModalOpen = false">
          Cancel
        </UButton>
        <UButton color="error" @click="handleDeleteBoard">
          Delete
        </UButton>
      </template>
    </UModal>
  </div>
</template>
