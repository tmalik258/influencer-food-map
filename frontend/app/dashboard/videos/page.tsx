import { Suspense } from "react";
import VideoManagement from "./_components/video-management";
import LoadingSkeleton from "@/components/loading-skeleton";

export default function VideosPage() {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<LoadingSkeleton />}>
        <VideoManagement />
      </Suspense>
    </div>
  );
}