"use client";

import { RestaurantCard } from "@/components/restaurant-card";
import { Restaurant } from "@/types/index";

interface RestaurantGridViewProps {
  filteredRestaurants: Restaurant[];
}

export function RestaurantGridView({
  filteredRestaurants,
}: RestaurantGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredRestaurants.map((restaurant) => (
        <RestaurantCard
          key={restaurant.id}
          restaurant={restaurant}
          listings={restaurant.listings || []}
        />
      ))}
    </div>
  );
}
