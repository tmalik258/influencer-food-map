import { Suspense } from 'react';
import { DataSyncManagement } from './_components/data-sync-management';
import DashboardLoadingSkeleton from '@/app/dashboard/_components/dashboard-loading-skeleton';

export default function DataSyncPage() {
  return (
    <div className="space-y-6 dark:bg-black p-6 rounded-lg">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Data Synchronization
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor and manage data synchronization jobs and processes
        </p>
      </div>
      
      <Suspense fallback={<DashboardLoadingSkeleton variant="management" />}>
        <DataSyncManagement />
      </Suspense>
    </div>
  );
}