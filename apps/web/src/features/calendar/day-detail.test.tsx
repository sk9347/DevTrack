import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { DayDetail } from './day-detail';
import type { DayTrack } from '@/types';

const api = vi.hoisted(() => vi.fn());
const notifyMutated = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api-client', () => ({ api, notifyMutated }));

const track = (patch: Partial<DayTrack> = {}): DayTrack => ({
  date: '2026-11-06', totalMinutes: 55, habits: [], tasks: [],
  sessions: [{
    id: 's1', startedAt: '2026-11-06T15:30:00Z', endedAt: '2026-11-06T16:25:00Z',
    durationMinutes: 55, habitId: 'h', habitName: 'System Design', habitColor: '#6fa8e8', taskTitle: 'Database indexing',
  }],
  ...patch,
});

describe('DayDetail', () => {
  it('lists each session with its habit, task, time range and real duration', () => {
    render(<DayDetail track={track()} timeZone="UTC" />);
    const item = screen.getByRole('listitem');
    expect(within(item).getByText(/System Design/)).toBeInTheDocument();
    expect(within(item).getByText(/Database indexing/)).toBeInTheDocument();
    expect(within(item).getByText('15:30–16:25')).toBeInTheDocument();
    expect(within(item).getByText('55m')).toBeInTheDocument();
    expect(screen.getByText('55m studied')).toBeInTheDocument();
  });

  it('shows a reassuring empty state for a day with no study', () => {
    render(<DayDetail track={track({ sessions: [], totalMinutes: 0 })} />);
    expect(screen.getByText('No study logged this day')).toBeInTheDocument();
    expect(screen.getByText(/never erased/)).toBeInTheDocument();
  });

  it('shows planned tasks with their status', () => {
    render(<DayDetail track={track({ tasks: [
      { id: 't1', title: 'Read B-tree chapter', dueDate: '2026-11-06', status: 'DONE', doneAt: null, loggedMinutes: 0 },
      { id: 't2', title: 'Mock interview', dueDate: '2026-11-06', status: 'TODO', doneAt: null, loggedMinutes: 0 },
    ] })} />);
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Not done')).toBeInTheDocument();
  });

  it('deletes a mistaken session only after an explicit confirm', async () => {
    api.mockReset();
    api.mockResolvedValue(undefined);
    render(<DayDetail track={track()} timeZone="UTC" />);
    await userEvent.click(screen.getByRole('button', { name: /Delete System Design session, 55m/ }));
    expect(api).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
    expect(api).toHaveBeenCalledWith('/sessions/s1', { method: 'DELETE' });
    expect(notifyMutated).toHaveBeenCalled();
  });

  it('keeps the session when the user backs out', async () => {
    api.mockReset();
    render(<DayDetail track={track()} timeZone="UTC" />);
    await userEvent.click(screen.getByRole('button', { name: /Delete System Design session/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Keep' }));
    expect(api).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Delete System Design session/ })).toBeInTheDocument();
  });
});
