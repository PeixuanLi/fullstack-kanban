'use client';

import { useState, useCallback, type Dispatch, type SetStateAction } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import type { Board as BoardType, Card as CardType } from '@/lib/types';
import { api } from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import ListComponent from './List';
import AddListForm from './AddListForm';
import CardEditModal from './CardEditModal';

interface BoardProps {
  board: BoardType;
  onUpdate: () => void;
  onBoardChange: Dispatch<SetStateAction<BoardType | null>>;
}

export default function BoardComponent({ board, onUpdate, onBoardChange }: BoardProps) {
  const [editingCard, setEditingCard] = useState<CardType | null>(null);

  const sortedLists = board.lists
    .slice()
    .sort((a, b) => a.position - b.position);

  const onDragEnd = useCallback(
    async (result: DropResult) => {
      const { source, destination, draggableId } = result;
      if (!destination) return;
      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) {
        return;
      }

      const sourceListId = Number(source.droppableId.replace('list-', ''));
      const destListId = Number(destination.droppableId.replace('list-', ''));
      const cardId = Number(draggableId.replace('card-', ''));

      // Optimistic update — immediately reflect the move in local state
      onBoardChange((prev) => {
        if (!prev) return prev;
        const newLists = prev.lists.map((list) => {
          if (sourceListId === destListId && list.id === sourceListId) {
            const sorted = list.cards.slice().sort((a, b) => a.position - b.position);
            const [moved] = sorted.splice(source.index, 1);
            sorted.splice(destination.index, 0, moved);
            return { ...list, cards: sorted.map((c, i) => ({ ...c, position: i })) };
          }
          if (list.id === sourceListId) {
            return {
              ...list,
              cards: list.cards
                .filter((c) => c.id !== cardId)
                .sort((a, b) => a.position - b.position)
                .map((c, i) => ({ ...c, position: i })),
            };
          }
          if (list.id === destListId) {
            const sourceList = prev.lists.find((l) => l.id === sourceListId);
            const movedCard = sourceList?.cards.find((c) => c.id === cardId);
            if (!movedCard) return list;
            const sorted = list.cards.slice().sort((a, b) => a.position - b.position);
            sorted.splice(destination.index, 0, { ...movedCard, listId: destListId });
            return { ...list, cards: sorted.map((c, i) => ({ ...c, position: i })) };
          }
          return list;
        });
        return { ...prev, lists: newLists };
      });

      // Persist to server in background
      try {
        await api.put(`/cards/${cardId}/move`, {
          listId: destListId,
          position: destination.index,
        });
      } catch {
        // Revert on error
        onUpdate();
      }
    },
    [onBoardChange, onUpdate]
  );

  const handleAddList = useCallback(
    async (title: string) => {
      await api.post(`/boards/${board.id}/lists`, { title });
      onUpdate();
    },
    [board.id, onUpdate]
  );

  const handleDeleteList = useCallback(
    async (id: number, title: string) => {
      await api.delete(`/lists/${id}`);
      onUpdate();
    },
    [onUpdate]
  );

  const handleEditListTitle = useCallback(
    async (id: number, title: string) => {
      await api.patch(`/lists/${id}`, { title });
      onUpdate();
    },
    [onUpdate]
  );

  const handleAddCard = useCallback(
    async (listId: number, title: string) => {
      await api.post(`/lists/${listId}/cards`, { title });
      onUpdate();
    },
    [onUpdate]
  );

  const handleDeleteCard = useCallback(
    async (id: number) => {
      await api.delete(`/cards/${id}`);
      onUpdate();
    },
    [onUpdate]
  );

  const handleSaveCard = useCallback(
    async (id: number, title: string, content: string | null) => {
      await api.patch(`/cards/${id}`, { title, content });
      setEditingCard(null);
      onUpdate();
    },
    [onUpdate]
  );

  return (
    <>
      <DragDropContext onDragEnd={onDragEnd}>
        <ScrollArea className="p-6 bg-gradient-to-br from-background via-background to-primary/5">
          <div className="flex gap-4">
            {sortedLists.map((list) => (
              <ListComponent
                key={list.id}
                list={list}
                onAddCard={handleAddCard}
                onEditCard={setEditingCard}
                onDeleteCard={handleDeleteCard}
                onDeleteList={handleDeleteList}
                onEditTitle={handleEditListTitle}
              />
            ))}
            <AddListForm onAdd={handleAddList} />
          </div>
        </ScrollArea>
      </DragDropContext>

      {editingCard && (
        <CardEditModal
          card={editingCard}
          onSave={handleSaveCard}
          onClose={() => setEditingCard(null)}
        />
      )}
    </>
  );
}
