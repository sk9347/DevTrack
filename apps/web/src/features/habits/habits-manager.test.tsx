import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { HabitsManager } from './habits-manager';

const api = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api-client', () => ({ api, notifyMutated: vi.fn(), onMutated: () => () => {} }));
vi.mock('@/lib/use-fetch', () => ({ useFetch: () => ({ data: [], error: null, loading: false }) }));

describe('HabitsManager add form', () => {
  beforeEach(() => api.mockReset());

  it('rejects days a week above 7 with a plain message and no request', async () => {
    render(<HabitsManager />);
    await userEvent.type(screen.getByLabelText('Name'), 'Rust');
    await userEvent.clear(screen.getByLabelText('Days a week'));
    await userEvent.type(screen.getByLabelText('Days a week'), '9');
    await userEvent.click(screen.getByRole('button', { name: 'Add habit' }));
    expect(screen.getByText('Days a week must be between 1 and 7')).toBeInTheDocument();
    expect(api).not.toHaveBeenCalled();
  });

  it('rejects a daily target outside 5-720 minutes', async () => {
    render(<HabitsManager />);
    await userEvent.type(screen.getByLabelText('Name'), 'Rust');
    await userEvent.clear(screen.getByLabelText(/Minutes a day/));
    await userEvent.type(screen.getByLabelText(/Minutes a day/), '2');
    await userEvent.click(screen.getByRole('button', { name: 'Add habit' }));
    expect(screen.getByText('Daily target must be between 5 and 720 minutes')).toBeInTheDocument();
    expect(api).not.toHaveBeenCalled();
  });

  it('submits a valid habit', async () => {
    api.mockResolvedValue({});
    render(<HabitsManager />);
    await userEvent.type(screen.getByLabelText('Name'), 'Rust');
    await userEvent.click(screen.getByRole('button', { name: 'Add habit' }));
    expect(api).toHaveBeenCalledWith('/habits', expect.objectContaining({ method: 'POST', body: expect.objectContaining({ name: 'Rust', targetFrequency: 5, dailyTargetMinutes: 30 }) }));
  });
});
