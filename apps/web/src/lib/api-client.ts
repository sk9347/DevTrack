export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** Nest validation errors arrive as { message: string | string[] }. */
export function errorMessage(body: unknown, fallback: string): string {
  const m = (body as { message?: unknown } | null)?.message;
  if (Array.isArray(m)) return m.join('. ');
  return typeof m === 'string' && m ? m : fallback;
}

export async function api<T = unknown>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/v1${path}`, {
      method: init.method ?? 'GET',
      credentials: 'same-origin',
      headers: init.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and try again.', 0);
  }
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 401 && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.assign('/login');
    }
    throw new ApiError(errorMessage(body, `Request failed (${res.status})`), res.status);
  }
  return body as T;
}

const MUTATED = 'devtrack:mutated';

/** Call after any write so mounted useFetch hooks refetch. */
export const notifyMutated = () => window.dispatchEvent(new Event(MUTATED));
export const onMutated = (fn: () => void) => {
  window.addEventListener(MUTATED, fn);
  return () => window.removeEventListener(MUTATED, fn);
};
