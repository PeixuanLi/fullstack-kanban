'use client';

import { useState } from 'react';
import type { Card } from '@/lib/types';

interface CardEditModalProps {
  card: Card;
  onSave: (id: number, title: string, content: string | null) => Promise<void>;
  onClose: () => void;
}

export default function CardEditModal({ card, onSave, onClose }: CardEditModalProps) {
  const [title, setTitle] = useState(card.title);
  const [content, setContent] = useState(card.content || '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave(card.id, title.trim(), content.trim() || null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Title
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              Description
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
              placeholder="Add a description..."
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
