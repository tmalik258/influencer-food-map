"use client";

import { useParams } from "next/navigation";
import { useRestaurant, useRestaurantListings } from "@/lib/hooks";
import { MapPin, Play, Calendar, Quote, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import RestaurantMap from "@/components/dynamic-restaurant-map";
import GoogleReviews from "@/components/google-reviews";

export default function RestaurantDetailPage() {
  const params = useParams();
  const restaurantId = params.id as string;

  const {
    restaurant,
    loading: restaurantLoading,
    error: restaurantError,
  } = useRestaurant(restaurantId);
  const { listings, loading: listingsLoading } =
    useRestaurantListings(restaurantId);

  const loading = restaurantLoading || listingsLoading;
  const error = restaurantError;

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-2">
        {/* Hero Section Skeleton */}
        <div className="relative h-[calc(65vh)] rounded-xl overflow-hidden mb-2">
          <Skeleton className="w-full h-full" />
          {/* Title Overlay Skeleton */}
          <div className="absolute bottom-20 left-0 right-0 text-center p-6 md:p-8 z-50">
            <Skeleton className="h-12 md:h-16 w-80 mx-auto mb-4" />
            <div className="flex items-center justify-center gap-5">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-8 w-20" />
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Overlapping Map Skeleton */}
          <div className="relative -mt-16 mb-8 mx-2 z-10">
            <Skeleton className="h-[300px] md:h-[350px] max-w-6xl w-[70vw] max-md:w-[80vw] mx-auto rounded-xl" />
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

          {/* Google Reviews Section Skeleton */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <Skeleton className="h-7 w-40" />
              <Skeleton className="h-6 w-16" />
              <div className="flex gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="w-4 h-4" />
                ))}
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-20 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                    <div className="flex gap-1 mb-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} className="w-3 h-3" />
                      ))}
                    </div>
                    <Skeleton className="h-12 w-full" />
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
            <p className="text-red-600 mb-4">
              {error || "Restaurant not found"}
            </p>
            <Button asChild variant="outline">
              <Link href="/restaurants">Back to Restaurants</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-2 mb-5">
      {/* Full Width Hero Section with Overlay Title */}
      <div className="relative h-[calc(65vh)] rounded-xl overflow-hidden">
        {restaurant.photo_url ? (
          <Image
            fill
            src={restaurant.photo_url}
            alt={restaurant.name}
            className="object-cover w-full h-full brightness-[0.5] filter"
            // sizes="100vw"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-orange-400 to-red-500"></div>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

        {/* Title Overlay */}
        <div className="absolute bottom-20 left-0 right-0 text-center p-6 md:p-8 z-50">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-xl">
            {restaurant.name}
          </h1>
          <div className="flex items-center justify-center rounded-lg text-white gap-5">
            <div className="flex items-center gap-1">
              <Badge className="bg-white text-black">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{restaurant.city}</span>
                </div>
              </Badge>
            </div>
            {/* Business Status - Right Aligned */}
            <div className="flex items-center">
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 hover:bg-green-100"
              >
                {restaurant.business_status || "Open"}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Overlapping Restaurant Map */}
      <div className="relative -mt-16 mb-8 mx-2 z-10">
        <RestaurantMap
          restaurants={[restaurant]}
          selectedRestaurant={restaurant}
          onRestaurantSelect={() => {}}
          className="h-[300px] md:h-[350px] max-w-6xl w-[70vw] max-md:w-[80vw] mx-auto rounded-xl shadow-lg"
        />
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Influencer Reviews */}
        {listings.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Influencer Reviews
              <Badge variant="secondary" className="ml-2">
                {listings.length}
              </Badge>
            </h2>
            <div className="space-y-6">
              {listings.map((listing) => (
                <Card
                  key={listing.id}
                  className="overflow-hidden hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col gap-6">
                      {/* Header Section with Influencer Info and View Profile Button */}
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
                          <div className="flex items-start justify-between">
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
                                    <span>
                                      {new Date(
                                        listing.visit_date
                                      ).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* View Profile Button - Right Aligned */}
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

                      {/* Quotes in Two Columns */}
                      {listing.quotes && listing.quotes.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                          {listing.quotes.map((quote, index) => (
                            <div
                              key={index}
                              className="p-3 bg-gray-50 rounded-lg border-l-4 border-orange-500"
                            >
                              <div className="flex items-start gap-2">
                                <Quote className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                <blockquote className="text-gray-700 italic text-sm">
                                  &quot;{quote}&quot;
                                </blockquote>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Video Section - Full Width at Bottom */}
                      <div className="w-full">
                        {(() => {
                          // Extract YouTube video ID from URL
                          const getYouTubeVideoId = (url: string) => {
                            const regex =
                              /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
                            const match = url.match(regex);
                            return match ? match[1] : null;
                          };

                          const videoId = getYouTubeVideoId(
                            listing.video.video_url
                          );

                          if (videoId) {
                            return (
                              <div
                                className="relative w-full"
                                style={{ paddingBottom: "56.25%" }}
                              >
                                <iframe
                                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                                  src={`https://www.youtube.com/embed/${videoId}`}
                                  title={`${listing.influencer.name} - ${listing.restaurant.name} Review`}
                                  frameBorder="0"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                  allowFullScreen
                                />
                              </div>
                            );
                          } else {
                            return (
                              <div className="w-full aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                  <Play className="w-12 h-12 mx-auto mb-2" />
                                  <p className="text-sm">
                                    Video preview not available
                                  </p>
                                  <p className="text-xs mt-1">
                                    <a
                                      href={listing.video.video_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-orange-600 hover:text-orange-700 underline"
                                    >
                                      View original video
                                    </a>
                                  </p>
                                </div>
                              </div>
                            );
                          }
                        })()}
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
              <p className="text-gray-600 mb-4">
                No influencer reviews available for this restaurant yet.
              </p>
              <Button variant="outline" asChild>
                <Link href="/influencers">Browse Influencers</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Google Maps Reviews */}
        {restaurant.google_place_id && (
          <GoogleReviews placeId={restaurant.google_place_id} />
        )}
      </div>
    </div>
  );
}
