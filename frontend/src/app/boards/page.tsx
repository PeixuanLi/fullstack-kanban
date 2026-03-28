'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { LogOutIcon, PlusIcon, FolderIcon, TrashIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty';
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
import ThemeToggle from '@/components/theme-toggle';

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
  const [deleteBoardId, setDeleteBoardId] = useState<number | null>(null);

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
    try {
      await api.delete(`/boards/${id}`);
      setBoards((prev) => prev.filter((b) => b.id !== id));
      setDeleteBoardId(null);
    } catch {
      setError('Failed to delete board');
    }
  }

  const boardToDelete = boards.find((b) => b.id === deleteBoardId);

  if (authLoading || (!user && authLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">My Boards</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.username}</span>
          <ThemeToggle />
          <Button variant="ghost" size="sm" onClick={logout}>
            <LogOutIcon data-icon="inline-start" />
            Logout
          </Button>
        </div>
      </header>

      <Separator />

      <main className="p-6 bg-gradient-to-br from-background via-background to-primary/5 min-h-[calc(100vh-65px)]">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* New board button / form */}
        <div className="mb-6">
          {showForm ? (
            <form onSubmit={createBoard} className="flex gap-2">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Board title"
                autoFocus
              />
              <Button type="submit" size="default">
                Create
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false);
                  setNewTitle('');
                }}
              >
                Cancel
              </Button>
            </form>
          ) : (
            <Button onClick={() => setShowForm(true)}>
              <PlusIcon data-icon="inline-start" />
              New Board
            </Button>
          )}
        </div>

        {/* Boards grid */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : boards.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon"><FolderIcon /></EmptyMedia>
              <EmptyTitle>No boards yet</EmptyTitle>
              <EmptyDescription>Create your first board to get started.</EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button onClick={() => setShowForm(true)}>Create Board</Button>
            </EmptyContent>
          </Empty>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {boards.map((board) => (
              <Card key={board.id} className="group transition-all hover:shadow-lg hover:border-primary/50">
                <CardHeader>
                  <CardTitle className="text-lg">{board.title}</CardTitle>
                  <CardDescription>
                    Created {new Date(board.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="justify-between">
                  <Button
                    variant="ghost"
                    className="flex-1 justify-start hover:bg-primary/10 hover:text-primary"
                    onClick={() => router.push(`/boards/${board.id}`)}
                  >
                    Open
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteBoardId(board.id)}
                  >
                    <TrashIcon data-icon="only" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Delete confirmation dialog */}
      {boardToDelete && (
        <AlertDialog open={deleteBoardId === boardToDelete.id} onOpenChange={(open) => !open && setDeleteBoardId(null)}>
          <AlertDialogContent size="sm">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Board</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{boardToDelete.title}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteBoard(boardToDelete.id, boardToDelete.title)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
