'use client';

import { useState, useCallback } from 'react';
import { DragDropContext, type DropResult } from '@hello-pangea/dnd';
import type { Board as BoardType, List as ListType, Card as CardType } from '@/lib/types';
import { api } from '@/lib/api';
import { ScrollArea } from '@/components/ui/scroll-area';
import ListComponent from './List';
import AddListForm from './AddListForm';
import CardEditModal from './CardEditModal';

interface BoardProps {
  board: BoardType;
  onUpdate: () => void;
}

export default function BoardComponent({ board, onUpdate }: BoardProps) {
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

      try {
        if (sourceListId !== destListId) {
          // Cross-list move
          await api.put(`/cards/${cardId}/move`, {
            listId: destListId,
            position: destination.index,
          });
        } else {
          // Same-list reorder — need to calculate new positions
          const list = board.lists.find((l) => l.id === sourceListId);
          if (!list) return;
          const sorted = list.cards
            .slice()
            .sort((a, b) => a.position - b.position);
          const [moved] = sorted.splice(source.index, 1);
          sorted.splice(destination.index, 0, moved);
          const reorderData = sorted.map((c, i) => ({
            listId: c.listId,
            position: i,
          }));
          // For same-list reorder, we use the lists reorder endpoint for simplicity
          // Actually for cards in same list, we still use the move endpoint
          await api.put(`/cards/${cardId}/move`, {
            listId: sourceListId,
            position: destination.index,
          });
        }
        onUpdate();
      } catch {
        // Revert on error
        onUpdate();
      }
    },
    [board.lists, onUpdate]
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
