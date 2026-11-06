'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, onMutated } from './api-client';

/** Fetches `path` (null = skip), and refetches whenever any write calls notifyMutated(). */
export function useFetch<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(path !== null);

  const load = useCallback(async () => {
    if (path === null) return;
    try {
      setData(await api<T>(path));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    setLoading(path !== null);
    void load();
    return onMutated(() => void load());
  }, [load, path]);

  return { data, error, loading, reload: load };
}
