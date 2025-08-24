"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RestaurantMap from "@/components/dynamic-restaurant-map";
import RatingStars from "@/components/rating-stars";
import { Restaurant } from "@/types/index";

interface RestaurantMapViewProps {
  filteredRestaurants: Restaurant[];
  selectedRestaurant: Restaurant | null;
  setSelectedRestaurant: (restaurant: Restaurant | null) => void;
}

export function RestaurantMapView({
  filteredRestaurants,
  selectedRestaurant,
  setSelectedRestaurant,
}: RestaurantMapViewProps) {
  return (
    <div className="mb-8">
      <RestaurantMap
        restaurants={filteredRestaurants}
        selectedRestaurant={selectedRestaurant}
        onRestaurantSelect={setSelectedRestaurant}
        className="h-[400px] md:h-[600px] w-full"
      />

      {selectedRestaurant && (
        <Card className="mt-6 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 h-full">
          <CardContent className="p-6 h-full">
            <div className="flex flex-col md:flex-row items-stretch gap-4">
              <div className="w-full md:w-80 rounded-xl overflow-hidden relative flex-grow md:flex-shrink-0 min-h-[200px]">
                {selectedRestaurant.photo_url ? (
                  <Image
                    fill
                    src={selectedRestaurant.photo_url}
                    alt={selectedRestaurant.name}
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 320px, 320px"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                    <span className="text-white font-bold text-2xl">
                      {selectedRestaurant.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-grow">
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {selectedRestaurant.name}
                </h3>
                <p className="text-gray-700 mb-2">
                  {selectedRestaurant.address}
                </p>
                {selectedRestaurant.google_rating && (
                  <div className="mb-2">
                    <RatingStars rating={selectedRestaurant.google_rating} />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {selectedRestaurant.tags?.map((tag) => (
                    <span
                      key={tag.id}
                      className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
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
            <div>
              {/* Influencer Information */}
              {selectedRestaurant.listings?.map((listing, index) => {
                const influencer = listing.influencer;
                return (
                  <div
                    key={index}
                    className="mt-4 p-3 bg-white/50 rounded-lg border border-orange-200"
                  >
                    {influencer && (
                      <div className="mb-4 last:mb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-medium text-gray-600">
                            Featured by:
                          </span>
                          {influencer.avatar_url && (
                            <Image
                              src={influencer.avatar_url}
                              alt={`${influencer.name} avatar`}
                              width={20}
                              height={20}
                              className="rounded-full mr-1"
                            />
                          )}
                          <span className="text-sm font-semibold text-orange-700">
                            {influencer.name}
                          </span>
                        </div>
                        {listing.quotes && listing.quotes.length > 0 && (
                          <div className="space-y-2">
                            {listing.quotes.map(
                              (quote: string, quoteIndex: number) => (
                                <div
                                  key={quoteIndex}
                                  className="p-3 bg-gray-50 rounded-lg border-l-4 border-orange-500"
                                >
                                  <div className="flex items-start gap-2">
                                    <Quote className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                                    <blockquote className="text-gray-700 italic text-sm">
                                      &quot;{quote}&quot;
                                    </blockquote>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
