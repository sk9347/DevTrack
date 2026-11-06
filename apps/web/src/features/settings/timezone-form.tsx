'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { Button, ErrorText, Field, SelectInput } from '@/components/ui/controls';
import { api, notifyMutated } from '@/lib/api-client';
import { deviceTimezone, sameZone, timezoneOptions } from './timezones';

export function TimezoneForm({ current }: { current: string }) {
  const [saved, setSaved] = useState(current);
  const [value, setValue] = useState(current);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const options = useMemo(() => timezoneOptions(saved), [saved]);
  const device = deviceTimezone();

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setStatus(null);
    try {
      await api('/auth/me', { method: 'PATCH', body: { timezone: value } });
      setSaved(value);
      setStatus(`Timezone is now ${value}. Your history has been regrouped into days in this timezone.`);
      notifyMutated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the timezone');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={save} noValidate aria-label="Timezone settings" className="max-w-md space-y-3">
      <Field
        label="Timezone"
        hint="Decides where each day starts and ends. Changing it regroups past sessions into the new timezone's days, so a streak can shift."
      >
        <SelectInput value={value} onChange={(e) => setValue(e.target.value)}>
          {options.map((z) => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </SelectInput>
      </Field>
      {device && !sameZone(device, value) && options.includes(device) && (
        <button
          type="button"
          onClick={() => setValue(device)}
          className="min-h-11 cursor-pointer text-sm text-accent underline-offset-2 hover:underline"
        >
          Use this device&apos;s timezone ({device})
        </button>
      )}
      <ErrorText>{error}</ErrorText>
      <Button type="submit" variant="primary" disabled={busy || value === saved}>
        Save timezone
      </Button>
      {status && (
        <p role="status" className="text-sm text-muted">
          {status}
        </p>
      )}
    </form>
  );
}
