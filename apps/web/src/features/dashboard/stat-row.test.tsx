import { render, screen } from '@testing-library/react';
import { StatRow } from './stat-row';
import type { Overview } from '@/types';

const overview = (patch: Partial<Overview> = {}): Overview => ({
  period: 'week', from: '2026-11-02', to: '2026-11-08', today: '2026-11-06',
  totalMinutes: 335, studyHours: 5.6, activeDays: 4,
  tasks: { total: 6, done: 4 }, habitCompletion: 0.667,
  streak: { current: 3, longest: 9 }, daily: [], habits: [], ...patch,
});

describe('StatRow', () => {
  it('shows real values from the overview', () => {
    render(<StatRow o={overview()} />);
    expect(screen.getByText('This week').nextSibling).toHaveTextContent('5h 35m');
    expect(screen.getByText('Current streak').nextSibling).toHaveTextContent('3 days');
    expect(screen.getByText('Tasks done').nextSibling).toHaveTextContent('4/6');
    expect(screen.getByText('Habit completion').nextSibling).toHaveTextContent('67%');
  });

  it('uses the singular for a one-day streak and handles a fresh account', () => {
    render(<StatRow o={overview({ totalMinutes: 0, streak: { current: 1, longest: 1 }, tasks: { total: 0, done: 0 }, habitCompletion: 0 })} />);
    expect(screen.getByText('Current streak').nextSibling).toHaveTextContent('1 day');
    expect(screen.getByText('This week').nextSibling).toHaveTextContent('0m');
    expect(screen.getByText('Habit completion').nextSibling).toHaveTextContent('0%');
  });
});
