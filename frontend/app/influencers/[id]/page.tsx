"use client";

import { useParams } from "next/navigation";
import { useInfluencer, useInfluencerListings, useInfluencerVideos } from "@/lib/hooks";
import {
  MapPin,
  ExternalLink,
  Play,
  Calendar,
  Quote,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumberAbbreviated } from "@/lib/utils/number-formatter";
import { Skeleton } from "@/components/ui/skeleton";
import ErrorCard from "@/components/error-card";
import { VideoSlider } from '@/components/video-slider';
import RestaurantMap from "@/components/dynamic-restaurant-map";

export default function InfluencerDetailPage() {
  const params = useParams();
  const influencerId = params.id as string;

  const {
    influencer,
    loading: influencerLoading,
    error: influencerError,
    refetch: refetchInfluencer,
  } = useInfluencer(influencerId);
  const {
    listings,
    loading: listingsLoading,
    error: listingsError,
    refetch: refetchListings,
  } = useInfluencerListings(influencerId);
  const {
    videos,
    loading: videosLoading,
    error: videosError,
    refetch: refetchVideos,
  } = useInfluencerVideos(influencerId, 10);

  const handleRefresh = () => {
    refetchInfluencer?.();
    refetchListings?.();
    refetchVideos?.();
  };

  const loading = influencerLoading || listingsLoading || videosLoading;
  const error = influencerError || listingsError || videosError;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-2">
        {/* Hero Section Skeleton */}
        <div className="relative h-[70vh] w-full overflow-hidden rounded-lg">
          <Skeleton className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <Skeleton className="h-12 md:h-16 w-80 mb-4 bg-white/20" />
            <Skeleton className="h-6 w-64 mb-2 bg-white/20" />
          </div>
        </div>

        {/* Overlapping Cards Skeleton */}
        <div className="relative z-20 -mt-20 mb-8 max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 text-center">
                <Skeleton className="h-8 w-16 mx-auto mb-2" />
                <Skeleton className="h-4 w-24 mx-auto" />
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 pt-8">
          {/* Profile Details Skeleton */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <Skeleton className="h-8 w-32 mb-6" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-6" />
            <div className="border-t pt-6">
              <Skeleton className="h-6 w-16 mb-4" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>

          {/* Content Cards Skeleton */}
          <div className="grid grid-cols-1 gap-6 mb-12">
            {/* Popular Videos Card Skeleton */}
            <Card className="bg-white shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="h-48 w-full rounded-lg" />
              </CardContent>
            </Card>

            {/* Signature Picks Card Skeleton */}
            <Card className="bg-white shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Trending Quote Card Skeleton */}
            <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-xl border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-6 w-6 bg-white/20" />
                  <Skeleton className="h-6 w-40 bg-white/20" />
                </div>
                <Skeleton className="h-6 w-64 mb-3 bg-white/20" />
                <Skeleton className="h-4 w-32 bg-white/20" />
              </CardContent>
            </Card>
          </div>

          {/* Reviews Skeleton */}
          <div className="mb-8">
            {/* Section Header Skeleton */}
            <div className="flex items-center gap-3 mb-8">
              <Skeleton className="h-6 w-6 rounded" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-6 w-8 rounded-full" />
            </div>

            {/* Map Skeleton */}
            <div className="mb-8">
              <Skeleton className="h-80 w-full rounded-lg" />
            </div>

            {/* Restaurant Review Cards Skeleton */}
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  {/* Restaurant Image Skeleton */}
                  <div className="h-64 relative p-2">
                    <Skeleton className="w-full h-full rounded-md" />
                    {/* Rating Badge Skeleton */}
                    <div className="absolute top-3 right-3">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                        <Skeleton className="w-3 h-3 rounded-full" />
                        <Skeleton className="h-3 w-6" />
                      </div>
                    </div>
                  </div>

                  {/* Content Skeleton */}
                  <div className="flex-1 p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Restaurant Info Skeleton */}
                      <div className="flex-1">
                        {/* Restaurant Name */}
                        <Skeleton className="h-8 w-3/4 mb-3" />

                        {/* Badges (Location & Date) */}
                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <Skeleton className="h-6 w-20 rounded-full" />
                          <Skeleton className="h-6 w-24 rounded-full" />
                        </div>

                        {/* Address */}
                        <Skeleton className="h-4 w-full mb-4" />

                        {/* Review Components Skeleton */}
                        <div className="space-y-4 mb-6">
                          {/* Overall Rating Section */}
                          <div className="bg-gray-50 rounded-lg p-4">
                            <Skeleton className="h-5 w-24 mb-2" />
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Skeleton key={star} className="w-4 h-4 rounded-full" />
                                ))}
                              </div>
                              <Skeleton className="h-4 w-8" />
                            </div>
                            <Skeleton className="h-3 w-32" />
                          </div>

                          {/* Food Quality Assessment */}
                          <div className="bg-blue-50 rounded-lg p-4">
                            <Skeleton className="h-5 w-28 mb-2" />
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Skeleton key={star} className="w-4 h-4 rounded-full" />
                                ))}
                              </div>
                              <Skeleton className="h-4 w-8" />
                            </div>
                            <Skeleton className="h-4 w-full mb-1" />
                            <Skeleton className="h-4 w-2/3" />
                          </div>

                          {/* Service Evaluation */}
                          <div className="bg-green-50 rounded-lg p-4">
                            <Skeleton className="h-5 w-24 mb-2" />
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Skeleton key={star} className="w-4 h-4 rounded-full" />
                                ))}
                              </div>
                              <Skeleton className="h-4 w-8" />
                            </div>
                            <Skeleton className="h-4 w-full mb-1" />
                            <Skeleton className="h-4 w-3/4" />
                          </div>

                          {/* Ambiance Description */}
                           <div className="bg-purple-50 rounded-lg p-4">
                             <Skeleton className="h-5 w-20 mb-2" />
                             <div className="flex items-center gap-2 mb-2">
                               <div className="flex gap-1">
                                 {[1, 2, 3, 4, 5].map((star) => (
                                   <Skeleton key={star} className="w-4 h-4 rounded-full" />
                                 ))}
                               </div>
                               <Skeleton className="h-4 w-8" />
                             </div>
                             <Skeleton className="h-4 w-full mb-1" />
                             <Skeleton className="h-4 w-4/5" />
                           </div>
                         </div>

                        {/* Detailed Feedback Quotes */}
                        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                          {[1, 2].map((quote) => (
                            <div key={quote} className="bg-orange-50 border-l-4 border-orange-200 p-4 rounded-lg">
                              <div className="flex items-start">
                                <Skeleton className="w-4 h-4 mr-2 mt-1 flex-shrink-0" />
                                <div className="flex-1">
                                  <Skeleton className="h-4 w-full mb-1" />
                                  <Skeleton className="h-4 w-3/4" />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Overall Experience Summary */}
                        <div className="bg-yellow-50 rounded-lg p-4 mb-4">
                          <Skeleton className="h-5 w-40 mb-2" />
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-4 w-2/3" />
                        </div>
                      </div>

                      {/* Video Section Skeleton */}
                      <div className="bg-gray-100 rounded-lg p-4 lg:w-80">
                        <Skeleton className="h-5 w-3/4 mb-3" />
                        
                        {/* Video Iframe Skeleton */}
                        <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-3">
                          <Skeleton className="w-full h-full" />
                        </div>

                        {/* Video Description */}
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-4 w-2/3 mb-3" />

                        {/* Video Footer */}
                        <div className="flex items-center justify-between">
                          <Skeleton className="h-6 w-20 rounded-full" />
                          <Skeleton className="h-8 w-28 rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !influencer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <ErrorCard
          title={error ? "Something went wrong" : "Influencer not found"}
          message={
            error
              ? "We're having trouble loading this influencer. Please try again later."
              : "The influencer you're looking for doesn't exist or has been removed."
          }
          error={error || undefined}
          onRefresh={error ? handleRefresh : undefined}
          showRefreshButton={!!error}
        />
      </div>
    );
  }

  const uniqueRestaurants = new Set(
    listings.map((listing) => listing.restaurant.id)
  ).size;
  const totalVideos = listings.length;

  // Calculate most reviewed cuisine type
  const getMostReviewedCuisine = () => {
    if (!listings || listings.length === 0) return "Cuisine";

    const cuisineCount: { [key: string]: number } = {};

    listings.forEach((listing) => {
      if (listing.restaurant.tags && listing.restaurant.tags.length > 0) {
        listing.restaurant.tags.forEach((tag) => {
          const cuisineName = tag.name;
          cuisineCount[cuisineName] = (cuisineCount[cuisineName] || 0) + 1;
        });
      }
    });

    if (Object.keys(cuisineCount).length === 0) return "Cuisine";

    // Find the cuisine with the highest count
    const mostReviewedCuisine = Object.entries(cuisineCount).sort(
      ([, a], [, b]) => b - a
    )[0][0];

    return mostReviewedCuisine;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      {/* Full-Width Hero Banner */}
      <div className="relative w-full h-[70vh] min-h-[500px] overflow-hidden rounded-lg">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: influencer.banner_url
              ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${influencer.banner_url})`
              : "linear-gradient(135deg, rgb(249, 115, 22), rgb(239, 68, 68))",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />

        {/* Hero Content */}
        <div className="relative h-full flex flex-col justify-center items-center text-center px-4">
          {/* Avatar */}
          <div className="w-32 h-32 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-4xl font-bold border-4 border-white/30 shadow-xl mb-6">
            {influencer.avatar_url ? (
              <Image
                src={influencer.avatar_url}
                alt={influencer.name}
                width={128}
                height={128}
                className="rounded-full object-cover"
              />
            ) : (
              influencer.name.charAt(0)
            )}
          </div>

          {/* Profile Info */}
          <div className="text-white max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {influencer.name}
            </h1>
            <p className="text-lg md:text-xl text-white/90 mb-2">
              Food and travel vlogger exploring
            </p>
            <p className="text-lg md:text-xl text-white/90 mb-8">
              local favorites & hidden gems
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row - Moved and Restyled */}
      <div className="relative z-20 -mt-20 mb-8 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Restaurants Reviewed Card */}
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-2xl md:text-3xl font-bold text-gray-900">
              {uniqueRestaurants}
            </div>
            <div className="text-sm md:text-base text-gray-600">
              Restaurants
              <br />
              Reviewed
            </div>
          </div>

          {/* Cities Covered Card */}
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-2xl md:text-3xl font-bold text-gray-900">
              {totalVideos}
            </div>
            <div className="text-sm md:text-base text-gray-600">
              Cities
              <br />
              Covered
            </div>
          </div>

          {/* Subscriber Count Card */}
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-2xl md:text-3xl font-bold text-gray-900">
              {formatNumberAbbreviated(influencer.subscriber_count)}
            </div>
            <div className="text-sm md:text-base text-gray-600">
              Subscribers
            </div>
          </div>

          {/* Most Reviewed Cuisine Card (Gradient) */}
          <div className="bg-gradient-to-br from-orange-400 to-red-500 rounded-lg shadow-md p-6 text-center text-white relative">
            <Badge className="absolute -top-2 -right-2 bg-yellow-400 text-black text-xs px-2 py-1 rotate-12">
              ⭐ TOP
            </Badge>
            <div className="text-2xl md:text-3xl font-bold">
              {getMostReviewedCuisine()}
            </div>
            <div className="text-sm md:text-base">Most Reviewed</div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        {/* Profile Details */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">About</h2>
          <p className="text-gray-600 leading-relaxed mb-6">
            {influencer.bio || "No bio available."}
          </p>

          {/* Links Section */}
          {influencer.youtube_channel_id && (
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Links
              </h3>
              <div className="space-y-3">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="w-full md:w-auto justify-start"
                >
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
              </div>
            </div>
          )}
        </div>

        {/* Content Cards */}
        <div className="grid grid-cols-1 gap-6 mb-12">
          {/* Popular Videos Card */}
          <Card className="bg-white shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Play className="w-6 h-6 text-red-500" />
                <h2 className="text-xl font-bold text-gray-900">
                  Popular Videos
                </h2>
              </div>
              <VideoSlider videos={videos} />
            </CardContent>
          </Card>

          {/* Signature Picks Card */}
          <Card className="bg-white shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Star className="w-6 h-6 text-yellow-500 fill-current" />
                <h2 className="text-xl font-bold text-gray-900">
                  Signature Picks
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {listings.slice(0, 4).map((listing) => (
                  <div
                    key={listing.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Star className="w-4 h-4 text-white fill-current" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {listing.restaurant.name}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {listing.restaurant?.tags?.[0]?.name || "Restaurant"} •{" "}
                        {listing.restaurant.city}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trending Quote Card */}
          <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Quote className="w-6 h-6" />
                <h2 className="text-xl font-bold">Trending This Month</h2>
              </div>
              <blockquote className="text-lg italic font-light leading-relaxed">
                &quot;Absolutely <span className="font-semibold">bursting</span>{" "}
                with <span className="font-semibold">flavor</span>.&quot;
              </blockquote>
              <p className="text-sm text-white/80 mt-3">— Latest Review</p>
            </CardContent>
          </Card>
        </div>

        {/* All Reviews */}
        {listings.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-8">
              <Users className="w-6 h-6 text-gray-600" />
              <h2 className="text-2xl font-bold text-gray-900">All Reviews</h2>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                {listings.length}
              </Badge>
            </div>

            {/* Map Section */}
            <div className="mb-8">
              <RestaurantMap
                restaurants={listings.map((listing) => listing.restaurant)}
                className="h-80 w-full"
              />
            </div>

            {/* Single Column Restaurant Cards */}
            <div className="space-y-6">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 p-2"
                >
                  <div className="flex flex-col">
                    {/* Restaurant Image */}
                    <div className="h-64 relative overflow-hidden rounded-md p-2">
                      {listing.restaurant.photo_url ? (
                        <Image
                          src={listing.restaurant.photo_url}
                          alt={listing.restaurant.name}
                          fill
                          className="object-cover z-10 rounded-md w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-sm">
                            No image available
                          </span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs font-medium text-gray-900">
                            {listing.restaurant.google_rating || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        {/* Restaurant Info */}
                        <div className="flex-1">
                          <Link
                            href={`/restaurants/${listing.restaurant.id}`}
                            className="text-2xl font-bold text-gray-900 hover:text-orange-600 mb-3 block leading-tight"
                          >
                            {listing.restaurant.name}
                          </Link>

                          <div className="flex flex-wrap items-center gap-2 mb-4">
                            <Badge variant="outline" className="text-sm">
                              <MapPin className="w-3 h-3 mr-1" />
                              {listing.restaurant.city}
                            </Badge>

                            {listing.visit_date && (
                              <Badge variant="outline" className="text-sm">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(
                                  listing.visit_date
                                ).toLocaleDateString()}
                              </Badge>
                            )}
                          </div>

                          <p className="text-gray-600 mb-4">
                            {listing.restaurant.address}
                          </p>

                          {/* Quotes */}
                          {listing.quotes && listing.quotes.length > 0 && (
                            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                              {listing.quotes.map((quote, index) => (
                                <div
                                  key={index}
                                  className="bg-orange-50 border-l-4 border-orange-200 p-4 rounded-lg"
                                >
                                  <div className="flex items-start">
                                    <Quote className="w-4 h-4 text-orange-500 mr-2 mt-1 flex-shrink-0" />
                                    <blockquote className="text-gray-700 italic">
                                      &quot;{quote}&quot;
                                    </blockquote>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Video Embed */}
                    <div className="bg-gray-100 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        {listing.video.title}
                      </h4>

                      {/* Video Iframe Placeholder */}
                      <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-3">
                        <iframe
                          src={`https://www.youtube.com/embed/${
                            listing.video.video_url
                              .split("v=")[1]
                              ?.split("&")[0] || ""
                          }`}
                          title={listing.video.title}
                          className="w-full h-full"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>

                      {listing.video.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                          {listing.video.description}
                        </p>
                      )}

                      <div className="flex items-center justify-end">
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="border-orange-200 text-orange-600 hover:bg-orange-50"
                        >
                          <Link href={`/restaurants/${listing.restaurant.id}`}>
                            View Restaurant
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {listings.length === 0 && (
          <div className="bg-white rounded-lg shadow-md text-center p-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              No Reviews Yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              No restaurant reviews available from this influencer yet. Check
              back later for new content!
            </p>
            <Button asChild variant="outline" size="lg">
              <Link href="/restaurants">Browse Restaurants</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
