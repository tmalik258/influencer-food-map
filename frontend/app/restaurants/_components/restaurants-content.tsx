"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { MapPin, ArrowLeft, Grid3X3, Map, X } from "lucide-react";
import { Restaurant, Tag } from "@/types";
import { getSearchPlaceholder } from "@/lib/utils/search-utils";
import { useRestaurants } from "@/lib/hooks";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RestaurantSkeletonLoader } from "@/app/restaurants/_components/restaurant-skeleton-loader";
import { Card, CardContent } from "@/components/ui/card";
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
  // Initialize search and sort from URL parameters
  const searchQueryParam = searchParams.get("search") || "";
  const searchTypeParam = searchParams.get("searchType") || "";
  const sortByParam = searchParams.get("sortBy") || "";

  const [searchQuery, setSearchQuery] = useState(searchQueryParam);
  const [searchType, setSearchType] = useState(searchTypeParam);
  const [sortBy, setSortBy] = useState(sortByParam);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(
    []
  );
  // Initialize selected tags from URL parameters
  const tagsParam = searchParams.get("tags");
  const initialSelectedTags: Tag[] = tagsParam
    ? tagsParam
        .split(",")
        .map((tagId) => ({ id: tagId, name: "", created_at: "" }))
    : [];
  const [selectedTags, setSelectedTags] = useState<Tag[]>(initialSelectedTags);

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

  // Function to update URL with selected tags
  const updateSelectedTags = (newTags: Tag[]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newTags.length === 0) {
      params.delete("tags");
    } else {
      const tagIds = newTags.map((tag) => tag.id.toString()).join(",");
      params.set("tags", tagIds);
    }
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.replace(newUrl, { scroll: false });
    setSelectedTags(newTags);
  };

  // Function to update search query with URL parameter
  const updateSearchQuery = (query: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (query === "") {
      params.delete("search");
    } else {
      params.set("search", query);
    }
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.replace(newUrl, { scroll: false });
    setSearchQuery(query);
  };

  // Function to update search type with URL parameter
  const updateSearchType = (type: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (type === "") {
      params.delete("searchType");
    } else {
      params.set("searchType", type);
    }
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.replace(newUrl, { scroll: false });
    setSearchType(type);
  };

  // Function to update sort by with URL parameter
  const updateSortBy = (sort: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sort === "") {
      params.delete("sortBy");
    } else {
      params.set("sortBy", sort);
    }
    const newUrl = params.toString()
      ? `${pathname}?${params.toString()}`
      : pathname;

    router.replace(newUrl, { scroll: false });
    setSortBy(sort);
  };

  const {
    restaurants,
    loading,
    error,
    searchByCity,
    fetchRestaurantsWithListings,
  } = useRestaurants();
  const handleRefresh = () => {
    if (city) {
      searchByCity(city, true, false); // Include listings, exclude video details for performance
    } else {
      fetchRestaurantsWithListings(undefined, false); // Fetch with listings, exclude video details
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        if (city) {
          await searchByCity(city, true, false); // Include listings, exclude video details for performance
        } else {
          await fetchRestaurantsWithListings(undefined, false); // Fetch with listings, exclude video details
        }
      } catch (error) {
        console.error("Error loading restaurants data:", error);
      }
    };

    loadData();
  }, [city, searchByCity, fetchRestaurantsWithListings]);

  // Set up filtered restaurants and listings
  useEffect(() => {
    if (restaurants.length > 0) {
      let filtered = [...restaurants];

      // Apply tag filter first
      if (selectedTags.length > 0) {
        const selectedTagIds = selectedTags.map((tag) => tag.id);
        filtered = filtered.filter((restaurant) => {
          return restaurant.tags?.some((tag) =>
            selectedTagIds.includes(tag.id)
          );
        });
      }

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();

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
              return restaurant?.listings?.some(
                (listing) =>
                  listing.influencer.name.toLowerCase().includes(query)
              );
            // case "video":
            //   return restaurant?.listings?.some(
            //     (listing) =>
            //       (listing.video.title.toLowerCase().includes(query) ||
            //         listing.video.description?.toLowerCase().includes(query))
            //   );
            default:
              return (
                restaurant.name.toLowerCase().includes(query) ||
                restaurant.city?.toLowerCase().includes(query) ||
                restaurant.tags?.some((tag) =>
                  tag.name.toLowerCase().includes(query)
                ) ||
                restaurant?.listings?.some(
                  (listing) =>
                    listing.influencer.name.toLowerCase().includes(query)
                )
                //  ||
                // restaurant?.listings?.some(
                //   (listing) =>
                //     listing.video.title.toLowerCase().includes(query) ||
                //     listing.video.description?.toLowerCase().includes(query)
                // )
              );
          }
        });
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
  }, [restaurants, searchQuery, searchType, sortBy, selectedTags]);

  if (loading) {
    return (
      <RestaurantSkeletonLoader />
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
            <div className="relative flex items-center bg-gray-100 rounded-lg p-1">
              <div
                className={`absolute top-1/2 -translate-y-1/2 left-1 h-8 w-[47%] bg-white rounded-md shadow-sm transition-all duration-300 ease-in-out
                  ${viewMode === "map" ? "translate-x-full" : ""}
                `}
              ></div>
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => updateViewMode("grid")}
                className={`relative z-10 h-8 px-3 bg-transparent hover:bg-transparent ${
                  viewMode === "grid"
                    ? "text-gray-900"
                    : "text-gray-700 hover:text-gray-800"
                }`}
              >
                <Grid3X3 className="w-4 h-4 mr-1" />
                List
              </Button>
              <Button
                variant={viewMode === "map" ? "default" : "ghost"}
                size="sm"
                onClick={() => updateViewMode("map")}
                className={`relative z-10 h-8 px-3 bg-transparent hover:bg-transparent ${
                  viewMode === "map"
                    ? "text-gray-900"
                    : "text-gray-700 hover:text-gray-800"
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
          city={city}
          searchQuery={searchQuery}
          setSearchQuery={updateSearchQuery}
          searchType={searchType}
          setSearchType={updateSearchType}
          sortBy={sortBy}
          setSortBy={updateSortBy}
          getSearchPlaceholder={getSearchPlaceholder}
          selectedTags={selectedTags}
          onTagsChange={updateSelectedTags}
        />

        {/* Selected Options Display */}
        {(selectedTags.length > 0 || searchQuery || searchType || sortBy) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {/* Search Query Badge */}
            {searchQuery && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
              >
                <span className="text-xs text-muted-foreground">Search:</span>
                <span>{searchQuery}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-secondary cursor-pointer"
                  onClick={() => updateSearchQuery("")}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}

            {/* Search Type Badge */}
            {searchType && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
              >
                <span className="text-xs text-muted-foreground">
                  Search by:
                </span>
                <span>
                  {searchType === "restaurant"
                    ? "Restaurant Name"
                    : searchType === "influencer"
                    ? "Influencer Name"
                    : searchType === "tags"
                    ? "Tags"
                    : searchType === "city"
                    ? "City"
                    : searchType}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-secondary cursor-pointer"
                  onClick={() => updateSearchType("")}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}

            {/* Sort By Badge */}
            {sortBy && (
              <Badge
                variant="secondary"
                className="flex items-center gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
              >
                <span className="text-xs text-muted-foreground">Sort by:</span>
                <span>
                  {sortBy === "name"
                    ? "Name"
                    : sortBy === "rating"
                    ? "Rating"
                    : sortBy === "city"
                    ? "City"
                    : sortBy}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-secondary cursor-pointer"
                  onClick={() => updateSortBy("")}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            )}

            {/* Selected Tags */}
            {selectedTags.map((tag) => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="flex items-center gap-1 pr-1 cursor-pointer hover:bg-secondary/80"
              >
                <span className="text-xs text-muted-foreground">Tag:</span>
                <span>{tag.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-secondary cursor-pointer"
                  onClick={() => {
                    const newTags = selectedTags.filter((t) => t.id !== tag.id);
                    updateSelectedTags(newTags);
                  }}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}

            {/* Clear All Button */}
            {(selectedTags.length > 0 ||
              searchQuery ||
              searchType ||
              sortBy) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  updateSelectedTags([]);
                  updateSearchQuery("");
                  updateSearchType("");
                  updateSortBy("");
                }}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Clear all
              </Button>
            )}
          </div>
        )}

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
              />
            )}

            {/* Latest Listings Section (only for map view) */}
            {viewMode === "map" && filteredRestaurants.length > 0 && (
              <RestaurantLatestListings
                restaurants={filteredRestaurants.slice(0,3)}
              />
            )}

            {/* Grid View */}
            {viewMode === "grid" && (
              <RestaurantGridView
                filteredRestaurants={filteredRestaurants}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
