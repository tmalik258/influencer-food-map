"use client";

import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import InfluencersContent from "./_components/influencers-content";

function InfluencersLoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-2">
      {/* Hero Section Skeleton */}
      <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20 rounded-lg bg-gray-200">
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <Skeleton className="h-16 w-96 mx-auto mb-6" />
          <Skeleton className="h-8 w-[600px] mx-auto mb-8" />
          <div className="flex justify-center items-center gap-8 mb-8">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-36" />
          </div>
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 py-16 -mt-8 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <Skeleton className="h-12 w-full mb-8" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <Skeleton className="h-32 w-full" />
                <div className="p-6">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <Skeleton className="h-16 w-full mb-4" />
                  <div className="flex gap-2 mb-4">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-18" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function InfluencersPage() {
  return (
    <Suspense fallback={<InfluencersLoadingSkeleton />}>
      <InfluencersContent />
    </Suspense>
  );
}