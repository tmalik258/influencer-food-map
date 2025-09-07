import { Suspense } from 'react';
import LoadingSkeleton from '@/components/loading-skeleton';
import { AnalyticsManagement } from './_components/analytics-management';

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          View detailed analytics and insights about your platform.
        </p>
      </div>
      
      <Suspense fallback={<LoadingSkeleton />}>
        <AnalyticsManagement />
      </Suspense>
    </div>
  );
}