import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Heatmap, labelFor, monthLabels, nextIndex, summaryFor } from './heatmap';

const days = [
  { date: '2026-11-02', minutes: 0, level: 0 as const },
  { date: '2026-11-03', minutes: 75, level: 3 as const },
  { date: '2026-11-04', minutes: 20, level: 1 as const },
];

describe('Heatmap', () => {
  it('read-only: announces one summary instead of every cell', () => {
    render(<Heatmap days={days} summary={{ longest: 9 }} />);
    const img = screen.getByRole('img');
    expect(img).toHaveAccessibleName('Study activity, last 1 week: 2 active days, longest streak 9 days, last 7 days 1h 35m');
    expect(screen.getAllByRole('img')).toHaveLength(1);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('keeps a per-day tooltip, including for empty days', () => {
    render(<Heatmap days={days} />);
    expect(screen.getByTitle(/Tue 3 Nov: 1h 15m studied/)).toBeInTheDocument();
    expect(screen.getByTitle(/Mon 2 Nov: no study logged/)).toBeInTheDocument();
  });

  it('maps intensity level to the colour ramp', () => {
    render(<Heatmap days={days} />);
    expect(screen.getByTitle(/1h 15m/)).toHaveStyle({ backgroundColor: 'var(--heat-3)' });
  });

  it('renders selectable buttons and reports the chosen date', async () => {
    const onSelect = vi.fn();
    render(<Heatmap days={days} selected="2026-11-03" onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: /Tue 3 Nov/ })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: /Wed 4 Nov/ }));
    expect(onSelect).toHaveBeenCalledWith('2026-11-04');
  });

  it('interactive: the whole grid is one tab stop, parked on the selected day', () => {
    render(<Heatmap days={days} selected="2026-11-03" onSelect={() => {}} />);
    const stops = screen.getAllByRole('button').filter((b) => b.tabIndex === 0);
    expect(stops).toHaveLength(1);
    expect(stops[0]).toHaveAccessibleName(/Tue 3 Nov/);
  });

  it('interactive: arrow keys move focus between days without selecting', async () => {
    const onSelect = vi.fn();
    render(<Heatmap days={days} selected="2026-11-03" onSelect={onSelect} />);
    screen.getByRole('button', { name: /Tue 3 Nov/ }).focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('button', { name: /Wed 4 Nov/ })).toHaveFocus();
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(screen.getByRole('button', { name: /Mon 2 Nov/ })).toHaveFocus();
    expect(onSelect).not.toHaveBeenCalled();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledWith('2026-11-02');
  });

  it('nextIndex: left/right change week, up/down change weekday, Home/End span the week, edges clamp', () => {
    expect(nextIndex(10, 'ArrowRight', 28)).toBe(17);
    expect(nextIndex(10, 'ArrowLeft', 28)).toBe(3);
    expect(nextIndex(3, 'ArrowLeft', 28)).toBe(3);
    expect(nextIndex(24, 'ArrowRight', 28)).toBe(24);
    expect(nextIndex(10, 'ArrowDown', 28)).toBe(11);
    expect(nextIndex(13, 'ArrowDown', 28)).toBe(13); // Sunday is the last row
    expect(nextIndex(7, 'ArrowUp', 28)).toBe(7); // Monday is the first row
    expect(nextIndex(10, 'Home', 28)).toBe(7);
    expect(nextIndex(10, 'End', 28)).toBe(13);
    expect(nextIndex(24, 'End', 26)).toBe(25); // partial final week
  });

  it('summaryFor: pluralises and totals the last seven days', () => {
    expect(summaryFor([{ minutes: 60 }], 1)).toBe('Study activity, last 1 week: 1 active day, longest streak 1 day, last 7 days 1h');
  });

  it('labels each month once, at the week column where it starts', () => {
    // 6 weeks starting Mon 2026-09-28: Sep (partial, dropped as it collides), Oct 5, then Nov 2
    const start = new Date('2026-09-28T00:00:00Z');
    const many = Array.from({ length: 42 }, (_, i) => ({
      date: new Date(start.getTime() + i * 86_400_000).toISOString().slice(0, 10),
      minutes: 0,
      level: 0 as const,
    }));
    const labels = monthLabels(many);
    // Nov starts in the final column, where "Nov" would overflow the grid, so it is dropped too.
    expect(labels.map((l) => l.label)).toEqual(['Oct']);
    expect(labels.map((l) => l.week)).toEqual([1]);
  });

  it('labels a studied day with its duration', () => {
    expect(labelFor({ date: '2026-11-06', minutes: 55 })).toBe('Fri 6 Nov: 55m studied');
  });
});
