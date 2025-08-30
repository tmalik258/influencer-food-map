"use client";

import { useState, useMemo } from "react";
import { useInfluencersPaginated } from "@/lib/hooks";
import InfluencersHero from "./influencers-hero";
import InfluencersSearch from "./influencers-search";
import InfluencersGrid from "./influencers-grid";
import InfluencersPagination from "./influencers-pagination";

export default function InfluencersContent() {
  const [searchQuery, setSearchQuery] = useState("");
  
  const {
    influencers,
    loading,
    error,
    page,
    totalPages,
    goToPage,
    setSearchQuery: updateSearchQuery,
    refetch
  } = useInfluencersPaginated({
    limit: 12
  });

  // Calculate stats for each influencer using embedded listings
  const influencersWithStats = useMemo(() => {
    return influencers.map(influencer => {
      const listings = influencer.listings || [];
      const uniqueRestaurants = new Set(listings.map(listing => listing.restaurant?.id)).size;
      
      return {
        ...influencer,
        totalVideos: listings.length,
        uniqueRestaurants
      };
    });
  }, [influencers]);

  // Handle search with debouncing
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    updateSearchQuery(query);
  };

  // For display purposes, we'll show all influencers since filtering is now handled by the API
  const filteredInfluencers = influencersWithStats;

  const clearSearch = () => {
    setSearchQuery('');
    updateSearchQuery('');
  };

  const handleRefresh = () => {
    refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-2">
      <InfluencersHero 
        loading={loading}
        influencersWithStats={influencersWithStats}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-16 -mt-8 relative z-10">
        <InfluencersSearch 
          searchQuery={searchQuery}
          setSearchQuery={handleSearch}
          clearSearch={clearSearch}
          loading={loading}
        />
        
        <InfluencersGrid 
          loading={loading}
          error={error}
          filteredInfluencers={filteredInfluencers}
          searchQuery={searchQuery}
          clearSearch={clearSearch}
          onRefresh={handleRefresh}
        />
        
        <InfluencersPagination 
          currentPage={page}
          totalPages={totalPages}
          onPageChange={goToPage}
          loading={loading}
        />
      </div>
    </div>
  );
}