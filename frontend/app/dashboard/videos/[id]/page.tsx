import { Suspense } from 'react';
import { VideoDetailView } from './_components/video-detail-view';
import DashboardLoadingSkeleton from '@/app/dashboard/_components/dashboard-loading-skeleton';

interface VideoDetailPageProps {
  params: {
    id: string;
  };
}

export default function VideoDetailPage({ params }: VideoDetailPageProps) {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<DashboardLoadingSkeleton variant="detail" />}>
        <VideoDetailView videoId={params.id} />
      </Suspense>
    </div>
  );
}