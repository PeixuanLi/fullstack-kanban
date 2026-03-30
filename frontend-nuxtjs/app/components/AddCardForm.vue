<script setup lang="ts">
const props = defineProps<{
  listId: number
}>()

const emit = defineEmits<{
  add: [listId: number, title: string]
}>()

const show = ref(false)
const title = ref('')
const submitting = ref(false)

async function handleSubmit() {
  if (!title.value.trim()) return
  submitting.value = true
  try {
    emit('add', props.listId, title.value.trim())
    title.value = ''
    show.value = false
  }
  finally {
    submitting.value = false
  }
}

function cancel() {
  show.value = false
  title.value = ''
}
</script>

<template>
  <UButton
    v-if="!show"
    variant="ghost"
    icon="i-lucide-plus"
    class="w-full justify-start text-muted"
    @click="show = true"
  >
    Add card
  </UButton>

  <form
    v-else
    class="flex flex-col gap-2"
    @submit.prevent="handleSubmit"
  >
    <UInput
      v-model="title"
      placeholder="Card title"
      autofocus
    />
    <div class="flex gap-2">
      <UButton
        type="submit"
        size="sm"
        :loading="submitting"
      >
        Add
      </UButton>
      <UButton
        type="button"
        variant="ghost"
        size="sm"
        @click="cancel"
      >
        Cancel
      </UButton>
    </div>
  </form>
</template>
