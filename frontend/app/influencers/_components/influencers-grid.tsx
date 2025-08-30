"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Youtube, MapPin, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Influencer } from "@/lib/types";
import { formatNumberAbbreviated } from "@/lib/utils/number-formatter";
import ErrorCard from "@/components/error-card";

interface InfluencerWithStats extends Influencer {
  totalVideos: number;
  uniqueRestaurants: number;
}

interface InfluencersGridProps {
  loading: boolean;
  error: string | null;
  filteredInfluencers: InfluencerWithStats[];
  searchQuery: string;
  clearSearch: () => void;
  onRefresh: () => void;
}

function InfluencerCardSkeleton() {
  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 group border-0 shadow-lg hover:-translate-y-2 py-0">
      <CardContent className="p-4">
        {/* Card Header with Banner */}
        <div className="h-32 bg-gradient-to-r from-orange-400 to-red-500 relative rounded-xl mb-2">
          <Skeleton className="absolute -bottom-8 left-4 w-16 h-16 rounded-full border-4 border-white" />
        </div>
        <div className="pt-8 px-2">
          <div className="mb-4">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-16 w-full mb-6" />
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 w-12 rounded-xl" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function InfluencerCard({ influencer }: { influencer: InfluencerWithStats }) {
  return (
    <Card className="overflow-hidden hover:shadow-2xl transition-all duration-500 group border-0 shadow-lg hover:-translate-y-2 py-0 h-full flex flex-col">
      <CardContent className="p-4 flex-1 flex flex-col">
        {/* Card Header with Banner/Gradient */}
        <div 
          className="h-32 relative rounded-xl mb-2"
          style={{
            backgroundImage: influencer.banner_url 
              ? `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.3)), url(${influencer.banner_url})`
              : 'linear-gradient(to right, rgb(251, 146, 60), rgb(239, 68, 68), rgb(236, 72, 153))',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {/* Avatar positioned to overlap */}
          <div className="absolute -bottom-8 left-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg">
              {influencer.avatar_url ? (
                <Image
                  src={influencer.avatar_url}
                  alt={influencer.name}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-400 to-red-500 text-white font-bold text-xl">
                  {influencer.name.charAt(0)}
                </div>
              )}
            </div>
          </div>
          
          {/* Top right badge for featured influencers */}
          {influencer.totalVideos > 10 && (
            <div className="absolute top-4 right-4">
              <Badge className="bg-white/20 backdrop-blur-sm text-white border-white/30 px-3 py-1">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="pt-8 px-2 flex-1 flex flex-col">
          {/* Name and Location */}
          <div className="mb-4">
            <h3 className="font-bold text-xl text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
              {influencer.name}
            </h3>
            {influencer.region && (
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">{influencer.region}</span>
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="flex-1 mb-6">
            {influencer.bio && (
              <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed">
                {influencer.bio}
              </p>
            )}
          </div>

          {/* Enhanced Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-3 bg-orange-50 rounded-xl">
              <div className="text-2xl font-bold text-orange-600 mb-1">
                {influencer.uniqueRestaurants || 0}
              </div>
              <div className="text-xs text-gray-600 font-medium">Restaurants</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <div className="text-2xl font-bold text-blue-600 mb-1">
                {influencer.totalVideos || 0}
              </div>
              <div className="text-xs text-gray-600 font-medium">Reviews</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <div className="text-2xl font-bold text-green-600 mb-1">
                {formatNumberAbbreviated(influencer.subscriber_count)}
              </div>
              <div className="text-xs text-gray-600 font-medium">Subscribers</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-auto">
            <Link href={`/influencers/${influencer.id}`} className="flex-1">
              <Button className="w-full bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2.5 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl">
                View Profile
              </Button>
            </Link>
            {influencer.youtube_channel_url && (
              <Button asChild className="bg-red-600 hover:bg-red-500 text-white p-2.5 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl">
                <a 
                  href={influencer.youtube_channel_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center"
                >
                  <Youtube className="w-5 h-5" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function InfluencersGrid({ 
  loading, 
  error, 
  filteredInfluencers, 
  searchQuery, 
  clearSearch, 
  onRefresh 
}: InfluencersGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, index) => (
          <InfluencerCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <ErrorCard
        title="Something went wrong"
        message="We&apos;re having trouble loading the influencers. Please try again later."
        error={error}
        onRefresh={onRefresh}
      />
    );
  }

  if (filteredInfluencers.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="bg-white rounded-2xl shadow-xl p-12 max-w-md mx-auto">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            {searchQuery ? 'No matches found' : 'No influencers available'}
          </h3>
          <p className="text-gray-600 mb-6">
            {searchQuery 
              ? `We couldn't find any influencers matching "${searchQuery}". Try adjusting your search terms.` 
              : 'There are currently no influencers to display.'}
          </p>
          {searchQuery && (
            <Button
              onClick={clearSearch}
              className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2 rounded-lg transition-all duration-200 hover:scale-105"
            >
              Clear search
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {filteredInfluencers.map((influencer) => (
        <InfluencerCard key={influencer.id} influencer={influencer} />
      ))}
    </div>
  );
}