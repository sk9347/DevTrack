'use client';

import { useState, type FormEvent } from 'react';
import { Button, EmptyState, ErrorText, Field, LoadError, Skeleton, TextInput } from '@/components/ui/controls';
import { api, notifyMutated } from '@/lib/api-client';
import { formatMinutes } from '@/lib/format';
import { useFetch } from '@/lib/use-fetch';
import type { Habit } from '@/types';

export const HABIT_COLORS = ['#4cc38a', '#6fa8e8', '#d9a24f', '#c88adf', '#e57f9a', '#5fc4c4'];

/** Shared by the add form and the inline editor so both enforce the same limits with the same words. */
export function validateHabit(name: string, dailyTargetMinutes: string, targetFrequency: string): { error: string } | { value: { name: string; dailyTargetMinutes: number; targetFrequency: number } } {
  if (!name.trim()) return { error: 'Give the habit a name' };
  const minutes = Number(dailyTargetMinutes);
  const days = Number(targetFrequency);
  if (!Number.isInteger(minutes) || minutes < 5 || minutes > 720) return { error: 'Daily target must be between 5 and 720 minutes' };
  if (!Number.isInteger(days) || days < 1 || days > 7) return { error: 'Days a week must be between 1 and 7' };
  return { value: { name: name.trim(), dailyTargetMinutes: minutes, targetFrequency: days } };
}

function ColorChoice({ value, onChange, name }: { value: string; onChange: (c: string) => void; name: string }) {
  return (
    <div className="flex gap-1">
      {HABIT_COLORS.map((c) => (
        <label key={c} className="flex size-11 cursor-pointer items-center justify-center">
          <input type="radio" name={name} value={c} checked={value === c} onChange={() => onChange(c)} className="peer sr-only" aria-label={c} />
          <span className="size-6 rounded-full ring-offset-2 ring-offset-canvas transition-shadow duration-150 peer-checked:ring-2 peer-checked:ring-fg peer-focus-visible:ring-2 peer-focus-visible:ring-accent" style={{ backgroundColor: c }} />
        </label>
      ))}
    </div>
  );
}

function EditHabit({ habit, onDone }: { habit: Habit; onDone: () => void }) {
  const [name, setName] = useState(habit.name);
  const [minutes, setMinutes] = useState(String(habit.dailyTargetMinutes));
  const [days, setDays] = useState(String(habit.targetFrequency));
  const [color, setColor] = useState(habit.color);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    const checked = validateHabit(name, minutes, days);
    if ('error' in checked) return setError(checked.error);
    setBusy(true);
    try {
      await api(`/habits/${habit.id}`, { method: 'PATCH', body: { ...checked.value, color } });
      notifyMutated();
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the habit');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} noValidate aria-label={`Edit ${habit.name}`} className="w-full space-y-3 py-3">
      <Field label="Name">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Minutes a day">
          <TextInput type="number" inputMode="numeric" min={5} max={720} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </Field>
        <Field label="Days a week">
          <TextInput type="number" inputMode="numeric" min={1} max={7} value={days} onChange={(e) => setDays(e.target.value)} />
        </Field>
      </div>
      <ColorChoice value={color} onChange={setColor} name={`color-${habit.id}`} />
      <p className="text-xs text-muted">New targets apply to every day, including past ones.</p>
      <ErrorText>{error}</ErrorText>
      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={busy}>
          Save
        </Button>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function HabitsManager() {
  const { data: habits, error: loadError, loading, reload } = useFetch<Habit[]>('/habits');
  const [name, setName] = useState('');
  const [dailyTargetMinutes, setDaily] = useState('30');
  const [targetFrequency, setFreq] = useState('5');
  const [color, setColor] = useState(HABIT_COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  async function add(e: FormEvent) {
    e.preventDefault();
    const checked = validateHabit(name, dailyTargetMinutes, targetFrequency);
    if ('error' in checked) return setError(checked.error);
    try {
      await api('/habits', {
        method: 'POST',
        body: { ...checked.value, color },
      });
      setName('');
      setError(null);
      notifyMutated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the habit');
    }
  }

  async function archive(id: string) {
    try {
      await api(`/habits/${id}`, { method: 'DELETE' });
      setConfirming(null);
      notifyMutated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not archive the habit');
    }
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_20rem]">
      <section aria-labelledby="habit-list">
        <h2 id="habit-list" className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Active habits
        </h2>
        {loading && !habits ? (
          <Skeleton className="h-24" />
        ) : loadError ? (
          <LoadError what="your habits" message={loadError} onRetry={() => void reload()} />
        ) : habits && habits.length > 0 ? (
          <ul className="divide-y divide-line border-y border-line">
            {habits.map((h) =>
              editing === h.id ? (
                <li key={h.id} className="flex items-center gap-3">
                  <EditHabit habit={h} onDone={() => setEditing(null)} />
                </li>
              ) : (
                <li key={h.id} className="flex min-h-14 items-center gap-3 py-2">
                  <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: h.color }} aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{h.name}</p>
                    <p className="text-sm text-muted">
                      <span className="num">{formatMinutes(h.dailyTargetMinutes)}</span> a day, <span className="num">{h.targetFrequency}</span> days a week
                    </p>
                  </div>
                  {confirming === h.id ? (
                    <div className="flex gap-1">
                      <Button variant="danger" onClick={() => archive(h.id)}>
                        Confirm archive
                      </Button>
                      <Button variant="ghost" onClick={() => setConfirming(null)}>
                        Keep
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Button variant="ghost" onClick={() => setEditing(h.id)} aria-label={`Edit ${h.name}`}>
                        Edit
                      </Button>
                      <Button variant="ghost" onClick={() => setConfirming(h.id)} aria-label={`Archive ${h.name}`}>
                        Archive
                      </Button>
                    </div>
                  )}
                </li>
              ),
            )}
          </ul>
        ) : (
          <EmptyState title="No habits yet">Add a habit like DSA or System Design, then log study time against it.</EmptyState>
        )}
        <p className="mt-3 text-sm text-muted">Archived habits keep their past study time in your history.</p>
      </section>

      <form onSubmit={add} className="space-y-4" noValidate aria-label="Add a habit">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">New habit</h2>
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="e.g. System Design" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Minutes a day" hint="Counts the day as met">
            <TextInput type="number" inputMode="numeric" min={5} max={720} value={dailyTargetMinutes} onChange={(e) => setDaily(e.target.value)} />
          </Field>
          <Field label="Days a week">
            <TextInput type="number" inputMode="numeric" min={1} max={7} value={targetFrequency} onChange={(e) => setFreq(e.target.value)} />
          </Field>
        </div>
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium">Colour</legend>
          <ColorChoice value={color} onChange={setColor} name="color" />
        </fieldset>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" variant="primary" className="w-full">
          Add habit
        </Button>
      </form>
    </div>
  );
}
