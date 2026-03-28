'use client';

import { useState } from 'react';

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
      <button
        onClick={() => setShow(true)}
        className="w-full rounded-lg py-2 text-left text-sm text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
      >
        + Add card
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Card title"
        autoFocus
        className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Add
        </button>
        <button
          type="button"
          onClick={() => {
            setShow(false);
            setTitle('');
          }}
          className="rounded px-3 py-1 text-sm text-zinc-500 hover:bg-zinc-100"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
