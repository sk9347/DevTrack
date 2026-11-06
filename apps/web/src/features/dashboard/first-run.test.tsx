import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { FirstRun } from './first-run';

const api = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api-client', () => ({ api, notifyMutated: vi.fn() }));

describe('FirstRun', () => {
  beforeEach(() => api.mockReset());

  it('asks for a name before sending anything', async () => {
    render(<FirstRun />);
    await userEvent.click(screen.getByRole('button', { name: 'Add habit' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Give the habit a name');
    expect(api).not.toHaveBeenCalled();
  });

  it('creates the habit with the chosen target', async () => {
    api.mockResolvedValue({});
    render(<FirstRun />);
    await userEvent.type(screen.getByLabelText('Name'), 'DSA');
    await userEvent.click(screen.getByRole('button', { name: 'Add habit' }));
    expect(api).toHaveBeenCalledWith('/habits', { method: 'POST', body: { name: 'DSA', dailyTargetMinutes: 30 } });
  });
});
