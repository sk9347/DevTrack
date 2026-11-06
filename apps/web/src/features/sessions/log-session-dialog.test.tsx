import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { LogSessionDialog } from './log-session-dialog';

const habits = [
  { id: 'h1', name: 'DSA' },
  { id: 'h2', name: 'System Design' },
];

beforeAll(() => {
  // jsdom does not implement <dialog> modal behaviour.
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});
afterEach(() => vi.unstubAllGlobals());

const stubFetch = (status: number, body?: unknown) => {
  const fn = vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body });
  vi.stubGlobal('fetch', fn);
  return fn;
};

describe('LogSessionDialog', () => {
  it('blocks submit until minutes are entered and explains why', async () => {
    const fetchMock = stubFetch(201, {});
    render(<LogSessionDialog open onClose={vi.fn()} habits={habits} />);
    await userEvent.click(screen.getByRole('button', { name: 'Save session' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/Enter the minutes/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts the real duration against the chosen habit and closes', async () => {
    const fetchMock = stubFetch(201, { id: 's1' });
    const onClose = vi.fn();
    render(<LogSessionDialog open onClose={onClose} habits={habits} defaultHabitId="h2" />);
    const user = userEvent.setup();

    expect(screen.getByLabelText('Habit')).toHaveValue('h2');
    await user.click(screen.getByRole('button', { name: '45m' }));
    await user.click(screen.getByRole('button', { name: 'Save session' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/sessions');
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ habitId: 'h2', durationMinutes: 45 });
    expect(new Date(body.startedAt).getTime()).toBeLessThan(Date.now());
  });

  it('shows the server error and keeps the dialog open', async () => {
    stubFetch(400, { message: 'Sessions cannot start in the future' });
    const onClose = vi.fn();
    render(<LogSessionDialog open onClose={onClose} habits={habits} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Minutes studied'), '30');
    await user.click(screen.getByRole('button', { name: 'Save session' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Sessions cannot start in the future');
    expect(onClose).not.toHaveBeenCalled();
  });

  it('disables saving when there are no habits yet', () => {
    render(<LogSessionDialog open onClose={vi.fn()} habits={[]} />);
    expect(screen.getByRole('button', { name: 'Save session' })).toBeDisabled();
  });
});
