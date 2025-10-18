"use client";

import { RestaurantCard } from "@/components/restaurant-card";
import { RestaurantSkeletonLoader } from "./restaurant-skeleton-loader";
import { Restaurant } from "@/lib/types/index";

interface RestaurantGridViewProps {
  filteredRestaurants: Restaurant[];
  loading?: boolean;
}

export function RestaurantGridView({
  filteredRestaurants,
  loading = false,
}: RestaurantGridViewProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <RestaurantSkeletonLoader key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredRestaurants.map((restaurant) => (
        <RestaurantCard
          key={restaurant.slug}
          restaurant={restaurant}
          listings={restaurant.listings || []}
        />
      ))}
    </div>
  );
}
