import type { Metadata } from 'next';
import { Panel } from '@/components/ui/controls';
import { AuthForm } from '@/features/auth/auth-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-lg bg-accent text-accent-ink">
            <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 4h6a8 8 0 0 1 0 16H5z" />
              <path d="M10 8v8" />
            </svg>
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Dev<span className="text-accent">Track</span>
          </span>
        </div>
        <Panel className="p-6 sm:p-7">
          <AuthForm />
        </Panel>
        <p className="mt-6 text-center text-xs leading-5 text-muted">Daily learning, measured honestly.</p>
      </div>
    </main>
  );
}
