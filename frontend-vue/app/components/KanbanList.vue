<script setup lang="ts">
import type { List, Card } from '~/types'
import { VueDraggable } from 'vue-draggable-plus'

const props = defineProps<{
  list: List
}>()

const emit = defineEmits<{
  addCard: [listId: number, title: string]
  editCard: [card: Card]
  deleteCard: [id: number]
  deleteList: [id: number]
  editTitle: [id: number, title: string]
  cardMoved: [evt: any]
}>()

const editing = ref(false)
const editTitle = ref(props.list.title)
const alertOpen = ref(false)

const sortedCards = computed(() =>
  [...props.list.cards].sort((a, b) => a.position - b.position)
)

function startEditing() {
  editTitle.value = props.list.title
  editing.value = true
}

async function handleTitleSubmit() {
  if (!editTitle.value.trim()) {
    editTitle.value = props.list.title
    editing.value = false
    return
  }
  emit('editTitle', props.list.id, editTitle.value.trim())
  editing.value = false
}

function handleDelete() {
  alertOpen.value = false
  emit('deleteList', props.list.id)
}

function onDragEnd(evt: any) {
  emit('cardMoved', evt)
}
</script>

<template>
  <UCard class="h-fit w-[280px] shrink-0">
    <template #header>
      <div class="flex items-center justify-between">
        <form
          v-if="editing"
          class="flex-1"
          @submit.prevent="handleTitleSubmit"
        >
          <UInput
            v-model="editTitle"
            class="h-7 text-sm font-semibold"
            autofocus
            @blur="handleTitleSubmit"
          />
        </form>
        <h3
          v-else
          class="cursor-pointer text-sm font-semibold hover:text-primary rounded px-2 py-1 transition-colors"
          @click="startEditing"
        >
          {{ list.title }}
        </h3>
        <UButton
          variant="ghost"
          size="xs"
          icon="i-lucide-x"
          @click="alertOpen = true"
        />
      </div>
    </template>

    <div class="flex flex-col gap-2 min-h-[8px] p-3 pt-0">
      <ClientOnly>
        <VueDraggable
          :model-value="sortedCards"
          group="cards"
          item-key="id"
          class="flex flex-col gap-2"
          @end="onDragEnd"
        >
          <KanbanCard
            v-for="card in sortedCards"
            :key="card.id"
            :card="card"
            @edit="emit('editCard', $event)"
            @delete="emit('deleteCard', $event)"
          />
        </VueDraggable>
      </ClientOnly>
    </div>

    <template #footer>
      <AddCardForm
        :list-id="list.id"
        @add="(listId, title) => emit('addCard', listId, title)"
      />
    </template>
  </UCard>

  <UModal v-model:open="alertOpen">
    <template #header>
      <h3 class="text-lg font-semibold">
        Delete List
      </h3>
    </template>
    <template #body>
      <p class="text-muted">
        Are you sure you want to delete "{{ list.title }}" and all its cards? This action cannot be undone.
      </p>
    </template>
    <template #footer>
      <UButton variant="ghost" @click="alertOpen = false">
        Cancel
      </UButton>
      <UButton color="error" @click="handleDelete">
        Delete
      </UButton>
    </template>
  </UModal>
</template>
