'use client';

import { useState, type FormEvent } from 'react';
import { Button, ErrorText, Field, TextInput } from '@/components/ui/controls';
import { api } from '@/lib/api-client';
import { timerKey } from '@/features/timer/timer-core';

/** Inline two-step, like every destructive action here: reveal the password check, then "Confirm delete / Keep". */
export function DeleteAccount({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function close() {
    setOpen(false);
    setPassword('');
    setError(null);
  }

  async function confirm(e: FormEvent) {
    e.preventDefault();
    if (!password) return setError('Enter your password to confirm');
    setBusy(true);
    setError(null);
    try {
      await api('/auth/me', { method: 'DELETE', body: { password } });
      try {
        window.localStorage.removeItem(timerKey(userId));
      } catch {
        // storage unavailable: nothing to clear
      }
      // Full navigation: the server already cleared the cookie, and no cached page should outlive the account.
      window.location.assign('/login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete the account');
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md">
      <p className="text-sm text-muted">
        Permanently deletes your account with all habits, tasks and study sessions. This cannot be undone. Download your data first if you want a copy.
      </p>
      {open ? (
        <form onSubmit={confirm} noValidate aria-label="Delete account" className="mt-3 space-y-3">
          <Field label="Your password">
            <TextInput type="password" autoComplete="current-password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <ErrorText>{error}</ErrorText>
          <div className="flex gap-1">
            <Button type="submit" variant="danger" disabled={busy}>
              Confirm delete
            </Button>
            <Button type="button" variant="ghost" onClick={close} disabled={busy}>
              Keep
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="danger" className="mt-3 border border-line-strong" onClick={() => setOpen(true)}>
          Delete account
        </Button>
      )}
    </div>
  );
}
