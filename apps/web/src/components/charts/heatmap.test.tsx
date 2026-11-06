import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Heatmap, labelFor } from './heatmap';

const days = [
  { date: '2026-11-02', minutes: 0, level: 0 as const },
  { date: '2026-11-03', minutes: 75, level: 3 as const },
  { date: '2026-11-04', minutes: 20, level: 1 as const },
];

describe('Heatmap', () => {
  it('describes every day for assistive tech, including empty ones', () => {
    render(<Heatmap days={days} />);
    expect(screen.getByRole('img', { name: /Tue 3 Nov: 1h 15m studied/ })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Mon 2 Nov: no study logged/ })).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(3);
  });

  it('maps intensity level to the colour ramp', () => {
    render(<Heatmap days={days} />);
    expect(screen.getByRole('img', { name: /1h 15m/ })).toHaveStyle({ backgroundColor: 'var(--heat-3)' });
  });

  it('renders selectable buttons and reports the chosen date', async () => {
    const onSelect = vi.fn();
    render(<Heatmap days={days} selected="2026-11-03" onSelect={onSelect} />);
    expect(screen.getByRole('button', { name: /Tue 3 Nov/ })).toHaveAttribute('aria-pressed', 'true');
    await userEvent.click(screen.getByRole('button', { name: /Wed 4 Nov/ }));
    expect(onSelect).toHaveBeenCalledWith('2026-11-04');
  });

  it('labels a studied day with its duration', () => {
    expect(labelFor({ date: '2026-11-06', minutes: 55 })).toBe('Fri 6 Nov: 55m studied');
  });
});
