"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  MapPin,
  ArrowLeft,
  Grid3X3,
  Map,
  X,
} from "lucide-react";
import { Restaurant, Listing } from "@/types";
import { getSearchPlaceholder } from "@/lib/utils/search-utils";
import { useRestaurants, useListings } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RestaurantHeroSection } from "./restaurant-hero-section";
import { RestaurantSearchFilter } from "./restaurant-search-filter";
import { RestaurantGridView } from "./restaurant-grid-view";
import { RestaurantMapView } from "./restaurant-map-view";
import { RestaurantLatestListings } from "./restaurant-latest-listings";
import ErrorCard from "@/components/error-card";

export function RestaurantsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const city = searchParams.get("city") || "";
  const viewParam = searchParams.get("view");

  // Default to grid if no parameter, otherwise use the specified view
  const initialViewMode = viewParam === "map" ? "map" : "grid";
  const [viewMode, setViewMode] = useState<"grid" | "map">(initialViewMode);
  const [selectedRestaurant, setSelectedRestaurant] =
    useState<Restaurant | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("");
  const [sortBy, setSortBy] = useState("");
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(
    []
  );
  const [restaurantListings, setRestaurantListings] = useState<Listing[]>([]);
  const [filteredLatestListings, setFilteredLatestListings] = useState<Listing[]>([]);

  // Function to update URL with view parameter
  const updateViewMode = (newViewMode: "grid" | "map") => {
    const params = new URLSearchParams(searchParams.toString());
    if (newViewMode === "grid") {
      params.delete("view"); // Remove view param for grid (default)
    } else {
      params.set("view", newViewMode);
    }
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;
    
    // Use router.replace with scroll: false to preserve scroll position
    router.replace(newUrl, { scroll: false });
    setViewMode(newViewMode);
  };

  // Function to clear city selection
  const clearCitySelection = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("city");
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;
    
    router.push(newUrl);
  };

  const {
    restaurants,
    loading: restaurantsLoading,
    error: restaurantsError,
    searchByCity,
    fetchRestaurants,
  } = useRestaurants();
  const { listings, loading: listingsLoading, fetchListings } = useListings();

  const handleRefresh = () => {
    if (city) {
      searchByCity(city);
    } else {
      fetchRestaurants();
    }
    fetchListings({ limit: 200 });
  };

  const loading = restaurantsLoading || listingsLoading;
  const error = restaurantsError;

  useEffect(() => {
    const loadData = async () => {
      try {
        if (city) {
          await searchByCity(city);
        } else {
          await fetchRestaurants();
        }
        await fetchListings({ limit: 200 });
      } catch (error) {
        console.error("Error loading restaurants data:", error);
      }
    };

    loadData();
  }, [city, searchByCity, fetchRestaurants, fetchListings]);

  // Set up filtered restaurants and listings
  useEffect(() => {
    if (restaurants.length > 0) {
      let filtered = [...restaurants];

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();

        if (searchType === "all") {
          // Search across all fields
          filtered = filtered.filter((restaurant) => {
            // Basic restaurant info
            const restaurantMatch =
              restaurant.name.toLowerCase().includes(query) ||
              restaurant.address?.toLowerCase().includes(query) ||
              restaurant.city?.toLowerCase().includes(query);

            // Check if restaurant has listings with matching criteria
            const hasMatchingListing = restaurantListings.some((listing) => {
              if (listing.restaurant.id !== restaurant.id) return false;

              return (
                listing.influencer.name.toLowerCase().includes(query) ||
                listing.video.title.toLowerCase().includes(query) ||
                listing.video.description?.toLowerCase().includes(query) ||
                restaurant.tags?.some((tag) =>
                  tag.name.toLowerCase().includes(query)
                )
              );
            });

            return restaurantMatch || hasMatchingListing;
          });
        } else {
          // Search by specific type
          filtered = filtered.filter((restaurant) => {
            switch (searchType) {
              case "restaurant":
                return restaurant.name.toLowerCase().includes(query);
              case "city":
                return restaurant.city?.toLowerCase().includes(query);
              case "tags":
                return restaurant.tags?.some((tag) =>
                  tag.name.toLowerCase().includes(query)
                );
              case "influencer":
                return restaurantListings.some(
                  (listing) =>
                    listing.restaurant.id === restaurant.id &&
                    listing.influencer.name.toLowerCase().includes(query)
                );
              case "video":
                return restaurantListings.some(
                  (listing) =>
                    listing.restaurant.id === restaurant.id &&
                    (listing.video.title.toLowerCase().includes(query) ||
                      listing.video.description?.toLowerCase().includes(query))
                );
              default:
                return true;
            }
          });
        }
      }

      // Apply sorting
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name);
          case "rating":
            return (b.google_rating || 0) - (a.google_rating || 0);
          case "city":
            return (a.city || "").localeCompare(b.city || "");
          default:
            return 0;
        }
      });

      setFilteredRestaurants(filtered);
    }
  }, [restaurants, searchQuery, searchType, sortBy, restaurantListings]);

  // Set up restaurant listings
  useEffect(() => {
    if (listings.length > 0) {
      setRestaurantListings(listings);
    }
  }, [listings]);

  // Set up filtered latest listings based on filtered restaurants
  useEffect(() => {
    if (restaurantListings.length > 0 && filteredRestaurants.length > 0) {
      const filteredRestaurantIds = new Set(filteredRestaurants.map(r => r.id));
      
      const filtered = restaurantListings
        .filter(listing => filteredRestaurantIds.has(listing.restaurant.id))
        .sort((a, b) => {
          // Apply the same sorting logic as the main restaurant list
          switch (sortBy) {
            case "name":
              return a.restaurant.name.localeCompare(b.restaurant.name);
            case "rating":
              return (b.restaurant.google_rating || 0) - (a.restaurant.google_rating || 0);
            case "city":
              return (a.restaurant.city || "").localeCompare(b.restaurant.city || "");
            default:
              // Default to created_at in descending order (newest first)
              const dateA = new Date(a.created_at || 0).getTime();
              const dateB = new Date(b.created_at || 0).getTime();
              return dateB - dateA;
          }
        })
        .slice(0, 3); // Get only the 3 latest
      
      setFilteredLatestListings(filtered);
    } else {
      setFilteredLatestListings([]);
    }
  }, [restaurantListings, filteredRestaurants, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        {/* Hero Section Skeleton */}
        <div className="p-2">
          <div className="relative min-h-[70vh] rounded-lg pt-10 flex items-center justify-center overflow-hidden mb-8">
            <Skeleton className="absolute inset-0 z-0" />
            <div className="absolute inset-0 bg-black/60"></div>
            <div className="relative z-10 text-center text-white px-4">
              <Skeleton className="h-6 w-32 mx-auto mb-2 bg-white/20" />
              <Skeleton className="h-16 w-80 mx-auto mb-4 bg-white/20" />
              <Skeleton className="h-8 w-96 mx-auto bg-white/20" />
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header Skeleton */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
            <Skeleton className="h-8 w-64 mb-1" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Search and Filter Skeleton */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-full sm:w-48" />
            <Skeleton className="h-10 w-full sm:w-48" />
          </div>

          {/* Restaurant Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card
                key={index}
                className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group p-4"
              >
                <div className="relative mb-4">
                  <Skeleton className="h-48 w-full rounded-lg" />
                </div>
                <div className="space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-9 w-24 rounded-md" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <ErrorCard
          title="Something went wrong"
          message="We're having trouble loading the restaurants. Please try again later."
          error={error}
          onRefresh={handleRefresh}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
    <div className="p-2">
      <RestaurantHeroSection city={city} />
    </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900"
              >
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Link>
              </Button>
              {city && (
                <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{city}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearCitySelection}
                    className="h-5 w-5 p-0 ml-1 hover:bg-gray-200 text-gray-500 hover:text-gray-700 cursor-pointer"
                    title="Clear city selection"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => updateViewMode("grid")}
                className={`h-8 px-3 ${
                  viewMode === "grid"
                    ? "bg-white shadow-sm text-gray-900 hover:text-white"
                    : "hover:bg-gray-200 text-gray-700"
                }`}
              >
                <Grid3X3 className="w-4 h-4 mr-1" />
                List
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => updateViewMode("map")}
                className={`h-8 px-3 ${
                  viewMode === "map"
                    ? "bg-white shadow-sm text-gray-900 hover:text-white"
                    : "hover:bg-gray-200 text-gray-700"
                }`}
              >
                <Map className="w-4 h-4 mr-1" />
                Map
              </Button>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {city ? `Restaurants in ${city}` : "All Restaurants"}
          </h1>
          <p className="text-gray-600 text-sm">
            {filteredRestaurants.length} result
            {filteredRestaurants.length !== 1 ? "s" : ""}
          </p>
        </div>

        <RestaurantSearchFilter
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          searchType={searchType}
          setSearchType={setSearchType}
          sortBy={sortBy}
          setSortBy={setSortBy}
          getSearchPlaceholder={getSearchPlaceholder}
        />

        {filteredRestaurants.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="py-8">
              <p className="text-slate-600 mb-4">
                No restaurants found in {city}.
              </p>
              <Button asChild variant="outline">
                <Link href="/">Try a different city</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Map View */}
            {viewMode === "map" && (
              <RestaurantMapView
                filteredRestaurants={filteredRestaurants}
                selectedRestaurant={selectedRestaurant}
                setSelectedRestaurant={setSelectedRestaurant}
                restaurantListings={restaurantListings}
              />
            )}

            {/* Latest Listings Section (only for map view) */}
            {viewMode === "map" && filteredLatestListings.length > 0 && (
              <RestaurantLatestListings restaurantListings={filteredLatestListings} />
            )}

            {/* Grid View */}
            {viewMode === "grid" && (
              <RestaurantGridView
                filteredRestaurants={filteredRestaurants}
                restaurantListings={restaurantListings}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
