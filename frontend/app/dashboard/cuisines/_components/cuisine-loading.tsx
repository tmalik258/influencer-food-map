import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CuisineLoadingProps {
  count?: number;
}

export function CuisineLoading({ count = 6 }: CuisineLoadingProps) {
  return (
    <div className="space-y-6">
      {/* Filters Loading */}
      <Card className="glass-effect backdrop-blur-xl border-orange-500/20 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Results Summary Loading */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-48" />
      </div>

      {/* Table Loading */}
      <Card className="p-0 glass-effect backdrop-blur-xl border-orange-500/20 shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Table Header */}
              <div className="border-b border-orange-500/20 bg-orange-500/5">
                <div className="flex">
                  <div className="px-6 py-4 flex-1">
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="px-6 py-4 flex-1">
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="px-6 py-4 w-32 text-right">
                    <Skeleton className="h-5 w-16 ml-auto" />
                  </div>
                </div>
              </div>
              
              {/* Table Rows */}
              {Array.from({ length: count }).map((_, index) => (
                <div key={index} className="border-b border-orange-500/10">
                  <div className="flex">
                    <div className="px-6 py-4 flex-1">
                      <Skeleton className="h-5 w-32" />
                    </div>
                    <div className="px-6 py-4 flex-1">
                      <Skeleton className="h-5 w-24" />
                    </div>
                    <div className="px-6 py-4 w-32">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pagination Loading */}
      <div className="flex justify-center mt-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
    </div>
  );
}