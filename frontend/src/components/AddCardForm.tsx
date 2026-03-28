'use client';

import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import type { Card as CardType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AddCardFormProps {
  listId: number;
  onAdd: (listId: number, title: string, content?: string) => Promise<void>;
}

export default function AddCardForm({ listId, onAdd }: AddCardFormProps) {
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(listId, title.trim());
      setTitle('');
      setShow(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!show) {
    return (
      <Button
        variant="ghost"
        className="w-full justify-start text-muted-foreground"
        onClick={() => setShow(true)}
      >
        <PlusIcon data-icon="inline-start" />
        Add card
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Card title"
        autoFocus
      />
      <div className="flex gap-2">
        <Button type="submit" disabled={submitting} size="sm">
          Add
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setShow(false);
            setTitle('');
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
