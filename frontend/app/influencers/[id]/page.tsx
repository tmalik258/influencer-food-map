'use client';

import { useParams } from 'next/navigation';
import { useInfluencer, useInfluencerListings } from '@/lib/hooks';
import { MapPin, ExternalLink, Play, Calendar, Quote, Star, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function InfluencerDetailPage() {
  const params = useParams();
  const influencerId = params.id as string;
  
  const { influencer, loading: influencerLoading, error: influencerError } = useInfluencer(influencerId);
  const { listings, loading: listingsLoading } = useInfluencerListings(influencerId);
  
  const loading = influencerLoading || listingsLoading;
  const error = influencerError;

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Back Button Skeleton */}
          <div className="mb-6">
            <Skeleton className="h-9 w-20" />
          </div>

          {/* Profile Header Skeleton */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg px-8 py-12 mb-8">
            <div className="flex items-center gap-6">
              <Skeleton className="w-20 h-20 rounded-full bg-white/20" />
              <div className="flex-1">
                <Skeleton className="h-8 w-48 mb-2 bg-white/20" />
                <Skeleton className="h-4 w-32 mb-4 bg-white/20" />
                <div className="flex items-center gap-6">
                  <div>
                    <Skeleton className="h-6 w-12 mb-1 bg-white/20" />
                    <Skeleton className="h-3 w-20 bg-white/20" />
                  </div>
                  <div>
                    <Skeleton className="h-6 w-12 mb-1 bg-white/20" />
                    <Skeleton className="h-3 w-16 bg-white/20" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-16 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-6 w-12 mb-3" />
                <Skeleton className="h-9 w-full" />
              </CardContent>
            </Card>
          </div>

          {/* Reviews Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-6 w-40 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <Skeleton className="h-16 w-full mb-4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-9 w-24" />
                      <Skeleton className="h-9 w-32" />
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

  if (error || !influencer) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-600 mb-4">{error || 'Influencer not found'}</p>
            <Button asChild variant="outline">
              <Link href="/influencers">
                Go back to influencers
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const uniqueRestaurants = new Set(listings.map(listing => listing.restaurant.id)).size;
  const totalVideos = listings.length;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Back Button */}
         <div className="mb-6">
           <Button asChild variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
             <Link href="/">
               <ArrowLeft className="w-4 h-4 mr-2" />
               Back
             </Link>
           </Button>
         </div>

        {/* Profile Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg px-8 py-12 mb-8">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold border-3 border-white/30">
              {influencer.avatar_url ? (
                <Image
                  src={influencer.avatar_url}
                  alt={influencer.name}
                  width={80}
                  height={80}
                  className="rounded-full object-cover"
                />
              ) : (
                influencer.name.charAt(0)
              )}
            </div>
            
            {/* Profile Info */}
            <div className="flex-1 text-white">
              <h1 className="text-3xl font-bold mb-2">{influencer.name}</h1>
              {influencer.region && (
                <div className="flex items-center gap-1 text-white/90 mb-4">
                  <MapPin className="w-4 h-4" />
                  <span>{influencer.region}</span>
                </div>
              )}
              
              {/* Stats */}
              <div className="flex items-center gap-6">
                <div>
                  <div className="text-xl font-bold">{uniqueRestaurants}</div>
                  <div className="text-sm text-white/80">Restaurants</div>
                </div>
                <div>
                  <div className="text-xl font-bold">{totalVideos}</div>
                  <div className="text-sm text-white/80">Reviews</div>
                </div>
              </div>
            </div>
          </div>
        </div>
          
        
        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* About */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
              <p className="text-gray-600 text-sm leading-relaxed">
                {influencer.bio || 'No bio available.'}
              </p>
            </CardContent>
          </Card>
          
          {/* Links */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Links</h2>
              <div className="space-y-2">
                {influencer.youtube_channel_id && (
                  <Button asChild variant="outline" size="sm" className="w-full justify-start">
                    <a 
                      href={`https://www.youtube.com/channel/${influencer.youtube_channel_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      YouTube Channel
                    </a>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Restaurant Reviews */}
        {listings.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-5 h-5 text-gray-600" />
              <h2 className="text-xl font-semibold text-gray-900">Restaurant Reviews</h2>
              <Badge variant="secondary">{listings.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing) => (
                <Card key={listing.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <Link
                          href={`/restaurants/${listing.restaurant.id}`}
                          className="text-xl font-bold text-gray-900 hover:text-blue-600 mb-2 block"
                        >
                          {listing.restaurant.name}
                        </Link>
                        
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <Badge variant="outline" className="text-xs">
                            <MapPin className="w-3 h-3 mr-1" />
                            {listing.restaurant.city}
                          </Badge>
                          
                          {listing.restaurant.google_rating && (
                            <Badge variant="outline" className="text-xs">
                              <Star className="w-3 h-3 text-yellow-400 fill-current mr-1" />
                              {listing.restaurant.google_rating}
                            </Badge>
                          )}
                          
                          {listing.visit_date && (
                            <Badge variant="outline" className="text-xs">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(listing.visit_date).toLocaleDateString()}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-4">
                          {listing.restaurant.address}
                        </p>
                      </div>
                    </div>
                    
                    {/* Quote */}
                    {listing.quotes && listing.quotes.length > 0 && (
                      <div className="mb-4 bg-orange-50 border-l-4 border-orange-200 p-4 rounded-lg">
                        <div className="flex items-start">
                          <Quote className="w-4 h-4 text-orange-500 mr-2 mt-1 flex-shrink-0" />
                          <blockquote className="text-gray-700 italic text-sm">
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
                    <Card className="mb-4">
                      <CardContent className="p-3">
                        <h4 className="font-semibold text-gray-900 mb-2 text-sm">{listing.video.title}</h4>
                        {listing.video.description && (
                          <p className="text-gray-600 text-xs mb-2 line-clamp-2">
                            {listing.video.description}
                          </p>
                        )}
                        {listing.video.published_at && (
                          <Badge variant="secondary" className="text-xs">
                            {new Date(listing.video.published_at).toLocaleDateString()}
                          </Badge>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        <Button asChild size="sm" className="bg-red-600 hover:bg-red-700">
                          <a
                            href={listing.video.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Watch Video
                          </a>
                        </Button>
                        
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/restaurants/${listing.restaurant.id}`}>
                            View Restaurant
                          </Link>
                        </Button>
                      </div>
                      
                      {listing.confidence_score && (
                        <Badge variant="secondary" className="self-start">
                          Confidence: {Math.round(listing.confidence_score * 100)}%
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
        
        {listings.length === 0 && (
          <Card className="text-center">
            <CardContent className="p-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">No restaurant reviews available from this influencer yet.</p>
              <Button asChild variant="outline">
                <Link href="/restaurants">
                  Browse Restaurants
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}