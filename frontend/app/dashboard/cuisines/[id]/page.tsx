import { Suspense } from 'react';
import { CuisineDetailView } from './_components/cuisine-detail-view';
import DashboardLoadingSkeleton from '@/app/dashboard/_components/dashboard-loading-skeleton';

interface CuisineDetailPageProps {
  params: {
    id: string;
  };
}

export default function CuisineDetailPage({ params }: CuisineDetailPageProps) {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<DashboardLoadingSkeleton variant="detail" />}>
        <CuisineDetailView cuisineId={params.id} />
      </Suspense>
    </div>
  );
}