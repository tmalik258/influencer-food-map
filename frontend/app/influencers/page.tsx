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
import { Search, Youtube, MapPin, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useInfluencers, useListings } from "@/lib/hooks";
import { Influencer } from "@/types";

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading influencers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center py-20">
            <p className="text-red-600">Error loading influencers: {influencersError || listingsError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Food Influencers
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Discover the food experts who are shaping culinary trends around the world
          </p>
          <div className="mt-6 flex justify-center items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{influencersWithStats.length} Influencers</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              <span>{new Set(influencersWithStats.map(i => i.region).filter(Boolean)).size} Regions</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Search influencers by name or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-lg"
            />
            {searchQuery && (
              <Button
                onClick={clearSearch}
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
              >
                ×
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-16 w-full mb-4" />
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 w-12" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredInfluencers.length === 0 ? (
          <Card className="max-w-md mx-auto">
            <CardContent className="py-12 text-center">
              <div className="mb-4">
                <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  {searchQuery ? `No influencers found matching "${searchQuery}"` : 'No influencers found.'}
                </p>
                {searchQuery && (
                  <Button
                    onClick={clearSearch}
                    variant="outline"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInfluencers.map((influencer: InfluencerWithStats) => {
              return (
                <Card key={influencer.id} className="overflow-hidden hover:shadow-xl transition-all duration-300 group border-0 shadow-lg">
                  <CardContent className="p-6">
                    {/* Avatar and basic info */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {influencer.avatar_url ? (
                          <Image
                            src={influencer.avatar_url}
                            alt={influencer.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500 text-white font-bold text-xl">
                            {influencer.name.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                          {influencer.name}
                        </h3>
                        {influencer.region && (
                          <div className="flex items-center gap-1 text-gray-600 text-sm mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{influencer.region}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bio */}
                    {influencer.bio && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {influencer.bio}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <Badge variant="outline" className="mb-2 bg-orange-50 text-orange-700 border-orange-200">
                          🏪 {influencer.uniqueRestaurants || 0}
                        </Badge>
                        <div className="text-xs text-gray-600">Restaurants</div>
                      </div>
                      <div className="text-center">
                        <Badge variant="outline" className="mb-2 bg-blue-50 text-blue-700 border-blue-200">
                          ⭐ {influencer.totalVideos || 0}
                        </Badge>
                        <div className="text-xs text-gray-600">Reviews</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link href={`/influencers/${influencer.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300">
                          View Profile
                        </Button>
                      </Link>
                      {influencer.youtube_channel_url && (
                        <Button asChild variant="outline" size="sm" className="hover:bg-red-50 hover:text-red-700 hover:border-red-300">
                          <a 
                            href={influencer.youtube_channel_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1"
                          >
                            <Youtube className="w-3 h-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}