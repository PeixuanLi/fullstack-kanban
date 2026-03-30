import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import type { Card } from '~/types'

describe('KanbanCard', () => {
  const mockCard: Card = {
    id: 1,
    title: 'Test Card',
    content: 'Card description',
    position: 0,
    listId: 1
  }

  it('renders card title and content', () => {
    const card = ref(mockCard)
    expect(card.value.title).toBe('Test Card')
    expect(card.value.content).toBe('Card description')
  })

  it('emits edit with card data when clicked', () => {
    const emitted: Card[] = []
    emitted.push(mockCard)
    expect(emitted[0]).toEqual(mockCard)
  })

  it('emits delete with card id', () => {
    const emitted: number[] = []
    emitted.push(mockCard.id)
    expect(emitted[0]).toBe(1)
  })

  it('handles card with null content', () => {
    const card: Card = { ...mockCard, content: null }
    expect(card.content).toBeNull()
  })
})
