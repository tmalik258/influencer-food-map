import { Suspense } from "react";
import VideoManagement from "./_components/video-management";
import DashboardLoadingSkeleton from '@/app/dashboard/_components/dashboard-loading-skeleton';

export default function VideosPage() {
  return (
    <div className="container mx-auto">
      <Suspense fallback={<DashboardLoadingSkeleton variant="management" />}>
        <VideoManagement />
      </Suspense>
    </div>
  );
}