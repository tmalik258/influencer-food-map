"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { GridSkeleton } from "@/components/loading-states";
import RetryWrapper from "@/components/retry-wrapper";
import { useAutoRefresh } from "@/lib/hooks";
import { CompactRealTimeIndicator } from "@/components/real-time-indicator";
import { useRestaurants, useListings, usePopularCities } from "@/lib/hooks";
import { Restaurant, Listing } from "@/types";
import Link from "next/link";
import ErrorCard from "@/components/error-card";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredRestaurants, setFeaturedRestaurants] = useState<Restaurant[]>(
    []
  );
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { restaurants, fetchRestaurants } = useRestaurants();
  const { listings, fetchListings } = useListings();
  const { cities: popularCities, loading: citiesLoading, error: citiesError } = usePopularCities();

  useEffect(() => {
    const loadFeaturedData = async () => {
      if (citiesError) {
        setError("Failed to load popular cities");
        setLoading(false);
        return;
      }

      if (popularCities.length === 0) {
        if (!citiesLoading) setLoading(false);
        return;
      } // Wait for cities to load

      setLoading(true);
      setError(null);
      try {
        // Fetch restaurants from the first popular city as featured
        const firstCity = popularCities[0];
        await fetchRestaurants({ city: firstCity, limit: 6 });
        await fetchListings({ limit: 20, approved_status: "Approved" });
      } catch (error) {
        console.error("Error loading featured data:", error);
        setError("Failed to load featured content. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    loadFeaturedData();
  }, [fetchRestaurants, fetchListings, popularCities, citiesLoading, citiesError]);

  useEffect(() => {
    if (restaurants.length > 0 && listings.length > 0) {
      // Get restaurants that have listings (featured ones)
      const restaurantsWithListings = restaurants
        .filter((restaurant) =>
          listings.some((listing) => listing.restaurant.id === restaurant.id)
        )
        .slice(0, 3);

      setFeaturedRestaurants(restaurantsWithListings);
      setFeaturedListings(listings);
    }
  }, [restaurants, listings]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(
        `/restaurants?city=${encodeURIComponent(searchQuery.trim())}`
      );
    }
  };

  const handleCityClick = (city: string) => {
    router.push(`/restaurants?city=${encodeURIComponent(city)}`);
  };

  const handleRefresh = async () => {
    setError(null);
    setLoading(true);
    try {
      if (popularCities.length > 0) {
        const firstCity = popularCities[0];
        await fetchRestaurants({ city: firstCity, limit: 6 });
        await fetchListings({ limit: 20, approved_status: "Approved" });
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
      setError("Failed to refresh content. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 2 minutes for real-time updates
  const autoRefresh = useAutoRefresh({
    interval: 120000, // 2 minutes
    enabled: true,
    onRefresh: handleRefresh,
    pauseOnHidden: true, // Pause when tab is not visible
    pauseOnError: true,
    maxRetries: 3
  });

  return (
    <div className="min-h-screen p-2">
      {/* Hero Section */}
      <div className="relative min-h-[calc(100vh-1rem)] flex items-center justify-center overflow-hidden pt-20 rounded-2xl">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/hero-main.jpg"
            alt="Food background"
            fill
            className="object-cover"
            priority
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Where are you eating next?
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-12">
            See what the experts recommend in your city.
          </p>

          {/* Search Form */}
          <div className="max-w-2xl mx-auto mb-12">
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-4"
            >
              <div className="relative flex-1">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Enter your city or suburb"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-5 text-lg bg-white border-0 rounded-l-lg sm:rounded-r-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="px-8 py-4 text-lg font-semibold bg-orange-600 hover:bg-orange-500 text-white rounded-r-lg sm:rounded-l-none transition-all duration-200 hover:scale-105 cursor-pointer"
                disabled={!searchQuery.trim()}
              >
                Find Restaurants
              </Button>
            </form>
          </div>

          {/* Popular Cities */}
          <div className="mb-16">
            <p className="text-white/80 text-center mb-4">
              Popular destinations:
            </p>
            {popularCities?.length === 0 && !citiesLoading ? (
              <p className="text-white/80 text-center">
                No popular cities found
              </p>
            ) : (
              <div className="flex flex-wrap justify-center gap-3">
                {citiesLoading
                  ? // Loading skeleton for cities
                    Array.from({ length: 6 }).map((_, index) => (
                      <Skeleton
                        key={index}
                        className="h-10 w-24 rounded-full bg-white/10"
                      />
                    ))
                  : popularCities.map((city) => (
                      <Button
                        key={city}
                        variant="outline"
                        onClick={() => handleCityClick(city)}
                        className="px-4 py-2 bg-white/10 backdrop-blur-sm text-white hover:text-white rounded-full hover:bg-white/20 transition-all duration-200 border border-white/20 hover:border-orange-500/50 hover:scale-105 cursor-pointer"
                      >
                        {city}
                      </Button>
                    ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured Restaurants Section */}
      <div className="py-20 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12 relative">
            {/* Real-time indicator */}
            <div className="absolute top-0 right-0">
              <CompactRealTimeIndicator
                isActive={autoRefresh.isActive}
                isPaused={autoRefresh.isPaused}
                errorCount={autoRefresh.errorCount}
                timeUntilNextRefresh={autoRefresh.timeUntilNextRefresh}
                onRefreshNow={autoRefresh.refreshNow}
              />
            </div>
            
            <h2 className="text-4xl font-bold text-gray-900">
              {popularCities.length > 0
                ? popularCities[0]
                : "Featured Restaurants"}
            </h2>
          </div>

          <RetryWrapper onRetry={handleRefresh} maxRetries={3}>
            {error ? (
              <ErrorCard
                title="Unable to Load Featured Restaurants"
                message={error}
                onRefresh={handleRefresh}
                showRefreshButton={true}
              />
            ) : loading ? (
              <GridSkeleton count={3} columns={3} type="restaurant" />
            ) : (
              <div className="grid md:grid-cols-3 gap-8">
                {featuredRestaurants.map((restaurant) => {
                  // Find the listing for this restaurant to get influencer info
                  const restaurantListing = featuredListings.find(
                    (listing) => listing.restaurant.id === restaurant.id
                  );

                  return (
                    <Link
                      key={restaurant.id}
                      href={`/restaurants/${restaurant.id}`}
                    >
                      <Card className="overflow-hidden border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group p-3">
                        <div className="relative h-48 rounded-lg overflow-hidden">
                          {restaurant.photo_url ? (
                            <Image
                              src={restaurant.photo_url}
                              alt={restaurant.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                              <span className="text-white font-bold text-4xl">
                                {restaurant.name.charAt(0)}
                              </span>
                            </div>
                          )}
                          {restaurantListing && (
                            <div className="absolute top-4 left-4">
                              <Badge className="bg-orange-500 text-white px-3 py-1">
                                {restaurantListing.influencer.name}
                              </Badge>
                            </div>
                          )}
                          {restaurant.google_rating && (
                            <div className="absolute top-4 right-4">
                              <Badge className="bg-black/70 text-white px-2 py-1">
                                ⭐ {restaurant.google_rating}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-0">
                          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                            {restaurant.name}
                          </h3>
                          <p className="text-gray-600 mb-1">
                            {restaurant?.city}
                          </p>
                          <p className="text-gray-600 mb-1">
                            {restaurant.tags &&
                              restaurant.tags.length > 0 &&
                              restaurant.tags.slice(0, 4).map((tag) => (
                                <Badge
                                  key={tag.id}
                                  className="mr-2 bg-orange-600/25 text-orange-600"
                                >
                                  {tag.name.charAt(0).toUpperCase() +
                                    tag.name.slice(1)}
                                </Badge>
                              ))}
                          </p>
                          <p className="text-sm text-gray-500">
                            {restaurant.address}
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </RetryWrapper>
        </div>
      </div>
    </div>
  );
}
