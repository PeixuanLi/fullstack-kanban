<script setup lang="ts">
import type { Card } from '~/types'

const props = defineProps<{
  card: Card
}>()

const emit = defineEmits<{
  edit: [card: Card]
  delete: [id: number]
}>()

const alertOpen = ref(false)

function handleDelete() {
  alertOpen.value = false
  emit('delete', props.card.id)
}
</script>

<template>
  <div
    :data-id="card.id"
    class="group cursor-pointer rounded-xl border bg-elevated p-3 shadow-sm transition-colors hover:border-primary/30 hover:shadow-md"
    @click="emit('edit', card)"
  >
    <div class="flex items-start justify-between gap-2">
      <span class="text-sm font-medium group-hover:text-primary transition-colors">
        {{ card.title }}
      </span>
      <UButton
        variant="ghost"
        size="xs"
        icon="i-lucide-x"
        class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        @click.stop="alertOpen = true"
      />
    </div>
    <p
      v-if="card.content"
      class="mt-1 text-sm text-muted line-clamp-3"
    >
      {{ card.content }}
    </p>
  </div>

  <UModal v-model:open="alertOpen">
    <template #header>
      <h3 class="text-lg font-semibold">
        Delete Card
      </h3>
    </template>
    <template #body>
      <p class="text-muted">
        Are you sure you want to delete "{{ card.title }}"? This action cannot be undone.
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
