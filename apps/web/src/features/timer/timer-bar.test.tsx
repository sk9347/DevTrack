import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { TimerBar } from './timer-bar';
import { TimerProvider, useTimer } from './timer-context';
import { timerKey } from './timer-core';

beforeAll(() => {
  // jsdom does not implement <dialog> modal behaviour.
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
});

const T0 = Date.parse('2026-11-06T10:00:00.000Z');
const seed = (startedAt = '2026-11-06T10:00:00.000Z') =>
  window.localStorage.setItem(timerKey('u1'), JSON.stringify({ habitId: 'h1', habitName: 'DSA', startedAt }));

const setup = () =>
  render(
    <TimerProvider userId="u1">
      <TimerBar />
    </TimerProvider>,
  );

beforeEach(() => {
  window.localStorage.clear();
  vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('TimerBar', () => {
  it('renders nothing without a running timer', () => {
    const { container } = setup();
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the habit and an elapsed clock derived from the start time', () => {
    vi.setSystemTime(T0 + (42 * 60 + 10) * 1000);
    seed();
    setup();
    expect(screen.getByRole('timer', { name: 'Elapsed time for DSA' })).toHaveTextContent('00:42:10');
  });

  it('catches up after a long sleep instead of counting missed ticks', () => {
    vi.setSystemTime(T0 + 60_000);
    seed();
    setup();
    expect(screen.getByRole('timer')).toHaveTextContent('00:01:00');
    act(() => {
      vi.setSystemTime(T0 + 3 * 3600_000);
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(screen.getByRole('timer')).toHaveTextContent('03:00:00');
  });

  it('Stop opens the log dialog prefilled with the elapsed minutes, rounded up', async () => {
    vi.setSystemTime(T0 + (25 * 60 + 5) * 1000);
    seed();
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Stop' }));
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(within(dialog).getByLabelText('Minutes studied')).toHaveValue(26);
    expect(within(dialog).getByLabelText('Habit')).toHaveValue('h1');
  });

  it('caps a runaway timer at 12 hours and says so', async () => {
    vi.setSystemTime(T0 + 14 * 3600_000);
    seed();
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Stop' }));
    const dialog = screen.getByRole('dialog', { hidden: true });
    expect(within(dialog).getByLabelText('Minutes studied')).toHaveValue(720);
    expect(within(dialog).getByText(/capped/)).toBeInTheDocument();
  });

  it('clears the timer only after the session is saved', async () => {
    vi.setSystemTime(T0 + 10 * 60_000);
    seed();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 201, json: async () => ({}) }));
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Stop' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save session', hidden: true }));
    await waitFor(() => expect(screen.queryByRole('timer')).not.toBeInTheDocument());
    expect(window.localStorage.getItem(timerKey('u1'))).toBeNull();
  });

  it('keeps the timer running when the save fails', async () => {
    vi.setSystemTime(T0 + 10 * 60_000);
    seed();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => null }));
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Stop' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save session', hidden: true }));
    expect(await screen.findByText(/The server isn't responding/)).toBeInTheDocument();
    expect(screen.getByRole('timer')).toBeInTheDocument();
    expect(window.localStorage.getItem(timerKey('u1'))).not.toBeNull();
  });

  it('discard needs a confirm and then forgets the timer', async () => {
    vi.setSystemTime(T0 + 60_000);
    seed();
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(screen.getByRole('timer')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Keep' }));
    expect(screen.getByRole('timer')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Discard' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm discard' }));
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(window.localStorage.getItem(timerKey('u1'))).toBeNull();
  });

  it('shows up when a timer is started from elsewhere in the app', async () => {
    function Starter() {
      const { start } = useTimer();
      return <button onClick={() => void start({ id: 'h2', name: 'System Design' })}>go</button>;
    }
    render(
      <TimerProvider userId="u1">
        <Starter />
        <TimerBar />
      </TimerProvider>,
    );
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    await userEvent.click(screen.getByText('go'));
    expect(screen.getByRole('timer')).toBeInTheDocument();
    expect(screen.getByRole('timer', { name: 'Elapsed time for System Design' })).toBeInTheDocument();
  });
});
