"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

interface LoadingSkeletonProps {
  variant?: "restaurant" | "influencer" | "listing" | "hero" | "grid";
  count?: number;
  className?: string;
}

export default function LoadingSkeleton({
  variant = "grid",
  count = 3,
  className = ""
}: LoadingSkeletonProps) {
  const renderRestaurantSkeleton = () => (
    <Card className={`overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group p-4 ${className}`}>
      <div className="relative mb-4">
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-2/3" />
      </div>
    </Card>
  );

  const renderInfluencerSkeleton = () => (
    <Card className={`bg-white shadow-xl ${className}`}>
      <CardContent className="p-6 text-center">
        <Skeleton className="h-12 w-12 mx-auto mb-4 rounded-full" />
        <Skeleton className="h-8 w-16 mx-auto mb-2" />
        <Skeleton className="h-4 w-24 mx-auto" />
      </CardContent>
    </Card>
  );

  const renderListingSkeleton = () => (
    <Card className={`overflow-hidden shadow-lg ${className}`}>
      <div className="relative">
        <Skeleton className="h-64 w-full" />
        <div className="absolute top-4 left-4">
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
    </Card>
  );

  const renderHeroSkeleton = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section Skeleton */}
      <div className="relative h-[70vh] w-full overflow-hidden">
        <Skeleton className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-8 left-8 right-8 text-white">
          <Skeleton className="h-12 md:h-16 w-80 mb-4 bg-white/20" />
          <Skeleton className="h-6 w-64 mb-2 bg-white/20" />
        </div>
      </div>
      
      {/* Overlapping Cards Skeleton */}
      <div className="relative -mt-32 z-10 max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, i) => renderInfluencerSkeleton())}
        </div>
      </div>
    </div>
  );

  const renderGridSkeleton = () => (
    <div className={`grid gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="space-y-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );

  switch (variant) {
    case "restaurant":
      return (
        <>
          {Array.from({ length: count }).map((_, index) => (
            <div key={index}>{renderRestaurantSkeleton()}</div>
          ))}
        </>
      );
    case "influencer":
      return (
        <>
          {Array.from({ length: count }).map((_, index) => (
            <div key={index}>{renderInfluencerSkeleton()}</div>
          ))}
        </>
      );
    case "listing":
      return (
        <>
          {Array.from({ length: count }).map((_, index) => (
            <div key={index}>{renderListingSkeleton()}</div>
          ))}
        </>
      );
    case "hero":
      return renderHeroSkeleton();
    case "grid":
    default:
      return renderGridSkeleton();
  }
}