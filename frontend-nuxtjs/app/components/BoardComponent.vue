<script setup lang="ts">
import type { Board, Card } from '~/types'
import { VueDraggable } from 'vue-draggable-plus'

const props = defineProps<{
  board: Board
  onUpdate: () => void
  onBoardChange: (board: Board | null) => void
}>()

const { $api } = useNuxtApp()
const editingCard = ref<Card | null>(null)

const sortedLists = computed(() =>
  [...props.board.lists].sort((a, b) => a.position - b.position)
)

async function handleCardDragEnd(moveData: { cardId: number; sourceListId: number; destListId: number; newIndex: number }) {
  const { cardId, destListId, newIndex } = moveData

  try {
    await $api(`/cards/${cardId}/move`, {
      method: 'PUT',
      body: { listId: destListId, position: newIndex },
    })
  }
  finally {
    props.onUpdate()
  }
}

async function handleAddList(title: string) {
  await $api(`/boards/${props.board.id}/lists`, {
    method: 'POST',
    body: { title }
  })
  await props.onUpdate()
}

async function handleDeleteList(id: number) {
  await $api(`/lists/${id}`, { method: 'DELETE' })
  props.onUpdate()
}

async function handleEditListTitle(id: number, title: string) {
  await $api(`/lists/${id}`, {
    method: 'PATCH',
    body: { title }
  })
  props.onUpdate()
}

async function handleAddCard(listId: number, title: string) {
  await $api(`/lists/${listId}/cards`, {
    method: 'POST',
    body: { title }
  })
  props.onUpdate()
}

async function handleDeleteCard(id: number) {
  await $api(`/cards/${id}`, { method: 'DELETE' })
  props.onUpdate()
}

async function handleSaveCard(id: number, title: string, content: string | null) {
  await $api(`/cards/${id}`, {
    method: 'PATCH',
    body: { title, content }
  })
  editingCard.value = null
  props.onUpdate()
}
</script>

<template>
  <UScrollArea class="p-6 h-full" orientation="horizontal">
    <div class="flex gap-4">
      <ClientOnly>
        <VueDraggable
          :model-value="sortedLists"
          group="lists"
          item-key="id"
          class="flex gap-4"
        >
          <div v-for="list in sortedLists" :key="list.id" :data-list-id="list.id">
            <KanbanList
              :list="list"
              @add-card="handleAddCard"
              @edit-card="editingCard = $event"
              @delete-card="handleDeleteCard"
              @delete-list="handleDeleteList"
              @edit-title="handleEditListTitle"
              @card-moved="handleCardDragEnd"
            />
          </div>
        </VueDraggable>
      </ClientOnly>

      <AddListForm @add="handleAddList" />
    </div>
  </UScrollArea>

  <CardEditModal
    v-if="editingCard"
    :card="editingCard"
    @save="handleSaveCard"
    @close="editingCard = null"
  />
</template>
