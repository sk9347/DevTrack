import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { HabitsManager } from './habits-manager';

const api = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api-client', () => ({ api, notifyMutated: vi.fn(), onMutated: () => () => {} }));
const habitsData = vi.hoisted(() => ({ list: [] as unknown[] }));
vi.mock('@/lib/use-fetch', () => ({ useFetch: () => ({ data: habitsData.list, error: null, loading: false, reload: vi.fn() }) }));

describe('HabitsManager add form', () => {
  beforeEach(() => {
    api.mockReset();
    habitsData.list = [];
  });

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

  describe('inline edit', () => {
    const dsa = { id: 'h1', name: 'DSA', color: '#4cc38a', dailyTargetMinutes: 45, targetFrequency: 5, isActive: true };

    it('patches the habit with the new target and colour', async () => {
      habitsData.list = [dsa];
      api.mockResolvedValue({});
      render(<HabitsManager />);
      await userEvent.click(screen.getByRole('button', { name: 'Edit DSA' }));
      const form = screen.getByRole('form', { name: 'Edit DSA' });
      const minutes = within(form).getByLabelText('Minutes a day');
      await userEvent.clear(minutes);
      await userEvent.type(minutes, '60');
      await userEvent.click(within(form).getByRole('button', { name: 'Save' }));
      expect(api).toHaveBeenCalledWith('/habits/h1', { method: 'PATCH', body: { name: 'DSA', dailyTargetMinutes: 60, targetFrequency: 5, color: '#4cc38a' } });
    });

    it('rejects an out-of-range edit in plain words and says past days use the new target', async () => {
      habitsData.list = [dsa];
      render(<HabitsManager />);
      await userEvent.click(screen.getByRole('button', { name: 'Edit DSA' }));
      const form = screen.getByRole('form', { name: 'Edit DSA' });
      expect(within(form).getByText(/including past ones/)).toBeInTheDocument();
      const days = within(form).getByLabelText('Days a week');
      await userEvent.clear(days);
      await userEvent.type(days, '8');
      await userEvent.click(within(form).getByRole('button', { name: 'Save' }));
      expect(screen.getByText('Days a week must be between 1 and 7')).toBeInTheDocument();
      expect(api).not.toHaveBeenCalled();
    });

    it('cancel leaves the habit untouched', async () => {
      habitsData.list = [dsa];
      render(<HabitsManager />);
      await userEvent.click(screen.getByRole('button', { name: 'Edit DSA' }));
      await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(api).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Edit DSA' })).toBeInTheDocument();
    });
  });
});
