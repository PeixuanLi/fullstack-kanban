'use client';

import { Draggable } from '@hello-pangea/dnd';
import type { Card as CardType } from '@/lib/types';

interface CardProps {
  card: CardType;
  index: number;
  onEdit: (card: CardType) => void;
  onDelete: (id: number) => void;
}

export default function Card({ card, index, onEdit, onDelete }: CardProps) {
  return (
    <Draggable draggableId={`card-${card.id}`} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`group cursor-pointer rounded-lg border bg-white p-3 shadow-sm transition-shadow ${
            snapshot.isDragging
              ? 'rotate-2 border-blue-300 shadow-lg opacity-90'
              : 'border-zinc-200 hover:shadow-md'
          }`}
          onClick={() => onEdit(card)}
        >
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-medium text-zinc-800">
              {card.title}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete "${card.title}"?`)) onDelete(card.id);
              }}
              className="shrink-0 text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="Delete card"
            >
              &times;
            </button>
          </div>
          {card.content && (
            <p className="mt-1 text-xs text-zinc-500 line-clamp-3">
              {card.content}
            </p>
          )}
        </div>
      )}
    </Draggable>
  );
}
