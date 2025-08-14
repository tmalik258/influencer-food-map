'use client';

import { useParams } from 'next/navigation';
import { useRestaurant, useRestaurantListings } from '@/lib/hooks';
import { MapPin, Star, ExternalLink, Play, Calendar, Quote, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export default function RestaurantDetailPage() {
  const params = useParams();
  const restaurantId = params.id as string;
  
  const { restaurant, loading: restaurantLoading, error: restaurantError } = useRestaurant(restaurantId);
  const { listings, loading: listingsLoading } = useRestaurantListings(restaurantId);
  
  const loading = restaurantLoading || listingsLoading;
  const error = restaurantError;

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Back Button Skeleton */}
          <div className="mb-6">
            <Skeleton className="h-10 w-40" />
          </div>
          
          {/* Hero Section Skeleton */}
          <Skeleton className="h-64 md:h-80 w-full rounded-lg mb-6" />
          
          {/* Restaurant Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-8 w-64 mb-2" />
            <div className="flex items-center gap-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          
          {/* Info Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-20 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Reviews Section Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-7 w-48 mb-6" />
            <div className="space-y-6">
              {Array.from({ length: 2 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Skeleton className="w-12 h-12 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-48 mb-4" />
                        <Skeleton className="h-16 w-full mb-4" />
                        <Skeleton className="h-10 w-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">{error || 'Restaurant not found'}</p>
            <Button asChild variant="outline">
              <Link href="/restaurants">
                Back to Restaurants
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Back Button */}
         <div className="mb-6">
           <Button variant="ghost" asChild>
             <Link href="/restaurants" className="flex items-center gap-2">
               <ArrowLeft className="w-4 h-4" />
               Back to Restaurants
             </Link>
           </Button>
         </div>

        {/* Hero Section */}
        <div className="relative h-64 md:h-80 rounded-lg overflow-hidden mb-6">
          {restaurant.photo_url ? (
            <Image 
              fill
              src={restaurant.photo_url} 
              alt={restaurant.name}
              className="object-cover"
              quality={85}
              sizes="(max-width: 768px) 100vw, 800px"
              priority
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-orange-400 to-red-500"></div>
          )}
        </div>

        {/* Restaurant Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{restaurant.name}</h1>
          <div className="flex items-center gap-4 text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span>{restaurant.city}</span>
            </div>
            {restaurant.google_rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{restaurant.google_rating.toFixed(1)}</span>
                <span className="text-sm">Google Rating</span>
              </div>
            )}
          </div>
        </div>

        {/* Restaurant Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Address */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Address
              </h3>
              <div className="text-sm text-gray-600 mb-3">
                <p>{restaurant.address}</p>
                <p>{restaurant.city}</p>
              </div>
              {restaurant.google_place_id && (
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a 
                    href={`https://www.google.com/maps/place/?q=place_id:${restaurant.google_place_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Maps
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Status</h3>
              <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100">
                {restaurant.business_status || 'Open'}
              </Badge>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Reviews
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="flex items-center gap-2">
                  <Badge variant="outline">{listings.length}</Badge>
                  influencer review{listings.length !== 1 ? 's' : ''}
                </p>
                {restaurant.google_rating && (
                  <p className="flex items-center gap-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">{restaurant.google_rating.toFixed(1)}</span>
                    <span className="text-xs text-gray-500">Google</span>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Influencer Reviews */}
        {listings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Influencer Reviews
              <Badge variant="secondary" className="ml-2">{listings.length}</Badge>
            </h2>
            <div className="space-y-6">
              {listings.map((listing) => (
                <Card key={listing.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Influencer Avatar */}
                      <div className="flex-shrink-0">
                        {listing.influencer.avatar_url ? (
                          <Image
                            src={listing.influencer.avatar_url}
                            alt={listing.influencer.name}
                            width={48}
                            height={48}
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-white font-bold text-lg">
                            {listing.influencer.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <Link
                              href={`/influencers/${listing.influencer.id}`}
                              className="text-lg font-semibold text-gray-900 hover:text-orange-600 transition-colors"
                            >
                              {listing.influencer.name}
                            </Link>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {listing.influencer.region}
                              </Badge>
                              {listing.visit_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{new Date(listing.visit_date).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          {listing.confidence_score && (
                            <Badge variant="secondary" className="text-xs">
                              {Math.round(listing.confidence_score * 100)}% confidence
                            </Badge>
                          )}
                        </div>
                        
                        {/* Quote */}
                        {listing.quotes && listing.quotes.length > 0 && (
                          <div className="mb-4 p-3 bg-gray-50 rounded-lg border-l-4 border-orange-500">
                            <div className="flex items-start gap-2">
                              <Quote className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              <blockquote className="text-gray-700 italic text-sm">
                                &quot;{listing.quotes[0]}&quot;
                              </blockquote>
                            </div>
                          </div>
                        )}
                        
                        {/* Context */}
                        {listing.context && (
                          <div className="mb-4">
                            <p className="text-gray-600 text-sm">{listing.context}</p>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-3">
                          <Button asChild size="sm" className="bg-red-600 hover:bg-red-700">
                            <a
                              href={listing.video.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2"
                            >
                              <Play className="w-4 h-4" />
                              Watch Video
                            </a>
                          </Button>
                          
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/influencers/${listing.influencer.id}`}
                              className="flex items-center gap-2"
                            >
                              View Profile
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {listings.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No influencer reviews available for this restaurant yet.</p>
              <Button variant="outline" asChild>
                <Link href="/influencers">
                  Browse Influencers
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}