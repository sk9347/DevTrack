'use client';

import { Panel, Region, SectionHeading } from '@/components/ui/controls';
import { useFetch } from '@/lib/use-fetch';
import type { User } from '@/types';
import { DataExport } from './data-export';
import { DeleteAccount } from './delete-account';
import { PasswordForm } from './password-form';
import { TimezoneForm } from './timezone-form';

export function SettingsView() {
  const me = useFetch<{ user: User }>('/auth/me');
  return (
    <Region state={me} what="your account" skeleton="h-32">
      {({ user }) => (
        <div className="space-y-6">
          <Panel>
            <section aria-labelledby="account-h">
              <SectionHeading>
                <span id="account-h">Account</span>
              </SectionHeading>
              <p className="text-sm">
                Signed in as <span className="font-medium">{user.email}</span>
              </p>
            </section>
          </Panel>

          <Panel>
            <section aria-labelledby="tz-h">
              <SectionHeading>
                <span id="tz-h">Timezone</span>
              </SectionHeading>
              <TimezoneForm current={user.timezone} />
            </section>
          </Panel>

          <Panel>
            <section aria-labelledby="pw-h">
              <SectionHeading>
                <span id="pw-h">Password</span>
              </SectionHeading>
              <PasswordForm />
            </section>
          </Panel>

          <Panel>
            <section aria-labelledby="data-h">
              <SectionHeading>
                <span id="data-h">Your data</span>
              </SectionHeading>
              <DataExport />
            </section>
          </Panel>

          <Panel>
            <section aria-labelledby="del-h">
              <SectionHeading>
                <span id="del-h">Delete account</span>
              </SectionHeading>
              <DeleteAccount userId={user.id} />
            </section>
          </Panel>
        </div>
      )}
    </Region>
  );
}
