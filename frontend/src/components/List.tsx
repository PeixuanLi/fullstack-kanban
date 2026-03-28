'use client';

import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { XIcon } from 'lucide-react';
import type { List as ListType, Card as CardType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
  const [alertOpen, setAlertOpen] = useState(false);

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

  const handleDeleteList = () => {
    setAlertOpen(false);
    onDeleteList(list.id, list.title);
  };

  return (
    <>
      <Card className="h-fit w-[280px] shrink-0 bg-muted">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3">
          {editing ? (
            <form onSubmit={handleTitleSubmit} className="flex-1">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => handleTitleSubmit()}
                className="h-7 text-sm font-semibold"
                autoFocus
              />
            </form>
          ) : (
            <CardTitle
              onClick={() => setEditing(true)}
              className="cursor-pointer text-sm hover:bg-muted-foreground/10 rounded px-2 py-1"
            >
              {list.title}
            </CardTitle>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setAlertOpen(true)}
          >
            <XIcon data-icon="only" />
          </Button>
        </CardHeader>

        <Droppable droppableId={`list-${list.id}`}>
          {(provided) => (
            <CardContent
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="p-3 pt-0 flex flex-col gap-2 min-h-[8px]"
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
            </CardContent>
          )}
        </Droppable>

        <CardFooter className="p-3">
          <AddCardForm listId={list.id} onAdd={onAddCard} />
        </CardFooter>
      </Card>

      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete List</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{list.title}" and all its cards? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteList}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
