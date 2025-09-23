"use client";

import { Card, CardContent } from "@/components/ui/card";

interface RestaurantEmptyStateProps {
  hasRestaurants: boolean;
  hasActiveFilters: boolean;
}

export function RestaurantEmptyState({
  hasRestaurants,
  hasActiveFilters,
}: RestaurantEmptyStateProps) {
  if (hasRestaurants) {
    return null;
  }

  return (
    <Card className="glass-effect backdrop-blur-xl border-orange-500/20 shadow-lg">
      <CardContent className="pt-6 text-center text-muted-foreground">
        <p className="text-lg font-medium">
          {!hasRestaurants && "No restaurants found."}
        </p>
        {hasActiveFilters && !hasRestaurants && (
          <p className="text-sm mt-2 text-orange-500">
            Try adjusting your search terms or filters.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
