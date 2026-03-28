'use client';

import { useState } from 'react';
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

// Cache for computed colors
let colorCache: { bg: string; fg: string } | null = null;
let isDarkCache: boolean | null = null;

function getDragColors() {
  const isDark = document.documentElement.classList.contains('dark');

  // Return cached values if theme hasn't changed
  if (colorCache && isDarkCache === isDark) {
    return colorCache;
  }

  // Create a temporary element to get computed colors
  const temp = document.createElement('div');
  temp.className = 'bg-card text-card-foreground';
  temp.style.position = 'absolute';
  temp.style.visibility = 'hidden';
  document.body.appendChild(temp);

  const computed = window.getComputedStyle(temp);
  colorCache = {
    bg: computed.backgroundColor,
    fg: computed.color,
  };
  isDarkCache = isDark;

  document.body.removeChild(temp);
  return colorCache;
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
          const dragStyle = snapshot.isDragging
            ? {
                backgroundColor: getDragColors().bg,
                color: getDragColors().fg,
              }
            : {};

          return (
            <div
              ref={provided.innerRef}
              {...provided.draggableProps}
              {...provided.dragHandleProps}
              style={{
                ...provided.draggableProps.style,
                ...dragStyle,
              }}
              className={`group cursor-pointer rounded-xl border bg-card p-3 shadow-sm transition-all ${
                snapshot.isDragging
                  ? 'rotate-2 border-primary shadow-lg shadow-primary/20 scale-105'
                  : 'border-border hover:border-primary/30 hover:shadow-md hover:shadow-primary/5'
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
