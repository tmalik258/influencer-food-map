"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Youtube, MapPin, Users, Star, Award, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useInfluencers, useListings } from "@/lib/hooks";
import { Influencer } from "@/types";
import { formatNumberAbbreviated } from "@/lib/utils/number-formatter";
import ErrorCard from "@/components/error-card";

interface InfluencerWithStats extends Influencer {
  totalVideos: number;
  uniqueRestaurants: number;
}

export default function InfluencersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredInfluencers, setFilteredInfluencers] = useState<InfluencerWithStats[]>([]);
  const [influencersWithStats, setInfluencersWithStats] = useState<InfluencerWithStats[]>([]);
  
  const { influencers, loading: influencersLoading, error: influencersError, fetchInfluencers } = useInfluencers();
  const { listings, loading: listingsLoading, error: listingsError, fetchListings } = useListings();

  const handleRefresh = () => {
    fetchInfluencers({ limit: 50 });
    fetchListings({ limit: 200, approved_status: 'Approved' });
  };

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchInfluencers({ limit: 50 });
        await fetchListings({ limit: 200, approved_status: 'Approved' });
      } catch (error) {
        console.error('Error loading influencers data:', error);
      }
    };

    loadData();
  }, [fetchInfluencers, fetchListings]);

  // Calculate stats for each influencer
  useEffect(() => {
    if (influencers.length > 0 && listings.length > 0) {
      const statsData = influencers.map(influencer => {
        const influencerListings = listings.filter(listing => listing.influencer.id === influencer.id);
        const uniqueRestaurants = new Set(influencerListings.map(listing => listing.restaurant.id)).size;
        
        return {
          ...influencer,
          totalVideos: influencerListings.length,
          uniqueRestaurants
        };
      });
      
      setInfluencersWithStats(statsData);
      setFilteredInfluencers(statsData as InfluencerWithStats[]);
    }
  }, [influencers, listings]);

  // Filter influencers based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredInfluencers(influencersWithStats);
    } else {
      const filtered = influencersWithStats.filter(influencer =>
        influencer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (influencer.region && influencer.region.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredInfluencers(filtered);
    }
  }, [searchQuery, influencersWithStats]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  const isLoading = influencersLoading || listingsLoading;
  const hasError = influencersError || listingsError;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-2">
      {/* Hero Section */}
      <div className="relative min-h-[60vh] flex items-center justify-center overflow-hidden pt-20 rounded-lg">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/hero-influencer.jpg"
            alt="Food influencers background"
            fill
            className="object-cover"
            priority
          />
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/70"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          {isLoading ? (
            <>
              <Skeleton className="h-16 w-96 mx-auto mb-6 bg-white/10" />
              <Skeleton className="h-8 w-[600px] mx-auto mb-8 bg-white/10" />
              <div className="flex justify-center items-center gap-8 mb-8">
                <Skeleton className="h-6 w-40 bg-white/10" />
                <Skeleton className="h-6 w-32 bg-white/10" />
                <Skeleton className="h-6 w-36 bg-white/10" />
              </div>
            </>
          ) : (
            <>
              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Food Influencers
              </h1>
              <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
                Discover the culinary experts who are shaping food trends and inspiring millions of food lovers worldwide
              </p>
              
              {/* Enhanced Stats */}
              <div className="flex flex-wrap justify-center items-center gap-8 mb-8">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                  <Users className="w-5 h-5 text-orange-400" />
                  <span className="text-white font-semibold">{influencersWithStats.length} Influencers</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                  <Globe className="w-5 h-5 text-orange-400" />
                  <span className="text-white font-semibold">{new Set(influencersWithStats.map(i => i.region).filter(Boolean)).size} Regions</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full border border-white/20">
                  <Award className="w-5 h-5 text-orange-400" />
                  <span className="text-white font-semibold">{influencersWithStats.reduce((sum, inf) => sum + inf.totalVideos, 0)} Reviews</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-16 -mt-8 relative z-10">

        {/* Enhanced Search Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 border border-gray-100">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Meet Our Food Experts</h2>
            <p className="text-gray-600">Search through our curated collection of culinary influencers</p>
          </div>
          
          {isLoading ? (
            <Skeleton className="h-14 w-full rounded-xl" />
          ) : (
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search by name, region, or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-12 py-4 text-lg border-2 border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 rounded-xl bg-gray-50 hover:bg-white transition-all duration-200"
                />
                {searchQuery && (
                  <Button
                    onClick={clearSearch}
                    variant="ghost"
                    size="sm"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                  >
                    ×
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {isLoading ? (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="overflow-hidden hover:shadow-2xl transition-all duration-500 group border-0 shadow-lg hover:-translate-y-2 py-0">
                  <CardContent className="p-4">
                    {/* Card Header with Banner - Updated to match new design */}
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
              ))}
            </div>
          </div>
        ) : hasError ? (
          <ErrorCard
            title="Something went wrong"
            message="We&apos;re having trouble loading the influencers. Please try again later."
            error={influencersError || listingsError || undefined}
            onRefresh={handleRefresh}
          />
        ) : filteredInfluencers.length === 0 ? (
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
        ) : (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredInfluencers.map((influencer: InfluencerWithStats) => {
                return (
                  <Card key={influencer.id} className="overflow-hidden hover:shadow-2xl transition-all duration-500 group border-0 shadow-lg hover:-translate-y-2 py-0 h-full flex flex-col">
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
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}