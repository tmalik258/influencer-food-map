import { Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import RestaurantDetailCard from "@/components/restaurant-detail-card";
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
          No restaurant reviews available from this influencer yet. Check back
          later for new content!
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

      {/* Single Column Restaurant Cards */}
      <div className="space-y-6">
        {listings.map(
          (listing) =>
            listing?.restaurant && (
              <RestaurantDetailCard
                key={listing.id}
                restaurant={listing.restaurant}
                listings={[listing]}
                cuisines={listing.restaurant?.cuisines}
                showInfluencer={false}
                className="mt-6"
              />
            )
        )}
      </div>
    </div>
  );
};
