import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { OverduePanel } from './overdue-panel';

const api = vi.hoisted(() => vi.fn());
const notifyMutated = vi.hoisted(() => vi.fn());
const state = vi.hoisted(() => ({ data: null as unknown, error: null as string | null, reload: vi.fn() }));
vi.mock('@/lib/api-client', () => ({ api, notifyMutated }));
vi.mock('@/lib/use-fetch', () => ({ useFetch: () => state }));

const task = (n: number, patch = {}) => ({ id: `t${n}`, title: `Task ${n}`, dueDate: '2026-11-04', status: 'TODO', doneAt: null, loggedMinutes: 0, ...patch });

beforeEach(() => {
  api.mockReset();
  notifyMutated.mockReset();
  state.data = null;
  state.error = null;
  state.reload.mockReset();
});

describe('OverduePanel', () => {
  it('renders nothing when there is nothing overdue, and while loading', () => {
    const { container, rerender } = render(<OverduePanel today="2026-11-06" />);
    expect(container).toBeEmptyDOMElement();
    state.data = [];
    rerender(<OverduePanel today="2026-11-06" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists overdue tasks with the day they were planned for', () => {
    state.data = [task(1)];
    render(<OverduePanel today="2026-11-06" />);
    expect(screen.getByRole('heading', { name: 'Overdue (1)' })).toBeInTheDocument();
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('from Wed 4 Nov')).toBeInTheDocument();
  });

  it('moves a task to today only when asked', async () => {
    state.data = [task(1)];
    api.mockResolvedValue({});
    render(<OverduePanel today="2026-11-06" />);
    expect(api).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('button', { name: 'Move Task 1 to today' }));
    expect(api).toHaveBeenCalledWith('/tasks/t1', { method: 'PATCH', body: { dueDate: '2026-11-06' } });
    expect(notifyMutated).toHaveBeenCalled();
  });

  it('completes a task without touching its due date', async () => {
    state.data = [task(1)];
    api.mockResolvedValue({});
    render(<OverduePanel today="2026-11-06" />);
    await userEvent.click(screen.getByRole('checkbox', { name: /Task 1/ }));
    expect(api).toHaveBeenCalledWith('/tasks/t1', { method: 'PATCH', body: { status: 'DONE' } });
  });

  it('shows the first 10 and reveals the rest on request', async () => {
    state.data = Array.from({ length: 14 }, (_, i) => task(i + 1));
    render(<OverduePanel today="2026-11-06" />);
    expect(screen.getAllByRole('checkbox')).toHaveLength(10);
    await userEvent.click(screen.getByRole('button', { name: 'Show 4 more' }));
    expect(screen.getAllByRole('checkbox')).toHaveLength(14);
    expect(screen.queryByRole('button', { name: /Show/ })).not.toBeInTheDocument();
  });

  it('offers Retry when the list fails to load, and reports a failed action', async () => {
    state.error = "The server isn't responding. Try again in a moment.";
    const { rerender } = render(<OverduePanel today="2026-11-06" />);
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(state.reload).toHaveBeenCalledOnce();

    state.error = null;
    state.data = [task(1)];
    api.mockRejectedValue(new Error('Task not found'));
    rerender(<OverduePanel today="2026-11-06" />);
    await userEvent.click(screen.getByRole('button', { name: 'Move Task 1 to today' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Task not found');
  });
});
