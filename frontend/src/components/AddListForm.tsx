'use client';

import { useState } from 'react';

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
      <button
        onClick={() => setShow(true)}
        className="h-fit shrink-0 rounded-lg bg-zinc-700 px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-600 transition-colors"
      >
        + Add list
      </button>
    );
  }

  return (
    <div className="h-fit shrink-0 w-[280px] rounded-lg bg-zinc-200 p-3">
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="List title"
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
            className="rounded px-3 py-1 text-sm text-zinc-500 hover:bg-zinc-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
