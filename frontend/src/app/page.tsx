'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function HomePage() {
  const { user, isLoading, login, register } = useAuth();
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      router.replace('/boards');
    }
  }, [user, isLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (isRegister) {
        await register(username, password);
      } else {
        await login(username, password);
      }
      router.push('/boards');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-900">
        <p className="text-zinc-400">Loading...</p>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-900">
      <div className="w-full max-w-sm rounded-lg bg-zinc-800 p-8 shadow-xl">
        <h1 className="mb-6 text-center text-2xl font-bold text-white">
          Kanban Board
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded border border-zinc-600 bg-zinc-700 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-zinc-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded border border-zinc-600 bg-zinc-700 px-3 py-2 text-white placeholder-zinc-400 focus:border-blue-500 focus:outline-none"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-zinc-400">
          {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
          <button
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-blue-400 hover:underline"
          >
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
}
