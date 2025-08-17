"use client";

import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Listing } from "@/types/index";

interface RestaurantLatestListingsProps {
  restaurantListings: Listing[];
}

export function RestaurantLatestListings({
  restaurantListings,
}: RestaurantLatestListingsProps) {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Latest Listings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {restaurantListings.slice(0, 3).map((listing) => (
          <Card
            key={listing.id}
            className="overflow-hidden border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group p-4"
          >
            <div className="relative h-48 rounded-lg overflow-hidden">
              {listing.restaurant?.photo_url ? (
                <Image
                  src={listing.restaurant.photo_url}
                  alt={listing.restaurant.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                  <span className="text-white font-bold text-4xl">
                    {listing.restaurant?.name.charAt(0)}
                  </span>
                </div>
              )}
              {listing.influencer?.name && (
                <div className="absolute top-4 left-4">
                  <Badge className="bg-orange-500 text-white px-3 py-1">
                    {listing.influencer.name}
                  </Badge>
                </div>
              )}
              {listing.restaurant?.google_rating && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-black/70 text-white px-2 py-1">
                    ⭐ {listing.restaurant.google_rating}
                  </Badge>
                </div>
              )}
            </div>
            <CardContent className="p-0 flex flex-col flex-grow gap-3">
              <div className="flex-grow">
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                  {listing.restaurant.name}
                </h3>
                <p className="text-gray-600 mb-1">{listing.restaurant?.city}</p>
                <p className="text-gray-600 mb-1">
                  {listing.restaurant.tags &&
                    listing.restaurant.tags.length > 0 &&
                    listing.restaurant.tags.slice(0, 4).map((tag) => (
                      <Badge
                        key={tag.id}
                        className="mr-2 bg-orange-600/15 text-orange-600"
                      >
                        {tag.name.charAt(0).toUpperCase() + tag.name.slice(1)}
                      </Badge>
                    ))}
                </p>
                {/* <p className="text-sm text-gray-500">
                  {listing.restaurant.address}
                </p> */}
              </div>
              <Button asChild className="w-full mt-auto bg-orange-500 text-white hover:bg-orange-600">
                <Link href={`/restaurants/${listing.restaurant?.id}`}>
                  View Details
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
