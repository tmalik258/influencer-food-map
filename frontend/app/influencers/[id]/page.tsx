"use client";

import { useParams } from "next/navigation";
import { 
  useInfluencer, 
  useInfluencerListings, 
  useInfluencerVideos, 
  useMostRecentListing 
} from "@/lib/hooks";
import {
  Play,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumberAbbreviated } from "@/lib/utils/number-formatter";
import ErrorCard from "@/components/error-card";
import { VideoSlider } from '@/components/video-slider';
import { StatsCard } from "./_components/stats-card";
import { HeroSection } from "./_components/hero-section";
import { ProfileDetails } from "./_components/profile-details";
import { TrendingQuoteCard } from "./_components/trending-quote-card";
import { SignaturePicksCard } from "./_components/signature-picks-card";
import { AllReviews } from "./_components/all-reviews";
import { LoadingSkeleton } from "./_components/loading-skeleton";
import { getUniqueRestaurantsCount, getMostReviewedCuisine } from "./_components/utils";

export default function InfluencerDetailPage() {
  const params = useParams() as { id: string };
  const influencerId = params?.id;

  const {
    influencer,
    loading: influencerLoading,
    error: influencerError,
    refetch: refetchInfluencer,
  } = useInfluencer(influencerId);
  
  const {
    listings,
    loading: listingsLoading,
    error: listingsError,
    refetch: refetchListings,
  } = useInfluencerListings(influencerId);
  
  const {
    videos,
    loading: videosLoading,
    error: videosError,
    refetch: refetchVideos,
  } = useInfluencerVideos(influencerId, 10);
  
  const {
    listing: mostRecentListing,
    loading: mostRecentLoading,
    error: mostRecentError,
    refetch: refetchMostRecent,
  } = useMostRecentListing(influencerId);

  const handleRefresh = () => {
    refetchInfluencer?.();
    refetchListings?.();
    refetchMostRecent?.();
    refetchVideos?.();
  };

  const loading = influencerLoading || listingsLoading || videosLoading;
  const error = influencerError || listingsError || videosError;

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !influencer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
        <ErrorCard
          title={error ? "Something went wrong" : "Influencer not found"}
          message={
            error
              ? "We're having trouble loading this influencer. Please try again later."
              : "The influencer you're looking for doesn't exist or has been removed."
          }
          error={error || undefined}
          onRefresh={error ? handleRefresh : undefined}
          showRefreshButton={!!error}
        />
      </div>
    );
  }



  const uniqueRestaurants = getUniqueRestaurantsCount(listings || []);
  const totalVideos = listings.length;

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      {/* Hero Section */}
      <HeroSection influencer={influencer} />

      {/* Stats Row */}
      <div className="relative z-20 -mt-20 mb-8 max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            value={uniqueRestaurants} 
            label="Restaurants\nReviewed" 
          />
          <StatsCard 
            value={totalVideos} 
            label="Cities\nCovered" 
          />
          <StatsCard 
            value={formatNumberAbbreviated(influencer.subscriber_count)} 
            label="Subscribers" 
          />
          <StatsCard 
            value={getMostReviewedCuisine(listings || [])} 
            label="Most Reviewed" 
            isGradient 
            showBadge 
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 pt-8">
        {/* Profile Details */}
        <ProfileDetails influencer={influencer} />

        {/* Content Cards */}
        <div className="grid grid-cols-1 gap-6 mb-12">
          {/* Popular Videos Card */}
          <Card className="bg-white shadow-xl border-0">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Play className="w-6 h-6 text-red-500" />
                <h2 className="text-xl font-bold text-gray-900">
                  Popular Videos
                </h2>
              </div>
              <VideoSlider videos={videos} />
            </CardContent>
          </Card>

          {/* Signature Picks Card */}
          <SignaturePicksCard listings={listings || []} />

          {/* Trending Quote Card */}
          <TrendingQuoteCard 
            listing={mostRecentListing || undefined}
            loading={mostRecentLoading}
            error={mostRecentError}
            onRefetch={refetchMostRecent}
          />
        </div>

        {/* All Reviews */}
        <AllReviews listings={listings || []} />
      </div>
    </div>
  );
}
