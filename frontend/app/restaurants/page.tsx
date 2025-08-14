'use client';

import { useEffect, Suspense, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useRestaurants, useListings } from '@/lib/hooks';
import { MapPin, Star, ExternalLink, ArrowLeft, Grid3X3, Map, Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import dynamicImport from 'next/dynamic';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';

const RestaurantMap = dynamicImport(() => import('@/components/RestaurantMap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-100 rounded-xl">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
    </div>
  ),
});
import { Restaurant, Listing } from '@/types';
import Image from 'next/image';

function RestaurantsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const city = searchParams.get('city') || '';
  const viewParam = searchParams.get('view');
  
  // Default to grid if no parameter, otherwise use the specified view
  const initialViewMode = viewParam === 'map' ? 'map' : 'grid';
  const [viewMode, setViewMode] = useState<'grid' | 'map'>(initialViewMode);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [restaurantListings, setRestaurantListings] = useState<Listing[]>([]);
  
  // Function to update URL with view parameter
  const updateViewMode = (newViewMode: 'grid' | 'map') => {
    const params = new URLSearchParams(searchParams.toString());
    if (newViewMode === 'grid') {
      params.delete('view'); // Remove view param for grid (default)
    } else {
      params.set('view', newViewMode);
    }
    const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.push(newUrl);
    setViewMode(newViewMode);
  };
  
  const { restaurants, loading: restaurantsLoading, error: restaurantsError, searchByCity, fetchRestaurants } = useRestaurants();
  const { listings, loading: listingsLoading, fetchListings } = useListings();
  
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
        console.error('Error loading restaurants data:', error);
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
        filtered = filtered.filter(restaurant => 
          restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          restaurant.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          restaurant.city?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        switch (sortBy) {
          case 'name':
            return a.name.localeCompare(b.name);
          case 'rating':
            return (b.google_rating || 0) - (a.google_rating || 0);
          case 'city':
            return (a.city || '').localeCompare(b.city || '');
          default:
            return 0;
        }
      });
      
      setFilteredRestaurants(filtered);
    }
  }, [restaurants, searchQuery, sortBy]);

  // Set up restaurant listings
  useEffect(() => {
    if (listings.length > 0) {
      setRestaurantListings(listings);
    }
  }, [listings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
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
          </div>
          
          {/* Restaurant Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group p-4">
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go back to search
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative h-[400px] flex items-center justify-center overflow-hidden">
        <Image
          src="/api/placeholder/1920/1080"
          alt="Cityscape background"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10 text-center text-white px-4">
          <p className="text-lg font-semibold mb-2">{city ? city.toUpperCase() + "'S" : "FOODTUBER'S"}</p>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-4">
            Critics&apos; Picks
          </h1>
          <p className="text-xl md:text-2xl text-white/90">
            HANDPICKED BY CELEBRITY CHEFS & TOP FOOD CREATORS.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Link>
              </Button>
              {city && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="font-medium">{city}</span>
                </div>
              )}
            </div>
            
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => updateViewMode('grid')}
                className={`h-8 px-3 ${viewMode === 'grid' ? 'bg-white shadow-sm text-gray-900 hover:text-white' : 'hover:bg-gray-200 text-gray-700'}`}
              >
                <Grid3X3 className="w-4 h-4 mr-1" />
                List
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => updateViewMode('map')}
                className={`h-8 px-3 ${viewMode === 'map' ? 'bg-white shadow-sm text-gray-900 hover:text-white' : 'hover:bg-gray-200 text-gray-700'}`}
              >
                <Map className="w-4 h-4 mr-1" />
                Map
              </Button>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {city ? `Restaurants in ${city}` : 'All Restaurants'}
          </h1>
          <p className="text-gray-600 text-sm">
            {filteredRestaurants.length} result{filteredRestaurants.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Search and Filter Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="city">City</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredRestaurants.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="py-8">
              <p className="text-slate-600 mb-4">No restaurants found in {city}.</p>
              <Button asChild variant="outline">
                <Link href="/">
                  Try a different city
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Map View */}
            {viewMode === 'map' && (
              <div className="mb-8">
                <RestaurantMap
                  restaurants={filteredRestaurants}
                  selectedRestaurant={selectedRestaurant}
                  onRestaurantSelect={setSelectedRestaurant}
                  className="h-[600px] w-full"
                />
                
                {/* Selected Restaurant Details */}
                {selectedRestaurant && (
                  <Card className="mt-6 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden relative">
                          {selectedRestaurant.photo_url ? (
                            <Image
                              fill
                              src={selectedRestaurant.photo_url} 
                              alt={selectedRestaurant.name}
                              className="object-cover"
                              quality={90}
                              sizes="64px"
                              priority={false}
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                              <span className="text-white font-bold text-xl">
                                {selectedRestaurant.name.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-slate-900 mb-2">{selectedRestaurant.name}</h3>
                          <div className="flex items-center text-slate-600 mb-2">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>{selectedRestaurant.address}</span>
                          </div>
                          {selectedRestaurant.google_rating && (
                            <div className="flex items-center mb-4">
                              <Star className="w-4 h-4 text-yellow-500 fill-current mr-2" />
                              <Badge variant="secondary">
                                {selectedRestaurant.google_rating}
                              </Badge>
                            </div>
                          )}
                          <div className="flex gap-3">
                            <Button asChild>
                              <Link href={`/restaurants/${selectedRestaurant.id}`}>
                                View Full Details
                              </Link>
                            </Button>
                            {selectedRestaurant.google_place_id && (
                              <Button asChild variant="outline">
                                <a
                                  href={`https://www.google.com/maps/place/?q=place_id:${selectedRestaurant.google_place_id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="w-4 h-4 mr-2" />
                                  Open in Google Maps
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            
            {/* Latest Listings Section (only for map view) */}
            {viewMode === 'map' && restaurantListings.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Latest Listings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {restaurantListings.slice(0, 3).map((listing) => (
                    <Card key={listing.id} className="overflow-hidden border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group p-2">
                      <div className="relative h-48 rounded-lg overflow-hidden">
                        {listing.restaurant?.photo_url ? (
                          <Image
                            src={listing.restaurant.photo_url}
                            alt={listing.restaurant.name}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                            <span className="text-white font-bold text-4xl">
                              {listing.restaurant?.name.charAt(0)}
                            </span>
                          </div>
                        )}
                        {listing.influencer?.name && (
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1">
                              {listing.influencer.name}
                            </Badge>
                          </div>
                        )}
                        {listing.restaurant?.google_rating && (
                          <div className="absolute top-4 right-4">
                            <Badge className="bg-black/70 text-white px-2 py-1">
                              ⭐ {listing.restaurant.google_rating}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <CardContent className="p-6 flex flex-col flex-grow">
                        <div className="flex-grow">
                          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                            {listing.restaurant?.name}
                          </h3>
                          <p className="text-gray-600 mb-1">
                            {listing.restaurant?.city && `${listing.restaurant.city} • `}
                            {listing.restaurant?.tags &&
                              listing.restaurant.tags.length > 0 &&
                              listing.restaurant.tags[0].name}
                          </p>
                          <p className="text-sm text-gray-500 mb-4">
                            {listing.restaurant?.address}
                          </p>
                        </div>
                        <Button asChild className="w-full mt-auto">
                          <Link href={`/restaurants/${listing.restaurant?.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
            
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRestaurants.map((restaurant) => {
                  // Find listings for this restaurant
                  const currentRestaurantListings = restaurantListings.filter(
                    listing => listing.restaurant?.id === restaurant.id
                  );
                  
                  return (
                    <Card key={restaurant.id} className="overflow-hidden border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group p-2">
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
                        {currentRestaurantListings.length > 0 && (
                          <div className="absolute top-4 left-4">
                            <Badge className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1">
                              {currentRestaurantListings[0].influencer?.name}
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
                      <CardContent className="p-6 flex flex-col flex-grow">
                        <div className="flex-grow">
                          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                            {restaurant.name}
                          </h3>
                          <p className="text-gray-600 mb-1">
                            {restaurant.city && `${restaurant.city} • `}
                            {restaurant.tags &&
                              restaurant.tags.length > 0 &&
                              restaurant.tags[0].name}
                          </p>
                          <p className="text-sm text-gray-500 mb-4">
                            {restaurant.address}
                          </p>
                        </div>
                        <Button asChild className="w-full mt-auto">
                          <Link href={`/restaurants/${restaurant.id}`}>
                            View Details
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function RestaurantsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
      </div>
    }>
      <RestaurantsContent />
    </Suspense>
  );
}