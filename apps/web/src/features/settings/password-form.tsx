'use client';

import { useState, type FormEvent } from 'react';
import { Button, ErrorText, Field, TextInput } from '@/components/ui/controls';
import { api } from '@/lib/api-client';

/** Same limits as the API (8-128 characters), checked first so an obvious slip never costs a request. */
export function validatePasswordChange(current: string, next: string, confirm: string): string | null {
  if (!current) return 'Enter your current password';
  if (next.length < 8) return 'New password must be at least 8 characters';
  if (next.length > 128) return 'New password must be at most 128 characters';
  if (next === current) return 'New password must be different from the current one';
  if (next !== confirm) return 'The new passwords do not match';
  return null;
}

export function PasswordForm() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: FormEvent) {
    e.preventDefault();
    setStatus(null);
    const problem = validatePasswordChange(current, next, confirm);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    try {
      await api('/auth/password', { method: 'POST', body: { currentPassword: current, newPassword: next } });
      setCurrent('');
      setNext('');
      setConfirm('');
      setStatus('Password changed. Use the new one next time you sign in.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change the password');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} noValidate aria-label="Change password" className="max-w-md space-y-3">
      <Field label="Current password">
        <TextInput type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </Field>
      <Field label="New password" hint="At least 8 characters">
        <TextInput type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
      </Field>
      <Field label="Confirm new password">
        <TextInput type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      <ErrorText>{error}</ErrorText>
      <Button type="submit" variant="primary" disabled={busy}>
        Change password
      </Button>
      {status && (
        <p role="status" className="text-sm text-success">
          {status}
        </p>
      )}
    </form>
  );
}
