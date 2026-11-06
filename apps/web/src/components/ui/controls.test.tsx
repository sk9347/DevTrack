import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { LoadError, Region } from './controls';

const state = (patch: Partial<{ data: string | null; error: string | null }> = {}) => ({ data: null, error: null, reload: vi.fn(), ...patch });

describe('Region', () => {
  it('shows a skeleton while the first load is pending', () => {
    const { container } = render(<Region state={state()} what="the chart" skeleton="h-24">{(d) => <p>{d}</p>}</Region>);
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('replaces the skeleton with an error and a working Retry when the first load fails', async () => {
    const s = state({ error: 'Cannot reach the server. Check your connection and try again.' });
    const { container } = render(<Region state={s} what="this week's summary" skeleton="h-24">{(d) => <p>{d}</p>}</Region>);
    expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't load this week's summary");
    expect(screen.getByRole('alert')).toHaveTextContent('Cannot reach the server');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(s.reload).toHaveBeenCalledOnce();
  });

  it('keeps showing data it already has even if a later refresh fails', () => {
    render(<Region state={state({ data: 'cached week', error: 'boom' })} what="x" skeleton="h-24">{(d) => <p>{d}</p>}</Region>);
    expect(screen.getByText('cached week')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('LoadError', () => {
  it('reserves the space of what it replaces', () => {
    render(<LoadError what="x" message="m" onRetry={() => {}} className="min-h-24" />);
    expect(screen.getByRole('alert')).toHaveClass('min-h-24');
  });
});
