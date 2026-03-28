'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import type { Board as BoardType } from '@/lib/types';
import BoardComponent from '@/components/Board';

export default function BoardDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const boardId = params.id as string;

  const [board, setBoard] = useState<BoardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState('');

  const fetchBoard = useCallback(async () => {
    try {
      const data = await api.get<BoardType>(`/boards/${boardId}`);
      setBoard(data);
      setTitle(data.title);
    } catch {
      setError('Failed to load board');
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
    if (user) {
      fetchBoard();
    }
  }, [user, authLoading, router, fetchBoard]);

  async function handleTitleSave(e?: React.FormEvent) {
    e?.preventDefault();
    if (!title.trim() || !board) return;
    try {
      await api.patch(`/boards/${board.id}`, { title: title.trim() });
      setBoard((prev) => (prev ? { ...prev, title: title.trim() } : prev));
      setEditingTitle(false);
    } catch {
      setError('Failed to update title');
    }
  }

  async function handleDeleteBoard() {
    if (!board) return;
    if (!confirm(`Delete board "${board.title}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/boards/${board.id}`);
      router.push('/boards');
    } catch {
      setError('Failed to delete board');
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-700">
      {/* Header */}
      <header className="flex items-center justify-between bg-zinc-800 px-6 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/boards')}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            &larr; Boards
          </button>
          <span className="text-zinc-600">|</span>
          {editingTitle && board ? (
            <form onSubmit={handleTitleSave}>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                autoFocus
                className="rounded border border-blue-400 bg-zinc-700 px-2 py-1 text-lg font-bold text-white focus:outline-none"
              />
            </form>
          ) : (
            <h1
              onClick={() => board && setEditingTitle(true)}
              className="cursor-pointer text-lg font-bold text-white hover:text-blue-300 transition-colors"
            >
              {board?.title || 'Board'}
            </h1>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDeleteBoard}
            className="rounded px-3 py-1 text-sm text-red-400 hover:bg-zinc-700"
          >
            Delete Board
          </button>
        </div>
      </header>

      {/* Error */}
      {error && (
        <p className="mx-6 mt-4 rounded bg-red-900/50 px-4 py-2 text-red-200">
          {error}
        </p>
      )}

      {/* Board */}
      {board && <BoardComponent board={board} onUpdate={fetchBoard} />}
    </div>
  );
}
