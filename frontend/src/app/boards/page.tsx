'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface Board {
  id: number;
  title: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export default function BoardsPage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [error, setError] = useState('');

  const fetchBoards = useCallback(async () => {
    try {
      const data = await api.get<Board[]>('/boards');
      setBoards(data);
    } catch {
      setError('Failed to load boards');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
      return;
    }
    if (user) {
      fetchBoards();
    }
  }, [user, authLoading, router, fetchBoards]);

  async function createBoard(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    try {
      const board = await api.post<Board>('/boards', { title: newTitle.trim() });
      setBoards((prev) => [...prev, board]);
      setNewTitle('');
      setShowForm(false);
    } catch {
      setError('Failed to create board');
    }
  }

  async function deleteBoard(id: number, title: string) {
    if (!confirm(`Delete board "${title}"?`)) return;
    try {
      await api.delete(`/boards/${id}`);
      setBoards((prev) => prev.filter((b) => b.id !== id));
    } catch {
      setError('Failed to delete board');
    }
  }

  if (authLoading || (!user && authLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-700 bg-zinc-800 px-6 py-4">
        <h1 className="text-xl font-bold text-white">My Boards</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">{user?.username}</span>
          <button
            onClick={logout}
            className="rounded px-3 py-1 text-sm text-zinc-300 hover:bg-zinc-700"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="p-6">
        {error && (
          <p className="mb-4 rounded bg-red-900/50 px-4 py-2 text-red-200">{error}</p>
        )}

        {/* New board button / form */}
        <div className="mb-6">
          {showForm ? (
            <form onSubmit={createBoard} className="flex gap-2">
              <input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Board title"
                autoFocus
                className="rounded border border-zinc-600 bg-zinc-700 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setNewTitle('');
                }}
                className="rounded px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-700"
              >
                Cancel
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + New Board
            </button>
          )}
        </div>

        {/* Boards grid */}
        {loading ? (
          <p className="text-zinc-400">Loading boards...</p>
        ) : boards.length === 0 ? (
          <p className="text-zinc-500">No boards yet. Create your first board!</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {boards.map((board) => (
              <div
                key={board.id}
                className="group relative rounded-lg bg-zinc-800 p-5 shadow transition hover:bg-zinc-750 hover:shadow-lg"
              >
                <button
                  onClick={() => deleteBoard(board.id, board.title)}
                  className="absolute right-3 top-3 hidden text-zinc-500 hover:text-red-400 group-hover:block"
                  title="Delete board"
                >
                  &times;
                </button>
                <button
                  onClick={() => router.push(`/boards/${board.id}`)}
                  className="text-left"
                >
                  <h2 className="text-lg font-semibold text-white">
                    {board.title}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Created {new Date(board.createdAt).toLocaleDateString()}
                  </p>
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
