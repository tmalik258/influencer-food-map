import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Restaurant, Listing } from "@/types";
import RatingStars from "@/components/rating-stars";

interface RestaurantCardProps {
  restaurant: Restaurant;
  restaurantListings: Listing[];
}

export function RestaurantCard({
  restaurant,
  restaurantListings,
}: RestaurantCardProps) {
  const currentRestaurantListings = restaurantListings.filter(
    (listing) => listing.restaurant?.id === restaurant.id
  );

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
        {currentRestaurantListings.length > 0 && (
          <div className="absolute top-4 left-4">
            <Badge className="bg-orange-500 text-white px-3 py-1">
              {currentRestaurantListings[0].influencer?.name}
            </Badge>
          </div>
        )}
        {restaurant.google_rating && (
          <div className="absolute top-4 right-4">
            <Badge className="bg-black/70 text-white px-2 py-1 flex items-center">
              <RatingStars rating={1} /> {restaurant.google_rating}
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-0 flex flex-col flex-grow gap-3">
        <div className="flex-grow">
          <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
            {restaurant.name}
          </h3>
          <p className="text-gray-600 mb-1">{restaurant?.city}</p>
          <p className="text-gray-600 mb-1">
            {restaurant.tags &&
              restaurant.tags.length > 0 &&
              restaurant.tags.slice(0, 4).map((tag) => (
                <Badge
                  key={tag.id}
                  className="mr-2 bg-orange-600/15 text-orange-600"
                >
                  {tag.name.charAt(0).toUpperCase() + tag.name.slice(1)}
                </Badge>
              ))}
          </p>
          <p className="text-sm text-gray-500">{restaurant.address}</p>
        </div>
        <Button
          asChild
          className="w-full mt-auto bg-orange-500 text-white hover:bg-orange-600"
        >
          <Link href={`/restaurants/${restaurant.id}`}>View Details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}