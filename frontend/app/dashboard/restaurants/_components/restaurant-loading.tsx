"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, Star } from "lucide-react";

interface RestaurantLoadingProps {
  count?: number;
}

export function RestaurantLoading({ count = 6 }: RestaurantLoadingProps) {
  return (
    <div className="space-y-6">
      {/* Loading state for filters section */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-4 flex-1">
            {/* Search input skeleton */}
            <div className="flex-1">
              <Skeleton className="h-10 w-full" />
            </div>
            
            {/* Filter dropdown skeleton */}
            <div className="w-full sm:w-48">
              <Skeleton className="h-10 w-full" />
            </div>
            
            {/* Sort dropdown skeleton */}
            <div className="w-full sm:w-48">
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          
          {/* Add button skeleton */}
          <div className="w-full sm:w-auto">
            <Skeleton className="h-10 w-full sm:w-40" />
          </div>
        </div>
      </Card>

      {/* Loading state for results summary */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Loading state for table */}
      <Card className="p-0">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>
                  <div className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Location
                  </div>
                </TableHead>
                <TableHead>
                  <div className="inline-flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    Rating
                  </div>
                </TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Cuisines</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: count }).map((_, index) => (
                <TableRow key={index} className="hover:bg-muted/50">
                  {/* Restaurant Name */}
                  <TableCell>
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  </TableCell>
                  
                  {/* Location */}
                  <TableCell>
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </TableCell>
                  
                  {/* Rating */}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, starIndex) => (
                          <Skeleton key={starIndex} className="h-4 w-4 rounded-full" />
                        ))}
                      </div>
                      <Skeleton className="h-4 w-8" />
                    </div>
                  </TableCell>
                  
                  {/* Tags */}
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      <Skeleton className="h-6 w-16 rounded-full" />
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-14 rounded-full" />
                    </div>
                  </TableCell>
                  
                  {/* Cuisines */}
                  <TableCell>
                    <div className="flex gap-1 flex-wrap">
                      <Skeleton className="h-6 w-18 rounded-full" />
                      <Skeleton className="h-6 w-22 rounded-full" />
                    </div>
                  </TableCell>
                  
                  {/* Updated */}
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  
                  {/* Actions */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                      <Skeleton className="h-8 w-8 rounded" />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Loading state for pagination */}
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