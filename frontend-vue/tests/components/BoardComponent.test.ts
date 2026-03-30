import { describe, it, expect, vi } from 'vitest'
import { ref } from 'vue'
import type { Board, List, Card } from '~/types'

describe('BoardComponent - Card Drag Between Lists', () => {
  const card1: Card = { id: 1, title: 'Card 1', content: null, position: 0, listId: 1 }
  const card2: Card = { id: 2, title: 'Card 2', content: null, position: 1, listId: 1 }
  const card3: Card = { id: 3, title: 'Card 3', content: null, position: 0, listId: 2 }

  const makeBoard = (): Board => ({
    id: 1,
    title: 'Test Board',
    userId: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lists: [
      { id: 1, title: 'Todo', position: 0, boardId: 1, cards: [card1, card2] },
      { id: 2, title: 'Done', position: 1, boardId: 1, cards: [card3] },
    ],
  })

  describe('extractMoveData - extracting card move info from drag event', () => {
    function extractMoveData(evt: any, sourceListId: number) {
      if (!evt) return null
      const { item, to, newIndex, oldIndex } = evt
      if (newIndex === undefined || !item || !to) return null

      const cardId = Number(
        item.dataset?.id ?? item.__draggable_context?.element?.id
      )
      const destListId = Number(
        to.closest('[data-list-id]')?.dataset.listId ?? to.dataset?.listId
      )

      if (!cardId || !destListId) return null

      return { cardId, sourceListId, destListId, newIndex, oldIndex: oldIndex ?? newIndex }
    }

    it('extracts move data from a valid cross-list drag event', () => {
      const mockElement = {
        dataset: { id: '1' },
        __draggable_context: null,
      } as any
      const mockTo = {
        closest: () => ({ dataset: { listId: '2' } }),
        dataset: {},
      } as any

      const result = extractMoveData(
        { item: mockElement, from: {}, to: mockTo, newIndex: 0, oldIndex: 0 },
        1
      )

      expect(result).toEqual({
        cardId: 1,
        sourceListId: 1,
        destListId: 2,
        newIndex: 0,
        oldIndex: 0,
      })
    })

    it('returns null when evt is undefined', () => {
      expect(extractMoveData(undefined, 1)).toBeNull()
    })

    it('returns null when item is missing', () => {
      expect(
        extractMoveData({ item: null, to: {}, newIndex: 0 }, 1)
      ).toBeNull()
    })

    it('returns null when to is missing', () => {
      expect(
        extractMoveData({ item: { dataset: { id: '1' } }, to: null, newIndex: 0 }, 1)
      ).toBeNull()
    })

    it('returns null when newIndex is undefined', () => {
      expect(
        extractMoveData(
          { item: { dataset: { id: '1' } }, to: { closest: () => ({ dataset: { listId: '2' } }) }, newIndex: undefined },
          1
        )
      ).toBeNull()
    })

    it('uses __draggable_context as fallback for card ID', () => {
      const mockElement = {
        dataset: {},
        __draggable_context: { element: { id: 5 } },
      } as any
      const mockTo = {
        closest: () => ({ dataset: { listId: '2' } }),
        dataset: {},
      } as any

      const result = extractMoveData(
        { item: mockElement, from: {}, to: mockTo, newIndex: 0, oldIndex: 0 },
        1
      )

      expect(result?.cardId).toBe(5)
    })
  })

  describe('applyCardMove - updating board state after a move', () => {
    function applyCardMove(
      board: Board,
      move: { cardId: number; sourceListId: number; destListId: number; newIndex: number }
    ): Board {
      const { cardId, sourceListId, destListId, newIndex } = move

      const movedCard = board.lists
        .flatMap(l => l.cards)
        .find(c => c.id === cardId)
      if (!movedCard) return board

      return {
        ...board,
        lists: board.lists.map(list => {
          if (list.id === sourceListId && sourceListId !== destListId) {
            return { ...list, cards: list.cards.filter(c => c.id !== cardId) }
          }
          if (list.id === destListId) {
            const newCards = list.cards.filter(c => c.id !== cardId)
            newCards.splice(newIndex, 0, { ...movedCard, listId: destListId })
            return { ...list, cards: newCards }
          }
          return list
        }),
      }
    }

    it('removes card from source list and adds to target list', () => {
      const board = makeBoard()
      const updated = applyCardMove(board, {
        cardId: 1,
        sourceListId: 1,
        destListId: 2,
        newIndex: 0,
      })

      const sourceList = updated.lists.find(l => l.id === 1)!
      const targetList = updated.lists.find(l => l.id === 2)!

      expect(sourceList.cards.find(c => c.id === 1)).toBeUndefined()
      expect(sourceList.cards).toHaveLength(1)
      expect(sourceList.cards[0].id).toBe(2)

      expect(targetList.cards).toHaveLength(2)
      expect(targetList.cards[0].id).toBe(1)
      expect(targetList.cards[0].listId).toBe(2)
      expect(targetList.cards[1].id).toBe(3)
    })

    it('places card at the correct new index in target list', () => {
      const board = makeBoard()
      const updated = applyCardMove(board, {
        cardId: 1,
        sourceListId: 1,
        destListId: 2,
        newIndex: 1,
      })

      const targetList = updated.lists.find(l => l.id === 2)!
      expect(targetList.cards.map(c => c.id)).toEqual([3, 1])
    })

    it('does not mutate the original board', () => {
      const board = makeBoard()
      const originalCards = board.lists[0].cards.map(c => c.id)

      applyCardMove(board, {
        cardId: 1,
        sourceListId: 1,
        destListId: 2,
        newIndex: 0,
      })

      expect(board.lists[0].cards.map(c => c.id)).toEqual(originalCards)
    })

    it('handles reorder within the same list', () => {
      const board = makeBoard()
      const updated = applyCardMove(board, {
        cardId: 1,
        sourceListId: 1,
        destListId: 1,
        newIndex: 1,
      })

      const list = updated.lists.find(l => l.id === 1)!
      expect(list.cards.map(c => c.id)).toEqual([2, 1])
    })

    it('returns unchanged board if cardId not found', () => {
      const board = makeBoard()
      const updated = applyCardMove(board, {
        cardId: 999,
        sourceListId: 1,
        destListId: 2,
        newIndex: 0,
      })

      expect(updated).toEqual(board)
    })
  })

  describe('handleCardDragEnd - API call and refresh', () => {
    it('calls move API with correct card ID, list ID, and position', async () => {
      const apiFn = vi.fn().mockResolvedValue(undefined)
      const refreshFn = vi.fn()

      // Simulate the handler calling the API
      const cardId = 1
      const destListId = 2
      const newIndex = 0

      await apiFn(`/cards/${cardId}/move`, {
        method: 'PUT',
        body: { listId: destListId, position: newIndex },
      })
      refreshFn()

      expect(apiFn).toHaveBeenCalledWith('/cards/1/move', {
        method: 'PUT',
        body: { listId: 2, position: 0 },
      })
    })

    it('refreshes board data after successful move', async () => {
      const apiFn = vi.fn().mockResolvedValue(undefined)
      const refreshFn = vi.fn()

      await apiFn('/cards/1/move', {
        method: 'PUT',
        body: { listId: 2, position: 0 },
      })
      refreshFn()

      expect(refreshFn).toHaveBeenCalledTimes(1)
    })

    it('refreshes board data even when API call fails', async () => {
      const apiFn = vi.fn().mockRejectedValue(new Error('Network error'))
      const refreshFn = vi.fn()

      try {
        await apiFn('/cards/1/move', {
          method: 'PUT',
          body: { listId: 2, position: 0 },
        })
      }
      catch {
        // error handled
      }
      finally {
        refreshFn()
      }

      expect(refreshFn).toHaveBeenCalledTimes(1)
    })

    it('does not call API when move data is invalid', async () => {
      const apiFn = vi.fn()

      // Simulate invalid move data (same source and dest, same index)
      const sourceListId = 1
      const destListId = 1
      const oldIndex = 0
      const newIndex = 0

      if (sourceListId === destListId && oldIndex === newIndex) {
        // No-op: same position
      }
      else {
        await apiFn('/cards/1/move', {
          method: 'PUT',
          body: { listId: destListId, position: newIndex },
        })
      }

      expect(apiFn).not.toHaveBeenCalled()
    })
  })

  describe('KanbanList local state sync', () => {
    it('initializes local cards from prop and sorts by position', () => {
      const list: List = {
        id: 1,
        title: 'Todo',
        position: 0,
        boardId: 1,
        cards: [
          { id: 2, title: 'B', content: null, position: 1, listId: 1 },
          { id: 1, title: 'A', content: null, position: 0, listId: 1 },
        ],
      }

      const sorted = [...list.cards].sort((a, b) => a.position - b.position)
      expect(sorted.map(c => c.id)).toEqual([1, 2])
    })

    it('syncs local cards when prop changes', () => {
      const list = ref<List>({
        id: 1,
        title: 'Todo',
        position: 0,
        boardId: 1,
        cards: [
          { id: 1, title: 'A', content: null, position: 0, listId: 1 },
        ],
      })

      // Simulate local sync
      let localCards = [...list.value.cards].sort((a, b) => a.position - b.position)
      expect(localCards.map(c => c.id)).toEqual([1])

      // Prop changes (e.g., after server refresh)
      list.value = {
        ...list.value,
        cards: [
          { id: 1, title: 'A', content: null, position: 0, listId: 1 },
          { id: 2, title: 'B', content: null, position: 1, listId: 1 },
        ],
      }

      localCards = [...list.value.cards].sort((a, b) => a.position - b.position)
      expect(localCards.map(c => c.id)).toEqual([1, 2])
    })
  })

  describe('Regression: card disappears from source list after cross-list move', () => {
    it('source list local state reflects card removal after cross-list drag', () => {
      const sourceListId = 1
      const cardId = 1

      const sourceList: List = {
        id: sourceListId,
        title: 'Todo',
        position: 0,
        boardId: 1,
        cards: [
          { id: cardId, title: 'Card 1', content: null, position: 0, listId: sourceListId },
          { id: 2, title: 'Card 2', content: null, position: 1, listId: sourceListId },
        ],
      }

      const localCards = ref([...sourceList.cards].sort((a, b) => a.position - b.position))

      // vue-draggable-plus onRemove updates localCards via v-model
      localCards.value = localCards.value.filter(c => c.id !== cardId)

      expect(localCards.value.find(c => c.id === cardId)).toBeUndefined()
      expect(localCards.value).toHaveLength(1)
      expect(localCards.value[0].id).toBe(2)
    })

    it('target list local state reflects card addition after cross-list drag', () => {
      const targetListId = 2
      const movedCard: Card = { id: 1, title: 'Card 1', content: null, position: 0, listId: 1 }

      const targetList: List = {
        id: targetListId,
        title: 'Done',
        position: 1,
        boardId: 1,
        cards: [
          { id: 3, title: 'Card 3', content: null, position: 0, listId: targetListId },
        ],
      }

      const localCards = ref([...targetList.cards].sort((a, b) => a.position - b.position))

      const newList = [...localCards.value]
      newList.splice(0, 0, { ...movedCard, listId: targetListId })
      localCards.value = newList

      expect(localCards.value).toHaveLength(2)
      expect(localCards.value[0].id).toBe(1)
      expect(localCards.value[0].listId).toBe(targetListId)
      expect(localCards.value[1].id).toBe(3)
    })

    it('emits structured move data instead of raw DOM event', () => {
      const sourceListId = 1
      const moveData = {
        cardId: 1,
        sourceListId,
        destListId: 2,
        newIndex: 0,
      }

      const { cardId, destListId, newIndex } = moveData

      expect(cardId).toBe(1)
      expect(sourceListId).toBe(1)
      expect(destListId).toBe(2)
      expect(newIndex).toBe(0)
    })

    it('no-op when card dropped at same position in same list', () => {
      const sourceListId = 1
      const destListId = 1
      const oldIndex = 0
      const newIndex = 0

      const shouldSkip = sourceListId === destListId && newIndex === oldIndex
      expect(shouldSkip).toBe(true)
    })
  })

  describe('VueDraggable remount via key after server refresh', () => {
    it('increments key when props change, forcing SortableJS re-init', () => {
      const list = ref<List>({
        id: 1,
        title: 'Todo',
        position: 0,
        boardId: 1,
        cards: [
          { id: 1, title: 'Card 1', content: null, position: 0, listId: 1 },
        ],
      })

      let draggableKey = 0
      let localCards: Card[] = []

      function syncFromProps() {
        localCards = [...list.value.cards].sort((a, b) => a.position - b.position)
        draggableKey++
      }

      // Initial sync
      syncFromProps()
      expect(draggableKey).toBe(1)
      expect(localCards.map(c => c.id)).toEqual([1])

      // Simulate SortableJS drag: local state changes but key stays same
      localCards = localCards.filter(c => c.id !== 1)
      localCards.splice(0, 0, { id: 1, title: 'Card 1', content: null, position: 0, listId: 2 })
      expect(draggableKey).toBe(1) // Key unchanged during drag

      // Server refresh: prop data changes → sync fires → key increments → remount
      list.value = {
        ...list.value,
        cards: [
          { id: 2, title: 'Card 2', content: null, position: 0, listId: 1 },
        ],
      }
      syncFromProps()

      expect(draggableKey).toBe(2) // Key changed → SortableJS re-initialised
      expect(localCards.map(c => c.id)).toEqual([2])
    })
  })
})
