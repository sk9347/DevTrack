import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/controls';
import { SettingsView } from '@/features/settings/settings-view';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Your account, your timezone, and a copy of your data." />
      <SettingsView />
    </>
  );
}
