'use client';

import { Input } from '@/components/ui/Input';
import { useWizardStore } from '@/store/wizard';

export function Step0ClientInfo() {
  const { client, setClient } = useWizardStore();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-c-text">Client Information</h2>
        <p className="text-base text-c-text-3 mt-1">Contact details for this quote.</p>
      </div>

      <div className="space-y-5">
        <Input
          label="Full Name"
          placeholder="e.g. Michael & Sarah Thompson"
          value={client.name ?? ''}
          onChange={e => setClient({ name: e.target.value })}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="client@email.com"
            value={client.email ?? ''}
            onChange={e => setClient({ email: e.target.value })}
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="(303) 555-0000"
            value={client.phone ?? ''}
            onChange={e => setClient({ phone: e.target.value })}
          />
        </div>

        <Input
          label="Billing Address"
          placeholder="123 Main St, Boulder, CO 80302"
          value={client.address ?? ''}
          onChange={e => setClient({ address: e.target.value })}
        />

        <Input
          label="Project Address"
          hint="Leave blank if same as billing address"
          placeholder="Only if different from billing"
          value={client.projectAddress ?? ''}
          onChange={e => setClient({ projectAddress: e.target.value })}
        />
      </div>
    </div>
  );
}
