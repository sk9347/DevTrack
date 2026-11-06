'use client';

import type { CSSProperties, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { Button as HeroButton, Card, Input as HeroInput, Skeleton as HeroSkeleton } from '@heroui/react';

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

interface ButtonProps {
  children?: ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  onClick?: () => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  form?: string;
  id?: string;
  name?: string;
  value?: string;
  title?: string;
  autoFocus?: boolean;
  tabIndex?: number;
  style?: CSSProperties;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
  'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';
  'aria-describedby'?: string;
}

export function Button({ variant = 'secondary', className, disabled, onClick, ...props }: ButtonProps) {
  return (
    <HeroButton
      {...props}
      variant={variant === 'danger' ? 'danger-soft' : variant}
      isDisabled={disabled}
      onPress={onClick}
      className={cx('min-h-11 rounded-md px-4 text-sm font-medium', className)}
    />
  );
}

const field =
  'min-h-11 w-full cursor-pointer rounded-md border border-line-strong bg-canvas px-3 text-base text-fg transition-colors duration-150 hover:border-muted focus-visible:border-accent disabled:cursor-not-allowed disabled:opacity-50';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-fg">{label}</span>
        {children}
      </label>
      {hint && <p className="mt-1.5 text-xs leading-5 text-muted">{hint}</p>}
    </div>
  );
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <HeroInput {...props} className={cx('w-full min-h-11', className)} />;
}

export function SelectInput({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(field, className)} />;
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-sm text-danger">
      {children}
    </p>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** A card surface for one coherent region of a screen. */
export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <Card className={cx('gap-0 border border-line bg-surface p-5 shadow-none sm:p-6', className)}>{children}</Card>;
}

export function SectionHeading({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{children}</h2>
      {action}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line-strong bg-canvas/40 px-4 py-6 text-center">
      <p className="font-medium">{title}</p>
      {children && <div className="mt-1 text-sm leading-6 text-muted">{children}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <HeroSkeleton animationType="none" aria-hidden className={cx('animate-pulse rounded-lg bg-surface-secondary', className)} />;
}

/** A failed load, in the footprint of the skeleton it replaces: what failed, why, and a way to retry. */
export function LoadError({ what, message, onRetry, className }: { what: string; message: string; onRetry: () => void; className?: string }) {
  return (
    <div role="alert" className={cx('flex flex-col items-start gap-3 rounded-lg border border-line-strong bg-surface px-4 py-5', className)}>
      <div>
        <p className="font-medium">Couldn&apos;t load {what}</p>
        <p className="mt-0.5 text-sm text-danger">{message}</p>
      </div>
      <Button variant="secondary" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}

interface FetchState<T> {
  data: T | null;
  error: string | null;
  reload: () => void | Promise<void>;
}

/** Skeleton while loading, LoadError with Retry when the first load failed, otherwise the data. */
export function Region<T>({ state, what, skeleton, children }: { state: FetchState<T>; what: string; skeleton: string; children: (data: T) => ReactNode }) {
  if (state.data) return <>{children(state.data)}</>;
  if (state.error) return <LoadError what={what} message={state.error} onRetry={() => void state.reload()} className={skeleton.replace(/^h-/, 'min-h-')} />;
  return <Skeleton className={skeleton.replace(/^h-/, 'min-h-')} />;
}
