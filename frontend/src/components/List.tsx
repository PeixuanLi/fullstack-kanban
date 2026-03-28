'use client';

import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import type { List as ListType, Card as CardType } from '@/lib/types';
import CardComponent from './Card';
import AddCardForm from './AddCardForm';

interface ListProps {
  list: ListType;
  onAddCard: (listId: number, title: string, content?: string) => Promise<void>;
  onEditCard: (card: CardType) => void;
  onDeleteCard: (id: number) => void;
  onDeleteList: (id: number, title: string) => void;
  onEditTitle: (id: number, title: string) => Promise<void>;
}

export default function List({
  list,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onDeleteList,
  onEditTitle,
}: ListProps) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(list.title);

  async function handleTitleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!title.trim()) {
      setTitle(list.title);
      setEditing(false);
      return;
    }
    await onEditTitle(list.id, title.trim());
    setEditing(false);
  }

  return (
    <div className="h-fit w-[280px] shrink-0 rounded-lg bg-zinc-200 p-3">
      {/* List header */}
      <div className="mb-2 flex items-center justify-between">
        {editing ? (
          <form onSubmit={handleTitleSubmit} className="flex-1">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => handleTitleSubmit()}
              autoFocus
              className="w-full rounded border border-blue-400 px-2 py-1 text-sm font-semibold focus:outline-none"
            />
          </form>
        ) : (
          <h3
            onClick={() => setEditing(true)}
            className="cursor-pointer px-2 py-1 text-sm font-semibold text-zinc-800 hover:bg-zinc-300 rounded"
          >
            {list.title}
          </h3>
        )}
        <button
          onClick={() => onDeleteList(list.id, list.title)}
          className="ml-1 text-zinc-400 hover:text-red-500 text-lg leading-none"
          title="Delete list"
        >
          &times;
        </button>
      </div>

      {/* Cards */}
      <Droppable droppableId={`list-${list.id}`}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-2 min-h-[8px]"
          >
            {list.cards
              .slice()
              .sort((a, b) => a.position - b.position)
              .map((card, index) => (
                <CardComponent
                  key={card.id}
                  card={card}
                  index={index}
                  onEdit={onEditCard}
                  onDelete={onDeleteCard}
                />
              ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Add card */}
      <div className="mt-2">
        <AddCardForm listId={list.id} onAdd={onAddCard} />
      </div>
    </div>
  );
}
