import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { HabitProgress } from './habit-progress';

const habits = [
  { id: 'h1', name: 'DSA', color: '#4cc38a', dailyTargetMinutes: 30, minutes: 45, met: true },
  { id: 'h2', name: 'System Design', color: '#6fa8e8', dailyTargetMinutes: 60, minutes: 20, met: false },
];

describe('HabitProgress', () => {
  it('shows minutes against target and flags met habits', () => {
    render(<HabitProgress habits={habits} />);
    expect(screen.getByText('45m / 30m')).toBeInTheDocument();
    expect(screen.getByText('Met')).toBeInTheDocument();
    expect(screen.getAllByText('Met')).toHaveLength(1);
  });

  it('exposes progress to assistive tech and clamps at the target', () => {
    render(<HabitProgress habits={habits} />);
    const dsa = screen.getByRole('progressbar', { name: 'DSA progress today' });
    expect(dsa).toHaveAttribute('aria-valuenow', '30');
    expect(dsa).toHaveAttribute('aria-valuemax', '30');
    expect(screen.getByRole('progressbar', { name: 'System Design progress today' })).toHaveAttribute('aria-valuenow', '20');
  });

  it('lets the user log time for a specific habit', async () => {
    const onLog = vi.fn();
    render(<HabitProgress habits={habits} onLog={onLog} />);
    await userEvent.click(screen.getByRole('button', { name: 'Log time for System Design' }));
    expect(onLog).toHaveBeenCalledWith('h2');
  });

  it('points to the habits page when there are none', () => {
    render(<HabitProgress habits={[]} />);
    expect(screen.getByRole('link', { name: 'Add your first habit' })).toHaveAttribute('href', '/habits');
  });
});
