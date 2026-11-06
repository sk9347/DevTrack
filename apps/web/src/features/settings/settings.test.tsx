import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { timerKey } from '@/features/timer/timer-core';
import { DataExport } from './data-export';
import { DeleteAccount } from './delete-account';
import { PasswordForm, validatePasswordChange } from './password-form';
import { TimezoneForm } from './timezone-form';
import { timezoneOptions } from './timezones';

const api = vi.hoisted(() => vi.fn());
const notifyMutated = vi.hoisted(() => vi.fn());
vi.mock('@/lib/api-client', () => ({ api, notifyMutated }));

beforeEach(() => {
  api.mockReset();
  notifyMutated.mockReset();
});

describe('timezoneOptions', () => {
  it('always contains the current zone, even one the browser list omits', () => {
    expect(timezoneOptions('Asia/Calcutta')).toContain('Asia/Calcutta');
    expect(timezoneOptions('Asia/Tokyo')).toContain('Asia/Tokyo');
  });

  it('includes UTC', () => {
    expect(timezoneOptions('Asia/Tokyo')).toContain('UTC');
  });
});

describe('TimezoneForm', () => {
  it('keeps Save disabled until the zone changes, then patches and confirms', async () => {
    api.mockResolvedValue({ user: {} });
    render(<TimezoneForm current="UTC" />);
    const save = screen.getByRole('button', { name: 'Save timezone' });
    expect(save).toBeDisabled();
    await userEvent.selectOptions(screen.getByLabelText('Timezone'), 'Asia/Tokyo');
    expect(save).toBeEnabled();
    await userEvent.click(save);
    expect(api).toHaveBeenCalledWith('/auth/me', { method: 'PATCH', body: { timezone: 'Asia/Tokyo' } });
    expect(await screen.findByRole('status')).toHaveTextContent('Timezone is now Asia/Tokyo');
    expect(notifyMutated).toHaveBeenCalled();
    expect(save).toBeDisabled();
  });

  it('shows the server error and keeps the choice when saving fails', async () => {
    api.mockRejectedValue(new Error('Unknown timezone'));
    render(<TimezoneForm current="UTC" />);
    await userEvent.selectOptions(screen.getByLabelText('Timezone'), 'Asia/Tokyo');
    await userEvent.click(screen.getByRole('button', { name: 'Save timezone' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Unknown timezone');
    expect(screen.getByLabelText('Timezone')).toHaveValue('Asia/Tokyo');
    expect(notifyMutated).not.toHaveBeenCalled();
  });

  it('warns that history is regrouped', () => {
    render(<TimezoneForm current="UTC" />);
    expect(screen.getByText(/regroups past sessions/)).toBeInTheDocument();
  });
});

describe('validatePasswordChange', () => {
  it.each([
    ['', 'newpassword1', 'newpassword1', 'Enter your current password'],
    ['old-password', 'short', 'short', 'New password must be at least 8 characters'],
    ['old-password', 'x'.repeat(129), 'x'.repeat(129), 'New password must be at most 128 characters'],
    ['old-password', 'old-password', 'old-password', 'New password must be different from the current one'],
    ['old-password', 'newpassword1', 'newpassword2', 'The new passwords do not match'],
  ])('rejects %j / %j / %j', (cur, next, conf, message) => {
    expect(validatePasswordChange(cur, next, conf)).toBe(message);
  });

  it('accepts a good change', () => {
    expect(validatePasswordChange('old-password', 'newpassword1', 'newpassword1')).toBeNull();
  });
});

describe('PasswordForm', () => {
  async function fill(current: string, next: string, confirm: string) {
    await userEvent.type(screen.getByLabelText('Current password'), current);
    await userEvent.type(screen.getByLabelText('New password'), next);
    await userEvent.type(screen.getByLabelText('Confirm new password'), confirm);
    await userEvent.click(screen.getByRole('button', { name: 'Change password' }));
  }

  it('does not call the API when the confirmation differs', async () => {
    render(<PasswordForm />);
    await fill('correct-horse', 'battery-staple', 'battery-stapl');
    expect(screen.getByRole('alert')).toHaveTextContent('The new passwords do not match');
    expect(api).not.toHaveBeenCalled();
  });

  it('sends both passwords, clears the fields and confirms', async () => {
    api.mockResolvedValue(undefined);
    render(<PasswordForm />);
    await fill('correct-horse', 'battery-staple', 'battery-staple');
    expect(api).toHaveBeenCalledWith('/auth/password', {
      method: 'POST',
      body: { currentPassword: 'correct-horse', newPassword: 'battery-staple' },
    });
    expect(await screen.findByRole('status')).toHaveTextContent('Password changed');
    expect(screen.getByLabelText('Current password')).toHaveValue('');
  });

  it('shows a wrong current password in place and keeps what was typed', async () => {
    api.mockRejectedValue(new Error('Current password is incorrect'));
    render(<PasswordForm />);
    await fill('wrong-password', 'battery-staple', 'battery-staple');
    expect(await screen.findByRole('alert')).toHaveTextContent('Current password is incorrect');
    expect(screen.getByLabelText('New password')).toHaveValue('battery-staple');
  });
});

describe('DataExport', () => {
  it('links the three CSV files as downloads', () => {
    render(<DataExport />);
    const sessions = screen.getByRole('link', { name: 'Download study sessions as CSV' });
    expect(sessions).toHaveAttribute('href', '/api/v1/export/sessions.csv');
    expect(sessions).toHaveAttribute('download');
    expect(screen.getByRole('link', { name: 'Download habits as CSV' })).toHaveAttribute('href', '/api/v1/export/habits.csv');
    expect(screen.getByRole('link', { name: 'Download tasks as CSV' })).toHaveAttribute('href', '/api/v1/export/tasks.csv');
  });
});

describe('DeleteAccount', () => {
  const assign = vi.fn();
  beforeEach(() => {
    assign.mockReset();
    vi.stubGlobal('location', { ...window.location, assign });
    window.localStorage.clear();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('needs two steps: nothing is asked or sent until the user opens the confirm', async () => {
    render(<DeleteAccount userId="u1" />);
    expect(screen.queryByLabelText('Your password')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }));
    expect(screen.getByLabelText('Your password')).toBeInTheDocument();
    expect(api).not.toHaveBeenCalled();
  });

  it('Keep closes the confirm and forgets the typed password', async () => {
    render(<DeleteAccount userId="u1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }));
    await userEvent.type(screen.getByLabelText('Your password'), 'correct-horse');
    await userEvent.click(screen.getByRole('button', { name: 'Keep' }));
    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }));
    expect(screen.getByLabelText('Your password')).toHaveValue('');
  });

  it('asks for the password before sending anything', async () => {
    render(<DeleteAccount userId="u1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your password to confirm');
    expect(api).not.toHaveBeenCalled();
  });

  it('a wrong password shows the error, stays on the page and keeps the account', async () => {
    api.mockRejectedValue(new Error('Password is incorrect'));
    render(<DeleteAccount userId="u1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }));
    await userEvent.type(screen.getByLabelText('Your password'), 'nope');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Password is incorrect');
    expect(assign).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Confirm delete' })).toBeEnabled();
  });

  it('deletes, forgets the local timer and goes to /login', async () => {
    api.mockResolvedValue(undefined);
    window.localStorage.setItem(timerKey('u1'), '{}');
    render(<DeleteAccount userId="u1" />);
    await userEvent.click(screen.getByRole('button', { name: 'Delete account' }));
    await userEvent.type(screen.getByLabelText('Your password'), 'correct-horse');
    await userEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
    expect(api).toHaveBeenCalledWith('/auth/me', { method: 'DELETE', body: { password: 'correct-horse' } });
    expect(assign).toHaveBeenCalledWith('/login');
    expect(window.localStorage.getItem(timerKey('u1'))).toBeNull();
  });
});

describe('sameZone', () => {
  it('treats aliases of one zone as the same and different zones as different', async () => {
    const { sameZone } = await import('./timezones');
    expect(sameZone('Asia/Kolkata', 'Asia/Calcutta')).toBe(true);
    expect(sameZone('UTC', 'UTC')).toBe(true);
    expect(sameZone('UTC', 'Asia/Tokyo')).toBe(false);
  });
});
