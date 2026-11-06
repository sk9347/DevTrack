import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AuthForm } from './auth-form';

const replace = vi.fn();
vi.mock('next/navigation', () => ({ useRouter: () => ({ replace, refresh: vi.fn() }) }));

const respond = (status: number, body?: unknown) =>
  vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body });

afterEach(() => {
  vi.unstubAllGlobals();
  replace.mockReset();
});

async function fill(email: string, password: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Email'), email);
  await user.type(screen.getByLabelText('Password'), password);
  return user;
}

describe('AuthForm', () => {
  it('signs in and goes to the dashboard', async () => {
    const fetchMock = respond(200, { user: { id: '1' } });
    vi.stubGlobal('fetch', fetchMock);
    render(<AuthForm />);
    const user = await fill('a@example.com', 'correct-horse');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/dashboard'));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/auth/login');
    expect(JSON.parse(init.body)).toEqual({ email: 'a@example.com', password: 'correct-horse' });
  });

  it('shows the server error and stays on the form', async () => {
    vi.stubGlobal('fetch', respond(401, { message: 'Incorrect email or password' }));
    render(<AuthForm />);
    const user = await fill('a@example.com', 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Incorrect email or password');
    expect(replace).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
  });

  it('switches to registration and sends the browser timezone', async () => {
    const fetchMock = respond(201, { user: { id: '1' } });
    vi.stubGlobal('fetch', fetchMock);
    render(<AuthForm />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Create an account' }));
    expect(screen.getByRole('heading', { name: /Create your DevTrack account/ })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Email'), 'new@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-horse');
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/auth/register');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).timezone).toBe(Intl.DateTimeFormat().resolvedOptions().timeZone);
  });

  it('explains why the user is back at sign-in after a stale session', async () => {
    window.history.pushState({}, '', '/login?reason=expired');
    render(<AuthForm />);
    expect(await screen.findByRole('status')).toHaveTextContent('Your session ended. Sign in again.');
    window.history.pushState({}, '', '/login');
  });

  it('shows no notice on a normal visit', () => {
    render(<AuthForm />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
