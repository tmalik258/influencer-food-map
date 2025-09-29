"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  MapPin, 
  Star, 
  Calendar, 
  Users, 
  Quote, 
  FileText, 
  TrendingUp,
  Building2,
  User
} from "lucide-react";
import { useListings } from "@/lib/hooks/useListings";
import { Listing } from "@/lib/types";

interface VideoListingsTabProps {
  videoId: string;
}

export function VideoListingsTab({ videoId }: VideoListingsTabProps) {
  // Memoize the params object to prevent infinite re-renders
  const listingsParams = useMemo(() => ({ video_id: videoId }), [videoId]);
  const { listings, loading, error } = useListings(listingsParams);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-white shadow-sm">
            <CardHeader>
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>Error loading listings: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <Card className="bg-white shadow-sm">
        <CardContent className="pt-6">
          <div className="text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium">No listings found</p>
            <p className="text-sm">This video doesn&apos;t have any associated listings yet.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {listings.map((listing) => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  );
}

interface ListingCardProps {
  listing: Listing;
}

function ListingCard({ listing }: ListingCardProps) {
  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-blue-600" />
          Listing Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Listing Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {listing.visit_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Visit Date:</span>
              <span className="text-sm text-gray-600">
                {new Date(listing.visit_date).toLocaleDateString()}
              </span>
            </div>
          )}
          
          {listing.confidence_score && (
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Confidence:</span>
              <Badge variant={listing?.confidence_score >= 0.8 ? "default" : "secondary"}>
                {Math.round(listing.confidence_score * 100)}%
              </Badge>
            </div>
          )}
        </div>

        {/* Quotes */}
        {listing.quotes && listing.quotes.length > 0 && (
          <div>
            <h4 className="flex items-center gap-2 text-sm font-medium mb-2">
              <Quote className="h-4 w-4 text-gray-500" />
              Quotes
            </h4>
            <div className="space-y-2">
              {listing.quotes.map((quote, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-md border-l-4 border-blue-200">
                  <p className="text-sm text-gray-700 italic">&quot;{quote}&quot;</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Context */}
        {listing.context && (
          <div>
            <h4 className="flex items-center gap-2 text-sm font-medium mb-2">
              <FileText className="h-4 w-4 text-gray-500" />
              Context
            </h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
              {listing.context}
            </p>
          </div>
        )}

        {/* Restaurant Information */}
        {listing.restaurant && (
          <div>
            <h4 className="flex items-center gap-2 text-sm font-medium mb-3">
              <Building2 className="h-4 w-4 text-orange-600" />
              Restaurant Details
            </h4>
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <h5 className="font-semibold text-orange-900">{listing.restaurant.name}</h5>
                    {listing.restaurant.address && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-orange-600" />
                        <span className="text-xs text-orange-700">
                          {listing.restaurant.address}
                          {listing.restaurant.city && `, ${listing.restaurant.city}`}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {listing.restaurant.google_rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-xs font-medium">{listing.restaurant.google_rating}</span>
                      </div>
                    )}
                    
                    {listing.restaurant.cuisines && listing.restaurant.cuisines.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {listing.restaurant.cuisines.slice(0, 3).map((cuisine) => (
                          <Badge key={cuisine.id} variant="outline" className="text-xs">
                            {cuisine.name}
                          </Badge>
                        ))}
                        {listing.restaurant.cuisines.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{listing.restaurant.cuisines.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Influencer Information */}
        {listing.influencer && (
          <div>
            <h4 className="flex items-center gap-2 text-sm font-medium mb-3">
              <User className="h-4 w-4 text-purple-600" />
              Influencer Details
            </h4>
            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div>
                    <h5 className="font-semibold text-purple-900">{listing.influencer.name}</h5>
                    {listing.influencer.name && (
                      <p className="text-xs text-purple-700 mt-1">
                        Channel: {listing.influencer.name}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4">
                    {listing.influencer.subscriber_count && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-purple-600" />
                        <span className="text-xs font-medium">
                          {listing.influencer.subscriber_count.toLocaleString()} subscribers
                        </span>
                      </div>
                    )}
                    
                    {listing.influencer.total_videos && (
                      <Badge variant="outline" className="text-xs">
                        {listing.influencer.total_videos.toLocaleString()} videos
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
}