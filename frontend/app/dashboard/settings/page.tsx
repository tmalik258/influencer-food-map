import { Suspense } from 'react';
import LoadingSkeleton from '@/components/loading-skeleton';
import { SettingsManagement } from './_components/settings-management';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </div>
      
      <Suspense fallback={<LoadingSkeleton />}>
        <SettingsManagement />
      </Suspense>
    </div>
  );
}