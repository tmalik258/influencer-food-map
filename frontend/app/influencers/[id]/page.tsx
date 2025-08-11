'use client';

import { useParams } from 'next/navigation';
import { useInfluencer, useInfluencerListings } from '@/lib/hooks';
import { MapPin, ExternalLink, Play, Calendar, Quote, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function InfluencerDetailPage() {
  const params = useParams();
  const influencerId = params.id as string;
  
  const { influencer, loading: influencerLoading, error: influencerError } = useInfluencer(influencerId);
  const { listings, loading: listingsLoading } = useInfluencerListings(influencerId);
  
  const loading = influencerLoading || listingsLoading;
  const error = influencerError;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading influencer profile...</p>
        </div>
      </div>
    );
  }

  if (error || !influencer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Influencer not found'}</p>
          <Link href="/influencers" className="text-blue-600 hover:underline">
            Go back to influencers
          </Link>
        </div>
      </div>
    );
  }

  const uniqueRestaurants = new Set(listings.map(listing => listing.restaurant.id)).size;
  const totalVideos = listings.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Influencer Profile Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8">
            <div className="flex items-center gap-6">
              {influencer.avatar_url ? (
                <Image
                  src={influencer.avatar_url}
                  alt={influencer.name}
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-white"
                />
              ) : (
                <div className="w-30 h-30 rounded-full bg-white/20 border-4 border-white flex items-center justify-center text-white text-4xl font-bold">
                  {influencer.name.charAt(0)}
                </div>
              )}
              
              <div className="text-white">
                <h1 className="text-4xl font-bold mb-2">{influencer.name}</h1>
                {influencer.region && (
                  <div className="flex items-center mb-3">
                    <MapPin className="w-5 h-5 mr-2" />
                    <span className="text-lg">{influencer.region}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{uniqueRestaurants}</div>
                    <div className="text-sm opacity-90">Restaurants</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{totalVideos}</div>
                    <div className="text-sm opacity-90">Reviews</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">About</h3>
                <p className="text-gray-600 mb-4">
                  {influencer.bio || 'No bio available.'}
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3">Links</h3>
                <div className="space-y-2">
                  {influencer.youtube_channel_url && (
                    <a
                      href={influencer.youtube_channel_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors w-fit"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      YouTube Channel
                    </a>
                  )}
                  {influencer.youtube_channel_id && (
                    <p className="text-sm text-gray-600">
                      Channel ID: {influencer.youtube_channel_id}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Restaurant Reviews */}
        {listings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Restaurant Reviews</h2>
            <div className="space-y-6">
              {listings.map((listing) => (
                <div key={listing.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <Link
                          href={`/restaurants/${listing.restaurant.id}`}
                          className="text-xl font-bold text-gray-900 hover:text-blue-600 mb-2 block"
                        >
                          {listing.restaurant.name}
                        </Link>
                        
                        <div className="flex items-center gap-4 text-gray-600 mb-3">
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1" />
                            <span className="text-sm">{listing.restaurant.city}</span>
                          </div>
                          
                          {listing.restaurant.google_rating && (
                            <div className="flex items-center">
                              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                              <span className="text-sm">{listing.restaurant.google_rating}</span>
                            </div>
                          )}
                          
                          {listing.visit_date && (
                            <div className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              <span className="text-sm">
                                {new Date(listing.visit_date).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4">
                          {listing.restaurant.address}
                        </p>
                      </div>
                    </div>
                    
                    {/* Quote */}
                    {listing.quotes && listing.quotes.length > 0 && (
                      <div className="mb-4 bg-gray-50 p-4 rounded-lg">
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
                    
                    {/* Video Information */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{listing.video.title}</h4>
                      {listing.video.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {listing.video.description}
                        </p>
                      )}
                      {listing.video.published_at && (
                        <p className="text-gray-500 text-xs mb-3">
                          Published: {new Date(listing.video.published_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
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
                          href={`/restaurants/${listing.restaurant.id}`}
                          className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          View Restaurant
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
              ))}
            </div>
          </div>
        )}
        
        {listings.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 mb-4">No restaurant reviews available from this influencer yet.</p>
            <Link href="/restaurants" className="text-blue-600 hover:underline">
              Browse Restaurants
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}