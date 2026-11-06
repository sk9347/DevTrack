'use client';

import { Region, SectionHeading } from '@/components/ui/controls';
import { useFetch } from '@/lib/use-fetch';
import type { User } from '@/types';
import { DataExport } from './data-export';
import { DeleteAccount } from './delete-account';
import { PasswordForm } from './password-form';
import { TimezoneForm } from './timezone-form';

export function SettingsView() {
  const me = useFetch<{ user: User }>('/auth/me');
  return (
    <div className="space-y-10">
      <Region state={me} what="your account" skeleton="h-32">
        {({ user }) => (
          <>
            <section aria-labelledby="account-h">
              <SectionHeading>
                <span id="account-h">Account</span>
              </SectionHeading>
              <p className="text-sm">
                Signed in as <span className="font-medium">{user.email}</span>
              </p>
            </section>
            <section aria-labelledby="tz-h">
              <SectionHeading>
                <span id="tz-h">Timezone</span>
              </SectionHeading>
              <TimezoneForm current={user.timezone} />
            </section>
            <section aria-labelledby="pw-h">
              <SectionHeading>
                <span id="pw-h">Password</span>
              </SectionHeading>
              <PasswordForm />
            </section>
            <section aria-labelledby="data-h">
              <SectionHeading>
                <span id="data-h">Your data</span>
              </SectionHeading>
              <DataExport />
            </section>
            <section aria-labelledby="del-h" className="pb-4">
              <SectionHeading>
                <span id="del-h">Delete account</span>
              </SectionHeading>
              <DeleteAccount userId={user.id} />
            </section>
          </>
        )}
      </Region>
    </div>
  );
}
