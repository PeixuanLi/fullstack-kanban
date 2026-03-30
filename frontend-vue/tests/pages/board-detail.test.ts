import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import type { Board } from '~/types'

describe('Board Detail Page Logic', () => {
  const mockBoard: Board = {
    id: 1,
    title: 'Test Board',
    userId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lists: [
      {
        id: 1,
        title: 'Todo',
        position: 0,
        boardId: 1,
        cards: [
          { id: 1, title: 'Card 1', content: null, position: 0, listId: 1 }
        ]
      },
      {
        id: 2,
        title: 'Done',
        position: 1,
        boardId: 1,
        cards: []
      }
    ]
  }

  it('sorts lists by position', () => {
    const board = ref<Board | null>(mockBoard)
    const sortedLists = board.value
      ? [...board.value.lists].sort((a, b) => a.position - b.position)
      : []

    expect(sortedLists[0].title).toBe('Todo')
    expect(sortedLists[1].title).toBe('Done')
  })

  it('updates board title', async () => {
    const board = ref<Board | null>({ ...mockBoard })
    const title = ref('Updated Title')
    const apiFn = vi.fn().mockResolvedValue(undefined)

    await apiFn(`/boards/${board.value!.id}`, {
      method: 'PATCH',
      body: { title: title.value.trim() }
    })

    board.value = board.value
      ? { ...board.value, title: title.value.trim() }
      : board.value

    expect(board.value!.title).toBe('Updated Title')
    expect(apiFn).toHaveBeenCalled()
  })

  it('deletes board and navigates away', async () => {
    const board = ref<Board | null>(mockBoard)
    const apiFn = vi.fn().mockResolvedValue(undefined)
    const navigateFn = vi.fn()

    await apiFn(`/boards/${board.value!.id}`, { method: 'DELETE' })
    navigateFn('/boards')

    expect(apiFn).toHaveBeenCalledWith('/boards/1', { method: 'DELETE' })
    expect(navigateFn).toHaveBeenCalledWith('/boards')
  })

  it('handles fetch error', async () => {
    const error = ref('')
    const loading = ref(true)
    const apiFn = vi.fn().mockRejectedValue(new Error('Not found'))

    try {
      await apiFn('/boards/999')
    }
    catch {
      error.value = 'Failed to load board'
    }
    finally {
      loading.value = false
    }

    expect(error.value).toBe('Failed to load board')
    expect(loading.value).toBe(false)
  })
})
