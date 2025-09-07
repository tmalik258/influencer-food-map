import { Suspense } from 'react';
import { InfluencerManagement } from './_components/influencer-management';
import LoadingSkeleton from '@/components/loading-skeleton';

export default function InfluencersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Influencer Management</h1>
          <p className="text-muted-foreground">
            Manage food influencers and their content
          </p>
        </div>
      </div>
      
      <Suspense fallback={<LoadingSkeleton />}>
        <InfluencerManagement />
      </Suspense>
    </div>
  );
}