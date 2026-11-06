'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { formatDayLong } from '@/lib/format';
import { useFetch } from '@/lib/use-fetch';
import type { User } from '@/types';

const NAV = [
  { href: '/dashboard', label: 'Today' },
  { href: '/habits', label: 'Habits' },
  { href: '/tasks', label: 'Tasks' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/analytics', label: 'Analytics' },
] as const;

function NavLinks({ orientation }: { orientation: 'side' | 'bottom' }) {
  const pathname = usePathname();
  return (
    <>
      {NAV.map((item) => {
        const active = pathname.startsWith(item.href);
        const base = 'flex items-center transition-colors duration-150';
        const cls =
          orientation === 'side'
            ? `${base} min-h-11 rounded-md px-3 text-sm ${active ? 'bg-raised font-medium text-fg' : 'text-muted hover:bg-raised hover:text-fg'}`
            : `${base} min-h-14 flex-1 justify-center text-xs ${active ? 'font-medium text-accent' : 'text-muted'}`;
        return (
          <Link key={item.href} href={item.href} aria-current={active ? 'page' : undefined} className={cls}>
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data } = useFetch<{ user: User }>('/auth/me');
  const today = useFetch<{ date: string }>('/analytics/day');

  async function signOut() {
    await api('/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[14rem_1fr]">
      <aside className="hidden border-r border-line bg-surface md:flex md:flex-col">
        <p className="px-6 pb-6 pt-6 text-lg font-semibold tracking-tight">
          Dev<span className="text-accent">Track</span>
        </p>
        <nav aria-label="Primary" className="flex flex-col gap-1 px-3">
          <NavLinks orientation="side" />
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col pb-14 md:pb-0">
        <header className="flex min-h-14 items-center justify-between gap-4 border-b border-line px-5 md:px-8">
          <p className="text-sm text-muted">{today.data ? formatDayLong(today.data.date) : ' '}</p>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-48 truncate text-sm text-muted sm:inline">{data?.user.email}</span>
            <button
              onClick={signOut}
              className="min-h-11 cursor-pointer rounded-md px-3 text-sm text-muted transition-colors duration-150 hover:bg-raised hover:text-fg"
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-8 md:px-8">{children}</main>
      </div>

      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-10 flex border-t border-line bg-surface md:hidden">
        <NavLinks orientation="bottom" />
      </nav>
    </div>
  );
}
