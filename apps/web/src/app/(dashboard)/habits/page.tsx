import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/controls';
import { HabitsManager } from '@/features/habits/habits-manager';

export const metadata: Metadata = { title: 'Habits' };

export default function HabitsPage() {
  return (
    <>
      <PageHeader title="Habits" description="Define what you study, how much counts as a day, and how often you aim for it." />
      <HabitsManager />
    </>
  );
}
