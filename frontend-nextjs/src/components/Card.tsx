'use client';

import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Draggable } from '@hello-pangea/dnd';
import { XIcon } from 'lucide-react';
import type { Card as CardType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface CardProps {
  card: CardType;
  index: number;
  onEdit: (card: CardType) => void;
  onDelete: (id: number) => void;
}

export default function Card({ card, index, onEdit, onDelete }: CardProps) {
  const [alertOpen, setAlertOpen] = useState(false);

  const handleDelete = () => {
    setAlertOpen(false);
    onDelete(card.id);
  };

  return (
    <>
      <Draggable draggableId={`card-${card.id}`} index={index}>
        {(provided, snapshot) => {
          const child = (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={provided.draggableProps.style}
              className={`group cursor-pointer rounded-xl border bg-card text-card-foreground p-3 shadow-sm ${
                snapshot.isDragging
                  ? 'border-primary shadow-lg shadow-primary/20'
                  : 'transition-colors transition-shadow border-border hover:border-primary/30 hover:shadow-md hover:shadow-primary/5'
              }`}
              onClick={() => onEdit(card)}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-medium group-hover:text-primary transition-colors">
                  {card.title}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAlertOpen(true);
                  }}
                >
                  <XIcon data-icon="only" />
                </Button>
              </div>
              {card.content && (
                <p className="mt-1 text-sm text-muted-foreground line-clamp-3">
                  {card.content}
                </p>
              )}
            </div>
          );

          if (snapshot.isDragging) {
            return createPortal(child, document.body);
          }

          return child;
        }}
      </Draggable>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{card.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
