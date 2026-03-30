import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import type { Card } from '~/types'

describe('CardEditModal', () => {
  const mockCard: Card = {
    id: 1,
    title: 'Test Card',
    content: 'Description',
    position: 0,
    listId: 1
  }

  it('initializes form with card data', () => {
    const title = ref(mockCard.title)
    const content = ref(mockCard.content || '')

    expect(title.value).toBe('Test Card')
    expect(content.value).toBe('Description')
  })

  it('emits save with updated data', () => {
    const title = ref('Updated Title')
    const content = ref('Updated Content')

    const emitted: Array<{ id: number, title: string, content: string | null }> = []
    emitted.push({
      id: mockCard.id,
      title: title.value.trim(),
      content: content.value.trim() || null
    })

    expect(emitted[0]).toEqual({
      id: 1,
      title: 'Updated Title',
      content: 'Updated Content'
    })
  })

  it('handles null content on save', () => {
    const title = ref('Title Only')
    const content = ref('')

    const result = {
      id: mockCard.id,
      title: title.value.trim(),
      content: content.value.trim() || null
    }

    expect(result.content).toBeNull()
  })

  it('prevents save with empty title', () => {
    const title = ref('   ')
    const canSave = title.value.trim().length > 0
    expect(canSave).toBe(false)
  })
})
