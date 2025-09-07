"use client";

import RestaurantMap from "@/components/dynamic-restaurant-map";
import { Restaurant } from "@/lib/types/index";
import RestaurantDetailCard from "@/components/restaurant-detail-card";

interface RestaurantMapViewProps {
  filteredRestaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  setSelectedRestaurant: (restaurant: Restaurant | null) => void;
  loading?: boolean;
}

export function RestaurantMapView({
  filteredRestaurants,
  selectedRestaurant,
  setSelectedRestaurant,
  loading = false,
}: RestaurantMapViewProps) {
  if (loading) {
    return (
      <div className="mb-8">
        <div className="h-[400px] md:h-[600px] w-full bg-gray-100 rounded-lg animate-pulse flex items-center justify-center">
          <div className="text-gray-500">Loading map...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <RestaurantMap
        restaurants={filteredRestaurants}
        selectedRestaurant={selectedRestaurant}
        onRestaurantSelect={setSelectedRestaurant}
        className="h-[400px] md:h-[600px] w-full"
      />

      {selectedRestaurant && (
        <RestaurantDetailCard
          restaurant={selectedRestaurant}
          cuisines={selectedRestaurant?.cuisines}
          listings={selectedRestaurant?.listings}
          className="mt-4"
        />
      )}
    </div>
  );
}
