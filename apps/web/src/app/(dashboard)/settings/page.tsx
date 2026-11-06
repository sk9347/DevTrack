import type { Metadata } from 'next';
import { SettingsView } from '@/features/settings/settings-view';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <>
      <h1 className="mb-8 text-2xl font-semibold">Settings</h1>
      <SettingsView />
    </>
  );
}
