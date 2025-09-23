import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RatingStars from "@/components/rating-stars";
import { Restaurant, Listing, Cuisine } from "@/lib/types";
import { cn } from "@/lib/utils";
import SocialShareButtons from "@/components/social-share-buttons";

interface RestaurantDetailCardProps {
  restaurant: Restaurant;
  listings?: Listing[];
  cuisines?: Cuisine[];
  showInfluencer?: boolean;
  className?: string;
}

export function RestaurantDetailCard({
  restaurant,
  listings,
  cuisines,
  showInfluencer = true,
  className
}: RestaurantDetailCardProps) {
  return (
    <Card
      className={cn("border-gray-100 shadow-xl bg-white h-full", className)}
    >
      <CardContent className="p-6 h-full">
        <div className="flex flex-col md:flex-row items-stretch gap-4">
          <div className="w-full md:w-80 rounded-xl overflow-hidden relative flex-grow md:flex-shrink-0 min-h-[200px]">
            {restaurant.photo_url ? (
              <Image
                fill
                src={restaurant.photo_url}
                alt={restaurant.name}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 320px, 320px"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {restaurant?.name?.charAt(0) || '?'}
                </span>
              </div>
            )}
          </div>
          <div className="flex-grow">
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {restaurant.name}
            </h3>
            <p className="text-gray-700 mb-2">{restaurant.address}</p>
            {restaurant.google_rating && (
              <div className="mb-2">
                <RatingStars rating={restaurant.google_rating} />
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {cuisines?.map((cuisine) => (
                <span
                  key={cuisine.id}
                  className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full"
                >
                  {cuisine.name}
                </span>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex flex-wrap gap-3">
                <Button asChild>
                  <Link href={`/restaurants/${restaurant.id}`}>
                    View Full Details
                  </Link>
                </Button>
                {restaurant.google_place_id && (
                  <Button asChild variant="outline">
                    <a
                      href={`https://www.google.com/maps/place/?q=place_id:${restaurant.google_place_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open in Google Maps
                    </a>
                  </Button>
                )}
              </div>
              {/* Social Share Buttons */}
              <SocialShareButtons
                url={typeof window !== 'undefined' ? `${window.location.origin}/restaurants/${restaurant.id}` : ''}
                title={`Check out ${restaurant.name} - Amazing restaurant in ${restaurant.city || 'the city'}`}
                description={`Discover ${restaurant.name} located at ${restaurant.address}. Highly rated restaurant featured by food influencers!`}
                variant="inline"
                className="pt-2 border-t border-gray-100"
              />
            </div>
          </div>
        </div>
        <div>
          {/* Influencer Information */}
          {listings?.map((listing, index) => {
            const influencer = listing?.influencer;
            return (
              <div key={index} className="mt-4 p-3 bg-white/50 rounded-lg">
                <div className="mb-4 last:mb-0">
                  {influencer && showInfluencer && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-600">
                        Featured by:
                      </span>
                      {influencer.avatar_url && (
                        <Image
                          src={influencer.avatar_url}
                          alt={`${influencer.name} avatar`}
                          width={25}
                          height={25}
                          className="rounded-full mr-1"
                        />
                      )}
                      <span className="text-xl font-semibold text-orange-700">
                        {influencer.name}
                      </span>
                    </div>
                  )}
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
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default RestaurantDetailCard;
