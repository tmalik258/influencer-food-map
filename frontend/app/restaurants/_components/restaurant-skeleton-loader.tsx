"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function RestaurantSkeletonLoader() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section Skeleton */}
      <div className="p-2">
        <div className="relative min-h-[70vh] rounded-lg pt-10 flex items-center justify-center overflow-hidden mb-8">
          <Skeleton className="absolute inset-0 z-0" />
          <div className="absolute inset-0 bg-black/60"></div>
          <div className="relative z-10 text-center text-white px-4">
            <Skeleton className="h-6 w-32 mx-auto mb-2 bg-white/20" />
            <Skeleton className="h-16 w-80 mx-auto mb-4 bg-white/20" />
            <Skeleton className="h-8 w-96 mx-auto bg-white/20" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-8 w-64 mb-1" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Search and Filter Skeleton */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-full sm:w-48" />
          <Skeleton className="h-10 w-full sm:w-48" />
          <Skeleton className="h-10 w-full sm:w-56" />
        </div>

        {/* Restaurant Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card
              key={index}
              className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group p-4"
            >
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
                <Skeleton className="h-9 w-24 rounded-md" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}