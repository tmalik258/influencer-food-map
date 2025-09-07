import { Suspense } from 'react';
import { DashboardOverview } from './_components/dashboard-overview';
import LoadingSkeleton from '@/components/loading-skeleton';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard Overview
        </h1>
        <p className="text-muted-foreground">
          Monitor your platform&apos;s performance and key metrics
        </p>
      </div>
      
      <Suspense fallback={<LoadingSkeleton />}>
        <DashboardOverview />
      </Suspense>
    </div>
  );
}