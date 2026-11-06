'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { Modal } from '@heroui/react';
import { Button, ErrorText, Field, SelectInput, TextInput } from '@/components/ui/controls';
import { api, notifyMutated } from '@/lib/api-client';
import type { Habit, Task } from '@/types';
import { buildSessionPayload, nowLocalInput, validateSession } from './session-payload';

interface Props {
  open: boolean;
  onClose: () => void;
  habits: Pick<Habit, 'id' | 'name'>[];
  tasks?: Pick<Task, 'id' | 'title'>[];
  defaultHabitId?: string;
  /** Prefill for the minutes field (the focus timer uses this). */
  defaultMinutes?: number;
  /** A short note shown above the fields, e.g. that the timer's time was capped. */
  notice?: string;
  /** Called after a successful save so the page can confirm it. */
  onSaved?: (saved: { habitId: string; minutes: number }) => void;
}

const QUICK = [15, 25, 45, 60];

export function LogSessionDialog({ open, onClose, habits, tasks = [], defaultHabitId, defaultMinutes, notice, onSaved }: Props) {
  const [habitId, setHabitId] = useState('');
  const [minutes, setMinutes] = useState('');
  const [endedAt, setEndedAt] = useState('');
  const [taskId, setTaskId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    setHabitId(defaultHabitId ?? habits[0]?.id ?? '');
    setMinutes(defaultMinutes ? String(defaultMinutes) : '');
    setTaskId('');
    setEndedAt(nowLocalInput());
    setError(null);
  }, [open, defaultHabitId, defaultMinutes, habits]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const form = { habitId, minutes: Number(minutes), endedAtLocal: endedAt, taskId: taskId || undefined };
    const problem = validateSession(form);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      await api('/sessions', { method: 'POST', body: buildSessionPayload(form) });
      notifyMutated();
      onSaved?.({ habitId, minutes: form.minutes });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the session');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen={open} onOpenChange={(next) => !next && onClose()}>
      <Modal.Backdrop variant="opaque">
        <Modal.Container size="sm" placement="center">
          <Modal.Dialog aria-labelledby="log-session-title" className="p-0">
            <form onSubmit={submit} className="space-y-4 p-6" noValidate>
              <Modal.Header>
                <Modal.Heading id="log-session-title" className="text-lg font-semibold tracking-tight text-foreground">
                  Log study time
                </Modal.Heading>
              </Modal.Header>

              <Modal.Body className="space-y-4 text-foreground">
                {notice && <p className="text-sm leading-6 text-muted">{notice}</p>}

                <Field label="Habit">
                  <SelectInput value={habitId} onChange={(e) => setHabitId(e.target.value)}>
                    {habits.length === 0 && <option value="">No habits yet</option>}
                    {habits.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </SelectInput>
                </Field>

                <div>
                  <Field label="Minutes studied">
                    <TextInput type="number" inputMode="numeric" min={1} max={720} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
                  </Field>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {QUICK.map((q) => (
                      <Button
                        key={q}
                        type="button"
                        variant={minutes === String(q) ? 'primary' : 'secondary'}
                        aria-pressed={minutes === String(q)}
                        onClick={() => setMinutes(String(q))}
                        className="px-2"
                      >
                        {q}m
                      </Button>
                    ))}
                  </div>
                </div>

                <Field label="Finished at">
                  <TextInput type="datetime-local" value={endedAt} onChange={(e) => setEndedAt(e.target.value)} />
                </Field>

                {tasks.length > 0 && (
                  <Field label="Task (optional)">
                    <SelectInput value={taskId} onChange={(e) => setTaskId(e.target.value)}>
                      <option value="">No task</option>
                      {tasks.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                )}

                <ErrorText>{error}</ErrorText>
              </Modal.Body>

              <Modal.Footer>
                <Button type="button" variant="ghost" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" disabled={busy || habits.length === 0}>
                  {busy ? 'Saving…' : 'Save session'}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
