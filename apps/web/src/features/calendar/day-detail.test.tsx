import { render, screen, within } from '@testing-library/react';
import { DayDetail } from './day-detail';
import type { DayTrack } from '@/types';

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
});
