"use client";

import { RestaurantCard } from "@/components/restaurant-card";
import { Restaurant, Listing } from "@/types/index";

interface RestaurantGridViewProps {
  filteredRestaurants: Restaurant[];
  restaurantListings: Listing[];
}

export function RestaurantGridView({
  filteredRestaurants,
  restaurantListings,
}: RestaurantGridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {filteredRestaurants.map((restaurant) => (
        <RestaurantCard
          key={restaurant.id}
          restaurant={restaurant}
          restaurantListings={
            restaurantListings.filter(
              (listing) => listing.restaurant?.id === restaurant.id
            )
          }
        />
      ))}
    </div>
  );
}
