import { Users, MapPin, Calendar, Quote, Star } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RestaurantMap from "@/components/dynamic-restaurant-map";
import type { Listing } from "@/lib/types";

interface AllReviewsProps {
  listings: Listing[];
}

export const AllReviews: React.FC<AllReviewsProps> = ({ listings }) => {
  if (listings.length === 0) {
    return (
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
    );
  }

  return (
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
          restaurants={listings.map((listing) => listing?.restaurant || null)}
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
                {listing?.restaurant?.photo_url ? (
                  <Image
                    src={listing?.restaurant?.photo_url}
                    alt={listing?.restaurant?.name}
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
                      {listing?.restaurant?.google_rating || "N/A"}
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
                      href={`/restaurants/${listing?.restaurant?.id}`}
                      className="text-2xl font-bold text-gray-900 hover:text-orange-600 mb-3 block leading-tight"
                    >
                      {listing?.restaurant?.name}
                    </Link>

                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <Badge variant="outline" className="text-sm">
                        <MapPin className="w-3 h-3 mr-1" />
                        {listing?.restaurant?.city}
                      </Badge>

                      {listing?.visit_date && (
                        <Badge variant="outline" className="text-sm">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(
                            listing?.visit_date
                          ).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>

                    <p className="text-gray-600 mb-4">
                      {listing?.restaurant?.address}
                    </p>

                    {/* Quotes */}
                    {listing?.quotes && listing?.quotes?.length > 0 && (
                      <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {listing?.quotes?.map((quote, index) => (
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
                  {listing?.video?.title}
                </h4>

                {/* Video Iframe Placeholder */}
                <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-3">
                  <iframe
                    src={`https://www.youtube.com/embed/${
                      listing?.video?.video_url
                        .split("v=")[1]
                        ?.split("&")[0] || ""
                    }`}
                    title={listing?.video?.title}
                    className="w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                {listing?.video?.description && (
                  <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                    {listing?.video?.description}
                  </p>
                )}

                <div className="flex items-center justify-end">
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="border-orange-200 text-orange-600 hover:bg-orange-50"
                  >
                    <Link href={`/restaurants/${listing?.restaurant?.id}`}>
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
  );
};