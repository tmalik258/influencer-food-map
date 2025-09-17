import { Suspense } from "react";
import { CuisineManagement } from "./_components/cuisine-management";
import DashboardLoadingSkeleton from '@/app/dashboard/_components/dashboard-loading-skeleton';

export default function CuisinesPage() {
  return (
    <Suspense fallback={<DashboardLoadingSkeleton variant="management" />}>
      <CuisineManagement />
    </Suspense>
  );
}