'use client';

import { useEffect, Suspense, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useRestaurants, useListings } from '@/lib/hooks';
import { MapPin, Star, ExternalLink, ArrowLeft, Grid3X3, Map } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Restaurant } from '@/types';
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
    if (restaurants.length === 0) {
      fetchRestaurants();
    }
  }, [fetchRestaurants, restaurants.length]);

  useEffect(() => {
    if (city) {
      searchByCity(city);
    }
  }, [city, searchByCity]);

  useEffect(() => {
    fetchListings({
      limit: 20
    });
  }, [fetchListings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mb-4"></div>
            <p className="text-slate-600">Loading restaurants...</p>
          </CardContent>
        </Card>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Search Results Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button asChild variant="outline" size="sm">
                <Link href="/">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Search
                </Link>
              </Button>
              {city && (
                <Badge variant="secondary" className="text-sm">
                  📍 {city}
                </Badge>
              )}
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => updateViewMode('grid')}
                className="h-8"
              >
                <Grid3X3 className="w-4 h-4 mr-2" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => updateViewMode('map')}
                className="h-8"
              >
                <Map className="w-4 h-4 mr-2" />
                Map
              </Button>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {city ? `Restaurants in ${city}` : 'All Restaurants'}
          </h1>
          <p className="text-slate-600">
            {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {restaurants.length === 0 ? (
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
                  restaurants={restaurants}
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
            
            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {restaurants.map((restaurant) => {
                  // Find listings for this restaurant
                  const restaurantListings = listings.filter(
                    listing => listing.restaurant.id === restaurant.id
                  );
                  
                  return (
                    <Card key={restaurant.id} className="restaurant-card overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full flex flex-col p-4">
                      {/* Restaurant Image */}
                      <div className="h-48 relative overflow-hidden rounded-lg">
                        {restaurant.photo_url ? (
                          <>
                            <Image 
                              fill
                              src={restaurant.photo_url} 
                              alt={restaurant.name}
                              className="object-cover"
                              quality={85}
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              priority={false}
                            />
                            <div className="absolute inset-0 bg-black/30"></div>
                          </>
                        ) : (
                          <>
                            <div className="w-full h-full bg-gradient-to-r from-orange-400 to-red-500"></div>
                            <div className="absolute inset-0 bg-black/20"></div>
                          </>
                        )}
                        <div className="absolute bottom-4 left-4 text-white z-10">
                          <h3 className="text-xl font-bold">{restaurant.name}</h3>
                        </div>
                      </div>
                      
                      <CardContent className="p-4 py-3 flex-1 flex flex-col">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <div className="flex items-center text-slate-600 mb-2">
                              <MapPin className="w-4 h-4 mr-1" />
                              <span className="text-sm">{restaurant.city}</span>
                            </div>
                            
                            {restaurant.google_rating && (
                              <div className="flex items-center mb-2">
                                <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                                <Badge variant="secondary" className="text-xs">
                                  {restaurant.google_rating}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <p className="text-slate-600 text-sm mb-2 line-clamp-2">
                            {restaurant.address}
                          </p>
                          
                          {/* Influencer Reviews */}
                          {restaurantListings.length > 0 && (
                            <div className="mb-2">
                              <Badge variant="outline" className="mb-2">
                                👥 Featured by {restaurantListings.length} influencer{restaurantListings.length !== 1 ? 's' : ''}
                              </Badge>
                              <div className="flex -space-x-2">
                                {restaurantListings.slice(0, 3).map((listing) => (
                                  <div key={listing.id} className="w-8 h-8 rounded-full bg-slate-600 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                                    {listing.influencer.name.charAt(0)}
                                  </div>
                                ))}
                                {restaurantListings.length > 3 && (
                                  <div className="w-8 h-8 rounded-full bg-slate-400 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
                                    +{restaurantListings.length - 3}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2 mt-auto">
                          <Button asChild className="flex-1">
                            <Link href={`/restaurants/${restaurant.id}`}>
                              View Details
                            </Link>
                          </Button>
                          {restaurant.google_place_id && (
                            <Button asChild variant="outline" size="icon">
                              <a
                                href={`https://www.google.com/maps/place/?q=place_id:${restaurant.google_place_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                        </div>
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