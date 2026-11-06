'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Drawer } from '@heroui/react';
import { Button } from '@/components/ui/controls';
import { api } from '@/lib/api-client';
import { TimerBar } from '@/features/timer/timer-bar';
import { TimerProvider } from '@/features/timer/timer-context';
import { formatDayLong } from '@/lib/format';
import { useFetch } from '@/lib/use-fetch';
import type { User } from '@/types';

type IconName = 'today' | 'habits' | 'tasks' | 'calendar' | 'analytics' | 'settings';

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: '/dashboard', label: 'Today', icon: 'today' },
  { href: '/habits', label: 'Habits', icon: 'habits' },
  { href: '/tasks', label: 'Tasks', icon: 'tasks' },
  { href: '/calendar', label: 'Calendar', icon: 'calendar' },
  { href: '/analytics', label: 'Analytics', icon: 'analytics' },
];

function Icon({ name, className = 'size-4' }: { name: IconName; className?: string }) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  switch (name) {
    case 'today':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4m0-14.2-1.4 1.4M6.3 17.7l-1.4 1.4" />
        </svg>
      );
    case 'habits':
      return (
        <svg {...common}>
          <path d="m17 2 4 4-4 4" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <path d="m7 22-4-4 4-4" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      );
    case 'tasks':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="m8 12 3 3 5-6" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...common}>
          <rect x="3" y="5" width="18" height="16" rx="3" />
          <path d="M8 3v4m8-4v4M3 10h18" />
        </svg>
      );
    case 'analytics':
      return (
        <svg {...common}>
          <path d="M4 20V10m6 10V4m6 16v-7m4 7H2" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.9 19.3a1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 8.9 4.6 1.7 1.7 0 0 0 10 3.05V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 8.9c.14.6.65 1.05 1.55 1.05H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1.05Z" />
        </svg>
      );
  }
}

function Logo({ onClick }: { onClick?: () => void }) {
  return (
    <Link href="/dashboard" onClick={onClick} className="flex min-h-11 items-center gap-2.5 rounded-lg">
      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-accent text-accent-ink">
        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M5 4h6a8 8 0 0 1 0 16H5z" />
          <path d="M10 8v8" />
        </svg>
      </span>
      <span className="text-base font-semibold tracking-tight">
        Dev<span className="text-accent">Track</span>
      </span>
    </Link>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      {NAV.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? 'page' : undefined}
            className={`relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150 ${
              active ? 'bg-accent-soft font-medium text-accent' : 'text-muted hover:bg-surface-secondary hover:text-foreground'
            }`}
          >
            {active && <span className="absolute inset-y-2.5 left-0 w-0.5 rounded-full bg-accent" aria-hidden />}
            <Icon name={item.icon} />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

function SettingsLink({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = pathname.startsWith('/settings');
  return (
    <Link
      href="/settings"
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm transition-colors duration-150 ${
        active ? 'bg-accent-soft font-medium text-accent' : 'text-muted hover:bg-surface-secondary hover:text-foreground'
      }`}
    >
      <Icon name="settings" />
      Settings
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data } = useFetch<{ user: User }>('/auth/me');
  const today = useFetch<{ date: string }>('/analytics/day');
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  async function signOut() {
    await api('/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  const email = data?.user.email ?? ' ';

  return (
    <TimerProvider userId={data?.user.id}>
      <div className="min-h-dvh md:grid md:grid-cols-[16rem_minmax(0,1fr)]">
        <aside className="hidden border-r border-line bg-surface/70 md:sticky md:top-0 md:flex md:h-dvh md:flex-col">
          <div className="px-4 pb-6 pt-5">
            <Logo />
          </div>
          <nav aria-label="Primary" className="flex flex-col gap-1 px-3">
            <NavLinks />
          </nav>
          <div className="mt-auto border-t border-line p-3">
            <p className="truncate px-3 pb-2 text-xs text-muted">{email}</p>
            <SettingsLink />
            <Button variant="ghost" className="mt-1 w-full justify-start px-3" onClick={() => void signOut()}>
              Sign out
            </Button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-line bg-background/85 px-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2">
              <Button variant="ghost" className="size-11 shrink-0 px-0 md:hidden" aria-label="Open navigation" onClick={() => setNavOpen(true)}>
                <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
                  <path d="M4 7h16M4 12h16M4 17h16" />
                </svg>
              </Button>
              <div className="md:hidden">
                <Logo />
              </div>
              <p className="hidden text-sm text-muted md:block">{today.data ? formatDayLong(today.data.date) : ' '}</p>
            </div>
          </header>
          <TimerBar />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
        </div>
      </div>

      <Drawer isOpen={navOpen} onOpenChange={setNavOpen}>
        <Drawer.Backdrop variant="opaque">
          <Drawer.Content placement="left">
            <Drawer.Dialog aria-label="Navigation" className="w-[min(20rem,88vw)] max-w-none p-0">
              <Drawer.Header className="flex-row items-center justify-between border-b border-line px-4 py-3">
                <Logo onClick={() => setNavOpen(false)} />
                <Drawer.CloseTrigger aria-label="Close navigation" />
              </Drawer.Header>
              <Drawer.Body className="p-3">
                <nav aria-label="Primary" className="flex flex-col gap-1">
                  <NavLinks onNavigate={() => setNavOpen(false)} />
                </nav>
              </Drawer.Body>
              <Drawer.Footer className="flex-col items-stretch gap-1 border-t border-line p-3">
                <p className="truncate px-3 pb-1 text-xs text-muted">{email}</p>
                <SettingsLink onNavigate={() => setNavOpen(false)} />
                <Button variant="ghost" className="w-full justify-start px-3" onClick={() => void signOut()}>
                  Sign out
                </Button>
              </Drawer.Footer>
            </Drawer.Dialog>
          </Drawer.Content>
        </Drawer.Backdrop>
      </Drawer>
    </TimerProvider>
  );
}
