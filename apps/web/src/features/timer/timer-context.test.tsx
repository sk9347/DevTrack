import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { timerKey } from './timer-core';
import { TimerProvider, useTimer } from './timer-context';

let lastStartResult: boolean | undefined;

function Probe() {
  const { timer, start, clear } = useTimer();
  return (
    <div>
      <p data-testid="state">{timer ? `${timer.habitName}@${timer.startedAt}` : 'none'}</p>
      <button onClick={() => void start({ id: 'h1', name: 'DSA' })}>start</button>
      <button onClick={() => (lastStartResult = start({ id: 'h2', name: 'Other' }))}>start-other</button>
      <button onClick={clear}>clear</button>
    </div>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  lastStartResult = undefined;
});
afterEach(() => vi.restoreAllMocks());

describe('TimerProvider', () => {
  it('starts a timer, persists it, and restores it after a remount (refresh)', async () => {
    const { unmount } = render(
      <TimerProvider userId="u1">
        <Probe />
      </TimerProvider>,
    );
    await userEvent.click(screen.getByText('start'));
    expect(screen.getByTestId('state')).toHaveTextContent(/^DSA@/);
    expect(window.localStorage.getItem(timerKey('u1'))).toContain('"habitName":"DSA"');
    unmount();
    render(
      <TimerProvider userId="u1">
        <Probe />
      </TimerProvider>,
    );
    expect(screen.getByTestId('state')).toHaveTextContent(/^DSA@/);
  });

  it('refuses a second timer while one is running', async () => {
    render(
      <TimerProvider userId="u1">
        <Probe />
      </TimerProvider>,
    );
    await userEvent.click(screen.getByText('start'));
    await userEvent.click(screen.getByText('start-other'));
    expect(lastStartResult).toBe(false);
    expect(screen.getByTestId('state')).toHaveTextContent(/^DSA@/);
  });

  it('keeps timers separate per user', async () => {
    const { unmount } = render(
      <TimerProvider userId="u1">
        <Probe />
      </TimerProvider>,
    );
    await userEvent.click(screen.getByText('start'));
    unmount();
    render(
      <TimerProvider userId="u2">
        <Probe />
      </TimerProvider>,
    );
    expect(screen.getByTestId('state')).toHaveTextContent('none');
  });

  it('clears the saved record', async () => {
    render(
      <TimerProvider userId="u1">
        <Probe />
      </TimerProvider>,
    );
    await userEvent.click(screen.getByText('start'));
    await userEvent.click(screen.getByText('clear'));
    expect(screen.getByTestId('state')).toHaveTextContent('none');
    expect(window.localStorage.getItem(timerKey('u1'))).toBeNull();
  });

  it('follows a timer started or cleared in another tab', () => {
    render(
      <TimerProvider userId="u1">
        <Probe />
      </TimerProvider>,
    );
    const t = { habitId: 'h9', habitName: 'Elsewhere', startedAt: '2026-11-06T10:00:00.000Z' };
    window.localStorage.setItem(timerKey('u1'), JSON.stringify(t));
    act(() => void window.dispatchEvent(new StorageEvent('storage', { key: timerKey('u1') })));
    expect(screen.getByTestId('state')).toHaveTextContent('Elsewhere@2026-11-06T10:00:00.000Z');
    window.localStorage.removeItem(timerKey('u1'));
    act(() => void window.dispatchEvent(new StorageEvent('storage', { key: timerKey('u1') })));
    expect(screen.getByTestId('state')).toHaveTextContent('none');
  });

  it('still times in memory, and says so in the console, when storage is unavailable', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied');
    });
    render(
      <TimerProvider userId="u1">
        <Probe />
      </TimerProvider>,
    );
    await userEvent.click(screen.getByText('start'));
    expect(screen.getByTestId('state')).toHaveTextContent(/^DSA@/);
    expect(err).toHaveBeenCalled();
  });

  it('does nothing before the user is known', async () => {
    render(
      <TimerProvider>
        <Probe />
      </TimerProvider>,
    );
    await userEvent.click(screen.getByText('start'));
    expect(screen.getByTestId('state')).toHaveTextContent('none');
  });
});
