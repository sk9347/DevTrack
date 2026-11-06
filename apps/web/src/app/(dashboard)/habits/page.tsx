import type { Metadata } from 'next';
import { HabitsManager } from '@/features/habits/habits-manager';

export const metadata: Metadata = { title: 'Habits' };

export default function HabitsPage() {
  return (
    <>
      <h1 className="mb-8 text-2xl font-semibold">Habits</h1>
      <HabitsManager />
    </>
  );
}
