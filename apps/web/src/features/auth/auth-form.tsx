'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Button, ErrorText, Field, TextInput } from '@/components/ui/controls';
import { api } from '@/lib/api-client';

type Mode = 'login' | 'register';

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expired, setExpired] = useState(false);

  // Read the query after mount so server and client render the same first paint.
  useEffect(() => {
    setExpired(new URLSearchParams(window.location.search).get('reason') === 'expired');
  }, []);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    setError(null);
    try {
      await api(`/auth/${mode}`, {
        method: 'POST',
        body: {
          email: String(form.get('email')).trim(),
          password: String(form.get('password')),
          ...(mode === 'register' && { timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
        },
      });
      router.replace('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setBusy(false);
    }
  }

  const isLogin = mode === 'login';
  return (
    <div className="w-full">
      <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{isLogin ? 'Sign in to DevTrack' : 'Create your DevTrack account'}</h1>
      <p className="mt-1 text-sm leading-6 text-muted">
        {isLogin ? 'Pick up where you left off.' : 'Start with one habit and log the time you actually put in.'}
      </p>
      {expired && (
        <p role="status" className="mt-3 rounded-lg border border-line bg-surface-secondary px-3 py-2 text-sm text-muted">
          Your session ended. Sign in again.
        </p>
      )}
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <Field label="Email">
          <TextInput name="email" type="email" autoComplete="email" required autoFocus />
        </Field>
        <Field label="Password" hint={isLogin ? undefined : 'At least 8 characters'}>
          <TextInput name="password" type="password" autoComplete={isLogin ? 'current-password' : 'new-password'} required />
        </Field>
        <ErrorText>{error}</ErrorText>
        <Button type="submit" variant="primary" className="w-full" disabled={busy}>
          {busy ? (isLogin ? 'Signing in…' : 'Creating account…') : isLogin ? 'Sign in' : 'Create account'}
        </Button>
      </form>
      <p className="mt-6 text-sm text-muted">
        {isLogin ? 'First time here?' : 'Already have an account?'}{' '}
        <button
          type="button"
          onClick={() => {
            setMode(isLogin ? 'register' : 'login');
            setError(null);
          }}
          className="cursor-pointer rounded-sm text-accent underline underline-offset-4 transition-colors hover:text-accent-hover"
        >
          {isLogin ? 'Create an account' : 'Sign in'}
        </button>
      </p>
    </div>
  );
}
