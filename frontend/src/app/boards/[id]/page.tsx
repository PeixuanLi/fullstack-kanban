'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeftIcon, TrashIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import type { Board as BoardType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
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
  const [alertOpen, setAlertOpen] = useState(false);

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
    try {
      await api.delete(`/boards/${board.id}`);
      setAlertOpen(false);
      router.push('/boards');
    } catch {
      setError('Failed to delete board');
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push('/boards')}>
            <ArrowLeftIcon data-icon="only" />
          </Button>
          <Separator orientation="vertical" className="h-6" />
          {editingTitle && board ? (
            <form onSubmit={handleTitleSave}>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleTitleSave}
                className="h-7 text-lg font-bold"
                autoFocus
              />
            </form>
          ) : (
            <h1
              onClick={() => board && setEditingTitle(true)}
              className="cursor-pointer text-lg font-bold hover:text-primary"
            >
              {board?.title || 'Board'}
            </h1>
          )}
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setAlertOpen(true)}
        >
          <TrashIcon data-icon="inline-start" />
          Delete Board
        </Button>
      </header>

      {/* Error */}
      {error && (
        <Alert variant="destructive" className="mx-6 mt-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Board */}
      <main className="flex-1">
        {board && <BoardComponent board={board} onUpdate={fetchBoard} />}
      </main>

      {/* Delete confirmation dialog */}
      <AlertDialog open={alertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Board</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{board?.title}"? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteBoard}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
