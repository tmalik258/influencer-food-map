import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Restaurant, Listing } from "@/lib/types";
import { Star } from "lucide-react";

interface RestaurantCardProps {
  restaurant: Restaurant;
  listings: Listing[];
  showButton?: boolean; // Optional prop to control button visibility
}

export function RestaurantCard({
  restaurant,
  listings,
  showButton = true,
}: RestaurantCardProps) {
  return (
    <Card
      key={restaurant.id}
      className="overflow-hidden border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 group p-4"
    >
      <div className="relative h-48 rounded-lg overflow-hidden">
        {restaurant.photo_url ? (
          <Image
            src={restaurant.photo_url}
            alt={restaurant.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
            <span className="text-white font-bold text-4xl">
              {restaurant.name.charAt(0)}
            </span>
          </div>
        )}
        {restaurant.google_rating && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-black/70 text-white px-2 py-1 flex items-center">
              <Star className="h-5 w-5 fill-current text-orange-400" />{" "}
              {restaurant.google_rating}
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-0 flex flex-col flex-grow gap-3">
        <div className="">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
            {restaurant.name}
          </h3>
          <p className="text-gray-600 mb-1">{restaurant?.city}</p>
          <p className="text-gray-600 mb-1">
            {restaurant.cuisines &&
              restaurant.cuisines.length > 0 &&
              restaurant.cuisines.slice(0, 4).map((cuisine) => (
                <Badge
                  key={cuisine.id}
                  className="mr-2 bg-orange-600/15 text-orange-600"
                >
                  {cuisine.name.charAt(0).toUpperCase() + cuisine.name.slice(1)}
                </Badge>
              ))}
          </p>
          {/* <p className="text-sm text-gray-500">{restaurant.address}</p> */}
        </div>
        <div className="flex-grow flex flex-col ">
          {listings && listings.length > 0 && (
            <div className="my-auto">
              {listings.map((listing) => (
                <div key={listing.id} className="flex items-center mb-2">
                  {listing.influencer && listing.influencer.avatar_url && (
                    <Image
                      width={32}
                      height={32}
                      src={listing.influencer?.avatar_url}
                      alt={listing.influencer.name}
                      className="w-8 h-8 rounded-full mr-2 object-cover"
                    />
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {listing.influencer?.name}
                    </p>
                    {listing.quotes && listing.quotes.length > 0 && (
                      <p className="text-xs text-gray-500 italic line-clamp-3">
                        &quot;{listing.quotes?.[1]}&quot;
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {showButton !== false && (
          <Button
            asChild
            className="w-full mt-auto bg-orange-500 text-white hover:bg-orange-600 transition-colors duration-200"
          >
            <Link href={`/restaurants/${restaurant.id}`}>View Details</Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
