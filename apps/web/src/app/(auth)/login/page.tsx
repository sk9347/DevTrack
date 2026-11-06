import type { Metadata } from 'next';
import { AuthForm } from '@/features/auth/auth-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <p className="mb-10 text-lg font-semibold tracking-tight">
          Dev<span className="text-accent">Track</span>
        </p>
      </div>
      <AuthForm />
    </main>
  );
}
