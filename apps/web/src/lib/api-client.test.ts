import { afterEach, vi } from 'vitest';
import { api, ApiError, errorMessage } from './api-client';

afterEach(() => vi.unstubAllGlobals());

const respond = (status: number, body?: unknown) =>
  vi.fn().mockResolvedValue({ ok: status < 400, status, json: async () => body });

describe('errorMessage', () => {
  it('joins validation message arrays', () => {
    expect(errorMessage({ message: ['Enter a valid email address', 'Password too short'] }, 'x')).toBe(
      'Enter a valid email address. Password too short',
    );
  });
  it('uses a string message, else the fallback', () => {
    expect(errorMessage({ message: 'Incorrect email or password' }, 'x')).toBe('Incorrect email or password');
    expect(errorMessage(null, 'Request failed')).toBe('Request failed');
  });
});

describe('api', () => {
  it('sends JSON with same-origin credentials and returns the body', async () => {
    const fetchMock = respond(200, { ok: true });
    vi.stubGlobal('fetch', fetchMock);
    await expect(api('/habits', { method: 'POST', body: { name: 'DSA' } })).resolves.toEqual({ ok: true });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/v1/habits');
    expect(init).toMatchObject({ method: 'POST', credentials: 'same-origin', body: '{"name":"DSA"}' });
  });

  it('resolves undefined for 204', async () => {
    vi.stubGlobal('fetch', respond(204));
    await expect(api('/habits/1', { method: 'DELETE' })).resolves.toBeUndefined();
  });

  it('throws an ApiError carrying the server message and status', async () => {
    vi.stubGlobal('fetch', respond(400, { message: ['Log at least 1 minute'] }));
    await expect(api('/sessions', { method: 'POST', body: {} })).rejects.toMatchObject({
      message: 'Log at least 1 minute',
      status: 400,
    });
  });

  it('turns a network failure into a readable error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('fetch failed')));
    const err = (await api('/habits').catch((e) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.message).toMatch(/Cannot reach the server/);
  });
});
