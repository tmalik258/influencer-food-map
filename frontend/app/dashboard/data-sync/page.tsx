import { Suspense } from 'react';
import { DataSyncManagement } from './_components/data-sync-management';
import LoadingSkeleton from '@/components/loading-skeleton';

export default function DataSyncPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Data Synchronization
        </h1>
        <p className="text-muted-foreground">
          Monitor and manage data synchronization jobs and processes
        </p>
      </div>
      
      <Suspense fallback={<LoadingSkeleton />}>
        <DataSyncManagement />
      </Suspense>
    </div>
  );
}