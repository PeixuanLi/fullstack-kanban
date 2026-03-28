'use client';

import { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import type { List as ListType, Card as CardType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface AddListFormProps {
  onAdd: (title: string) => Promise<void>;
}

export default function AddListForm({ onAdd }: AddListFormProps) {
  const [show, setShow] = useState(false);
  const [title, setTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await onAdd(title.trim());
      setTitle('');
      setShow(false);
    } finally {
      setSubmitting(false);
    }
  }

  if (!show) {
    return (
      <Button
        variant="secondary"
        className="h-fit shrink-0 hover:bg-primary/10 hover:text-primary transition-colors"
        onClick={() => setShow(true)}
      >
        <PlusIcon data-icon="inline-start" />
        Add list
      </Button>
    );
  }

  return (
    <Card className="h-fit shrink-0 w-[280px] bg-muted/50 backdrop-blur supports-[backdrop-filter]:bg-muted/50 border-primary/20 border-dashed">
      <CardContent className="p-3">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="List title"
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
      </CardContent>
    </Card>
  );
}
