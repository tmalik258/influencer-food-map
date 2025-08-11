'use client';

import { useParams } from 'next/navigation';
import { useRestaurant, useRestaurantListings } from '@/lib/hooks';
import { MapPin, Star, ExternalLink, Play, Calendar, Quote } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function RestaurantDetailPage() {
  const params = useParams();
  const restaurantId = params.id as string;
  
  const { restaurant, loading: restaurantLoading, error: restaurantError } = useRestaurant(restaurantId);
  const { listings, loading: listingsLoading } = useRestaurantListings(restaurantId);
  
  const loading = restaurantLoading || listingsLoading;
  const error = restaurantError;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading restaurant details...</p>
        </div>
      </div>
    );
  }

  if (error || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Restaurant not found'}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Go back to search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Restaurant Hero Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="h-64 relative overflow-hidden">
            {restaurant.photo_url ? (
              <>
                <Image
                  fill 
                  src={restaurant.photo_url} 
                  alt={restaurant.name}
                  className="object-cover"
                  quality={90}
                  sizes="(max-width: 768px) 100vw, 1152px"
                  priority={true}
                />
                <div className="absolute inset-0 bg-black/40"></div>
              </>
            ) : (
              <>
                <div className="w-full h-full bg-gradient-to-r from-orange-400 to-red-500"></div>
                <div className="absolute inset-0 bg-black/30"></div>
              </>
            )}
            <div className="absolute bottom-6 left-6 text-white">
              <h1 className="text-4xl font-bold mb-2">{restaurant.name}</h1>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span>{restaurant.city}, {restaurant.country}</span>
                </div>
                {restaurant.google_rating && (
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-yellow-400 fill-current mr-1" />
                    <span className="font-medium">{restaurant.google_rating}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Address</h3>
                <p className="text-gray-600 mb-4">{restaurant.address}</p>
                
                <div className="flex gap-3">
                  {restaurant.google_place_id && (
                    <a
                      href={`https://www.google.com/maps/place/?q=place_id:${restaurant.google_place_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View on Google Maps
                    </a>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Details</h3>
                <div className="space-y-2 text-gray-600">
                  <p><span className="font-medium">Status:</span> {restaurant.business_status || 'Unknown'}</p>
                  {restaurant.latitude && restaurant.longitude && (
                    <p><span className="font-medium">Coordinates:</span> {restaurant.latitude}, {restaurant.longitude}</p>
                  )}
                  <p><span className="font-medium">Featured by:</span> {listings.length} influencer{listings.length !== 1 ? 's' : ''}</p>
                  <p><span className="font-medium">Tags:</span> {restaurant?.tags?.map(tag => tag.name).join(', ') || 'No tags'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Influencer Reviews */}
        {listings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Influencer Reviews</h2>
            <div className="space-y-6">
              {listings.map((listing) => (
                <div key={listing.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-start gap-4">
                    {/* Influencer Avatar */}
                    <div className="flex-shrink-0">
                      {listing.influencer.avatar_url ? (
                        <Image
                          src={listing.influencer.avatar_url}
                          alt={listing.influencer.name}
                          width={60}
                          height={60}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="w-15 h-15 rounded-full bg-blue-500 flex items-center justify-center text-white text-xl font-bold">
                          {listing.influencer.name.charAt(0)}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <Link
                            href={`/influencers/${listing.influencer.id}`}
                            className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                          >
                            {listing.influencer.name}
                          </Link>
                          <p className="text-gray-600 text-sm">{listing.influencer.region}</p>
                        </div>
                        
                        {listing.visit_date && (
                          <div className="flex items-center text-gray-500 text-sm">
                            <Calendar className="w-4 h-4 mr-1" />
                            {new Date(listing.visit_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                      
                      {/* Quote */}
                      {listing.quotes && listing.quotes.length > 0 && (
                        <div className="mb-4">
                          <div className="flex items-start">
                            <Quote className="w-5 h-5 text-gray-400 mr-2 mt-1 flex-shrink-0" />
                            <blockquote className="text-gray-700 italic">
                              &quot;{listing.quotes[0]}&quot;
                            </blockquote>
                          </div>
                        </div>
                      )}
                      
                      {/* Context */}
                      {listing.context && (
                        <div className="mb-4">
                          <p className="text-gray-600">{listing.context}</p>
                        </div>
                      )}
                      
                      {/* Video Link */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <a
                            href={listing.video.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Watch Video
                          </a>
                          
                          <Link
                            href={`/influencers/${listing.influencer.id}`}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View Profile
                          </Link>
                        </div>
                        
                        {listing.confidence_score && (
                          <div className="text-sm text-gray-500">
                            Confidence: {Math.round(listing.confidence_score * 100)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {listings.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 mb-4">No influencer reviews available for this restaurant yet.</p>
            <Link href="/influencers" className="text-blue-600 hover:underline">
              Browse Influencers
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}