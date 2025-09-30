"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Listing } from "@/lib/types";
import { ListingForm } from "@/app/dashboard/listings/_components/listing-form";
import { useListingCard } from "@/lib/hooks/useListingCard";
import {
  FileText,
  Calendar,
  TrendingUp,
  Quote,
  Building2,
  MapPin,
  Star,
  User,
  Users,
  Clock,
  Hash,
  Edit,
  X,
} from "lucide-react";

interface ListingCardProps {
  listing: Listing;
}

export function ListingCard({ listing }: ListingCardProps) {
  const {
    isEditMode,
    toggleEditMode,
    handleListingIdClick,
    handleEditSuccess,
    formatTimestamp,
  } = useListingCard({ listing });

  if (isEditMode) {
    return (
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Edit className="h-5 w-5 text-blue-600" />
              Edit Listing
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleEditMode}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ListingForm
            mode="edit"
            listingData={listing}
            onSuccess={handleEditSuccess}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-sm border border-gray-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-blue-600" />
            Listing Details
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={toggleEditMode}
            className="flex items-center gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Listing ID and Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Listing ID:</span>
            <button
              onClick={handleListingIdClick}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-mono"
            >
              {listing.id}
            </button>
          </div>

          {listing.timestamp && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Video Timestamp:</span>
              <Badge variant="outline" className="font-mono">
                {formatTimestamp(listing.timestamp)}
              </Badge>
            </div>
          )}

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
              <Badge
                variant={
                  listing?.confidence_score >= 0.8 ? "default" : "secondary"
                }
              >
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
                <div
                  key={index}
                  className="bg-gray-50 p-3 rounded-md border-l-4 border-blue-200"
                >
                  <p className="text-sm text-gray-700 italic">
                    &quot;{quote}&quot;
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Context */}
        {listing.context && listing.context.length > 0 && (
          <div>
            <h4 className="flex items-center gap-2 text-sm font-medium mb-2">
              <FileText className="h-4 w-4 text-gray-500" />
              Context
            </h4>
            <div className="space-y-2">
              {listing.context.map((contextItem, index) => (
                <p key={index} className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                  {contextItem}
                </p>
              ))}
            </div>
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
                    <h5 className="font-semibold text-orange-900">
                      {listing.restaurant.name}
                    </h5>
                    {listing.restaurant.address && (
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-orange-600" />
                        <span className="text-xs text-orange-700">
                          {listing.restaurant.address}
                          {listing.restaurant.city &&
                            `, ${listing.restaurant.city}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    {listing.restaurant.google_rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-xs font-medium">
                          {listing.restaurant.google_rating}
                        </span>
                      </div>
                    )}

                    {listing.restaurant.cuisines &&
                      listing.restaurant.cuisines.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {listing.restaurant.cuisines
                            .slice(0, 3)
                            .map((cuisine) => (
                              <Badge
                                key={cuisine.id}
                                variant="outline"
                                className="text-xs"
                              >
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
                    <h5 className="font-semibold text-purple-900">
                      {listing.influencer.name}
                    </h5>
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
                          {listing.influencer.subscriber_count.toLocaleString()}{" "}
                          subscribers
                        </span>
                      </div>
                    )}

                    {listing.influencer.total_videos && (
                      <Badge variant="outline" className="text-xs">
                        {listing.influencer.total_videos.toLocaleString()}{" "}
                        videos
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
