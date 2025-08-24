"use client";

import { RestaurantCard } from "@/components/restaurant-card";
import { Restaurant } from "@/types/index";

interface RestaurantLatestListingsProps {
  restaurants: Restaurant[];
}

export function RestaurantLatestListings({
  restaurants,
}: RestaurantLatestListingsProps) {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Latest Listings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {restaurants.slice(0, 3).map((restaurant) => (
          <RestaurantCard
            key={restaurant.id}
            restaurant={restaurant}
            listings={restaurant.listings || []}
          />
        ))}
      </div>
    </div>
  );
}
