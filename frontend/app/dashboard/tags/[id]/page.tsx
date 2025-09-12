import { Suspense } from 'react';
import { TagDetailView } from './_components/tag-detail-view';
import DashboardLoadingSkeleton from '@/app/dashboard/_components/dashboard-loading-skeleton';

interface TagDetailPageProps {
  params: {
    id: string;
  };
}

export default function TagDetailPage({ params }: TagDetailPageProps) {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<DashboardLoadingSkeleton variant="detail" />}>
        <TagDetailView tagId={params.id} />
      </Suspense>
    </div>
  );
}