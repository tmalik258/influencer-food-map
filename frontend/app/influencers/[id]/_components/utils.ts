import type { Listing } from "@/lib/types/index";

export const getUniqueRestaurantsCount = (listings: Listing[]): number => {
  return new Set(listings.map((listing) => listing?.restaurant?.id)).size;
};

export const getMostReviewedCuisine = (listings: Listing[]): string => {
  if (!listings || listings.length === 0) return "Cuisine";

  const cuisineCount: Record<string, number> = {};

  listings.forEach((listing) => {
    listing?.restaurant?.tags?.forEach((tag) => {
      if (tag?.name) {
        cuisineCount[tag.name] = (cuisineCount[tag.name] || 0) + 1;
      }
    });
  });

  if (Object.keys(cuisineCount).length === 0) return "Cuisine";

  const mostReviewedCuisine = Object.entries(cuisineCount)
    .sort(([, a], [, b]) => b - a)[0][0];

  return mostReviewedCuisine;
};