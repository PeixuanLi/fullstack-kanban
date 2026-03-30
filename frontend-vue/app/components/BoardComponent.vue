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

async function handleCardDragEnd(evt: any) {
  const { item, from, to, newIndex } = evt
  if (newIndex === undefined) return

  const cardId = Number(item.dataset?.id || item.__draggable_context?.element?.id)
  const destListId = Number(to.closest('[data-list-id]')?.dataset.listId || to.dataset?.listId)

  if (!cardId || !destListId) return

  // Optimistic update
  const sourceListId = Number(from.closest('[data-list-id]')?.dataset.listId || from.dataset?.listId)
  const movedCard = props.board.lists
    .flatMap(l => l.cards)
    .find(c => c.id === cardId)
  if (!movedCard) return

  props.onBoardChange({
    ...props.board,
    lists: props.board.lists.map(list => {
      if (list.id === sourceListId && sourceListId !== destListId) {
        return { ...list, cards: list.cards.filter(c => c.id !== cardId) }
      }
      if (list.id === destListId) {
        const newCards = list.cards.filter(c => c.id !== cardId)
        newCards.splice(newIndex, 0, { ...movedCard, listId: destListId })
        return { ...list, cards: newCards }
      }
      return list
    })
  })

  try {
    await $api(`/cards/${cardId}/move`, {
      method: 'PUT',
      body: { listId: destListId, position: newIndex }
    })
  }
  catch {
    props.onUpdate()
  }
}

async function handleAddList(title: string) {
  await $api(`/boards/${props.board.id}/lists`, {
    method: 'POST',
    body: { title }
  })
  props.onUpdate()
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
          <template #item="{ element: list }">
            <div :data-list-id="list.id">
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
          </template>
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
