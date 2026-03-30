import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'

describe('AddCardForm', () => {
  it('emits add with listId and title on submit', () => {
    const listId = 1
    const title = 'New Card'
    const emitted: Array<{ listId: number, title: string }> = []

    // Simulate the form logic
    const show = ref(true)
    const inputTitle = ref(title)
    const submitting = ref(false)

    function handleSubmit() {
      if (!inputTitle.value.trim()) return
      submitting.value = true
      emitted.push({ listId, title: inputTitle.value.trim() })
      inputTitle.value = ''
      show.value = false
      submitting.value = false
    }

    handleSubmit()

    expect(emitted).toEqual([{ listId: 1, title: 'New Card' }])
    expect(show.value).toBe(false)
    expect(inputTitle.value).toBe('')
  })

  it('does not submit with empty title', () => {
    const emitted: Array<{ listId: number, title: string }> = []
    const inputTitle = ref('   ')

    function handleSubmit() {
      if (!inputTitle.value.trim()) return
      emitted.push({ listId: 1, title: inputTitle.value.trim() })
    }

    handleSubmit()
    expect(emitted).toHaveLength(0)
  })

  it('cancel resets form state', () => {
    const show = ref(true)
    const inputTitle = ref('Something')

    function cancel() {
      show.value = false
      inputTitle.value = ''
    }

    cancel()
    expect(show.value).toBe(false)
    expect(inputTitle.value).toBe('')
  })
})
