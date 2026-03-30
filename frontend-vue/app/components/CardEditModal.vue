<script setup lang="ts">
import type { Card } from '~/types'

const props = defineProps<{
  card: Card
}>()

const emit = defineEmits<{
  save: [id: number, title: string, content: string | null]
  close: []
}>()

const title = ref(props.card.title)
const content = ref(props.card.content || '')
const saving = ref(false)

async function handleSubmit() {
  if (!title.value.trim()) return
  saving.value = true
  try {
    emit('save', props.card.id, title.value.trim(), content.value.trim() || null)
  }
  finally {
    saving.value = false
  }
}

function handleClose() {
  emit('close')
}
</script>

<template>
  <UModal :open="true" @update:open="handleClose">
    <template #header>
      <h3 class="text-lg font-semibold">
        Edit Card
      </h3>
    </template>

    <form
      class="flex flex-col gap-4"
      @submit.prevent="handleSubmit"
    >
      <UFormField label="Title" name="title">
        <UInput
          v-model="title"
          autofocus
        />
      </UFormField>

      <UFormField label="Description" name="content">
        <UTextarea
          v-model="content"
          :rows="4"
          placeholder="Add a description..."
        />
      </UFormField>
    </form>

    <template #footer>
      <UButton
        variant="ghost"
        @click="handleClose"
      >
        Cancel
      </UButton>
      <UButton
        :loading="saving"
        @click="handleSubmit"
      >
        {{ saving ? 'Saving...' : 'Save' }}
      </UButton>
    </template>
  </UModal>
</template>
