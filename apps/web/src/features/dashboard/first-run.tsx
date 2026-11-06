'use client';

import { useState, type FormEvent } from 'react';
import { Button, ErrorText, Field, TextInput } from '@/components/ui/controls';
import { api, notifyMutated } from '@/lib/api-client';

/** Shown on Today until the first habit exists: one thing to do, nothing zeroed to look at. */
export function FirstRun() {
  const [name, setName] = useState('');
  const [minutes, setMinutes] = useState('30');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const daily = Number(minutes);
    if (!name.trim()) return setError('Give the habit a name');
    if (!Number.isInteger(daily) || daily < 5 || daily > 720) return setError('Daily target must be between 5 and 720 minutes');
    setBusy(true);
    setError(null);
    try {
      await api('/habits', { method: 'POST', body: { name: name.trim(), dailyTargetMinutes: daily } });
      notifyMutated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not add the habit');
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="first-run" className="mt-8 max-w-md">
      <h2 id="first-run" className="text-lg font-semibold">
        Add your first habit
      </h2>
      <p className="mt-1 text-sm text-muted">A habit is something you study on a schedule, like DSA or System Design. Then log time against it and watch the days add up.</p>
      <form onSubmit={submit} noValidate className="mt-5 space-y-4" aria-label="Add your first habit">
        <Field label="Name">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="e.g. System Design" autoFocus />
        </Field>
        <Field label="Minutes a day" hint="A day counts as met when you reach this">
          <TextInput type="number" inputMode="numeric" min={5} max={720} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" variant="primary" disabled={busy}>
          {busy ? 'Adding…' : 'Add habit'}
        </Button>
      </form>
    </section>
  );
}
