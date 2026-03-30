<script setup lang="ts">
const emit = defineEmits<{
  add: [title: string]
}>()

const show = ref(false)
const title = ref('')
const submitting = ref(false)

async function handleSubmit() {
  if (!title.value.trim()) return
  submitting.value = true
  try {
    emit('add', title.value.trim())
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
    variant="secondary"
    icon="i-lucide-plus"
    class="h-fit shrink-0"
    @click="show = true"
  >
    Add list
  </UButton>

  <UCard
    v-else
    class="h-fit shrink-0 w-[280px] border-dashed"
  >
    <form
      class="flex flex-col gap-2"
      @submit.prevent="handleSubmit"
    >
      <UInput
        v-model="title"
        placeholder="List title"
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
  </UCard>
</template>
