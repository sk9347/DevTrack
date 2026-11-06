'use client';

import { useState, type FormEvent } from 'react';
import { Button, EmptyState, ErrorText, Skeleton, TextInput } from '@/components/ui/controls';
import { api, notifyMutated } from '@/lib/api-client';
import { formatMinutes } from '@/lib/format';
import { useFetch } from '@/lib/use-fetch';
import type { Task } from '@/types';

export function TasksPanel({ date }: { date: string }) {
  const { data: tasks, error: loadError, loading } = useFetch<Task[]>(`/tasks?date=${date}`);
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function run(fn: () => Promise<unknown>) {
    setError(null);
    try {
      await fn();
      notifyMutated();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  }

  function add(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return setError('Give the task a title');
    void run(async () => {
      await api('/tasks', { method: 'POST', body: { title: title.trim(), dueDate: date } });
      setTitle('');
    });
  }

  return (
    <div>
      {loading && !tasks ? (
        <div className="space-y-2">
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
        </div>
      ) : loadError ? (
        <ErrorText>{loadError}</ErrorText>
      ) : tasks && tasks.length > 0 ? (
        <ul className="divide-y divide-line border-y border-line">
          {tasks.map((t) => (
            <li key={t.id} className="flex min-h-12 items-center gap-3 py-1">
              <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={t.status === 'DONE'}
                  onChange={(e) => run(() => api(`/tasks/${t.id}`, { method: 'PATCH', body: { status: e.target.checked ? 'DONE' : 'TODO' } }))}
                  className="size-5 cursor-pointer accent-[var(--accent)]"
                />
                <span className={t.status === 'DONE' ? 'text-muted line-through' : ''}>{t.title}</span>
              </label>
              {t.loggedMinutes > 0 && <span className="num text-sm text-muted">{formatMinutes(t.loggedMinutes)}</span>}
              <button
                onClick={() => run(() => api(`/tasks/${t.id}`, { method: 'DELETE' }))}
                aria-label={`Delete task ${t.title}`}
                className="min-h-11 min-w-11 cursor-pointer rounded-md text-sm text-muted transition-colors duration-150 hover:bg-raised hover:text-danger"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No tasks for this day">Add one below to plan what you will study.</EmptyState>
      )}

      <form onSubmit={add} className="mt-3 flex gap-2" noValidate>
        <label className="sr-only" htmlFor={`new-task-${date}`}>
          New task
        </label>
        <TextInput id={`new-task-${date}`} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Learn database indexing" maxLength={200} />
        <Button type="submit">Add task</Button>
      </form>
      <div className="mt-2">
        <ErrorText>{error}</ErrorText>
      </div>
    </div>
  );
}
