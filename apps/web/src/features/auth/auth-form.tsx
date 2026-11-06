'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { Button, ErrorText, Field, TextInput } from '@/components/ui/controls';
import { api } from '@/lib/api-client';

type Mode = 'login' | 'register';

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold">{isLogin ? 'Sign in to DevTrack' : 'Create your DevTrack account'}</h1>
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
          className="cursor-pointer text-accent underline underline-offset-4 hover:brightness-110"
        >
          {isLogin ? 'Create an account' : 'Sign in'}
        </button>
      </p>
    </div>
  );
}
