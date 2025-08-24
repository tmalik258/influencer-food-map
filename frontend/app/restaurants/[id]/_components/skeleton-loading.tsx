import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";


const SkeletonLoading = () => {
  return (
    <div className="min-h-screen bg-white p-2">
      {/* Hero Section Skeleton */}
      <div className="relative h-[calc(65vh)] rounded-xl overflow-hidden mb-2">
        <Skeleton className="w-full h-full" />
        {/* Title Overlay Skeleton */}
        <div className="absolute bottom-20 left-0 right-0 text-center p-6 md:p-8 z-50">
          <Skeleton className="h-12 md:h-16 w-80 mx-auto mb-4" />
          <div className="flex items-center justify-center gap-5">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Overlapping Map Skeleton */}
        <div className="relative -mt-16 mb-8 mx-2 z-10">
          <Skeleton className="h-[300px] md:h-[350px] max-w-6xl w-[70vw] max-md:w-[80vw] mx-auto rounded-xl" />
        </div>

        {/* Reviews Section Skeleton */}
        <div className="mb-8">
          <Skeleton className="h-7 w-48 mb-6" />
          <div className="space-y-6">
            {Array.from({ length: 2 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-6 w-32 mb-2" />
                      <Skeleton className="h-4 w-48 mb-4" />
                      <Skeleton className="h-16 w-full mb-4" />
                      <Skeleton className="h-10 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Google Reviews Section Skeleton */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-6 w-16" />
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="w-4 h-4" />
              ))}
            </div>
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-20 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="flex gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="w-3 h-3" />
                    ))}
                  </div>
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonLoading;
