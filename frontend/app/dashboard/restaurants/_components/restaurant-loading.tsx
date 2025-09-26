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
      {/* Loading state for results summary */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Loading state for table */}
      <Card className="p-0 glass-effect backdrop-blur-xl border-orange-500/20 shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-orange-500/20 hover:bg-orange-500/5">
                <TableHead className="font-semibold text-foreground">Name</TableHead>
                <TableHead>
                  <div className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-orange-500" />
                    <span className="font-semibold text-foreground">Location</span>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="inline-flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-semibold text-foreground">Rating</span>
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-foreground">Tags</TableHead>
                <TableHead className="font-semibold text-foreground">Cuisines</TableHead>
                <TableHead className="font-semibold text-foreground">Updated</TableHead>
                <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: count }).map((_, index) => (
                <TableRow key={index} className="border-orange-500/20 hover:bg-orange-500/5">
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
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        
        <div className="flex items-center space-x-2">
          <Skeleton className="h-9 w-20" />
          <div className="flex items-center space-x-1">
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
            <Skeleton className="h-9 w-9" />
          </div>
          <Skeleton className="h-9 w-20" />
        </div>
      </div>
    </div>
  );
}