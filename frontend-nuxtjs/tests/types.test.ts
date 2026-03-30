import { describe, it, expect } from 'vitest'
import type { Card, List, Board } from '~/types'

describe('Types', () => {
  it('Card accepts valid shape', () => {
    const card: Card = {
      id: 1,
      title: 'Test Card',
      content: 'Description',
      position: 0,
      listId: 1
    }
    expect(card.id).toBe(1)
    expect(card.title).toBe('Test Card')
    expect(card.content).toBe('Description')
    expect(card.position).toBe(0)
    expect(card.listId).toBe(1)
  })

  it('Card content can be null', () => {
    const card: Card = {
      id: 1,
      title: 'Test Card',
      content: null,
      position: 0,
      listId: 1
    }
    expect(card.content).toBeNull()
  })

  it('List accepts valid shape with cards', () => {
    const list: List = {
      id: 1,
      title: 'Todo',
      position: 0,
      boardId: 1,
      cards: [
        { id: 1, title: 'Card 1', content: null, position: 0, listId: 1 },
        { id: 2, title: 'Card 2', content: 'Desc', position: 1, listId: 1 }
      ]
    }
    expect(list.cards).toHaveLength(2)
    expect(list.position).toBe(0)
  })

  it('Board accepts valid shape with lists', () => {
    const board: Board = {
      id: 1,
      title: 'My Board',
      userId: 1,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
      lists: [
        {
          id: 1,
          title: 'Todo',
          position: 0,
          boardId: 1,
          cards: []
        }
      ]
    }
    expect(board.lists).toHaveLength(1)
    expect(board.title).toBe('My Board')
  })
})
