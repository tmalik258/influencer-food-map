import { Suspense } from "react";
import InfluencerManagement from "./_components/influencer-management";
import DashboardLoadingSkeleton from '@/app/dashboard/_components/dashboard-loading-skeleton';

export default function InfluencersPage() {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton variant="management" />}>
      <InfluencerManagement />
    </Suspense>
  );
}