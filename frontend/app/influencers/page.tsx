'use client';

import { useState, useEffect } from 'react';

// Force dynamic rendering to avoid prerendering issues
export const dynamic = 'force-dynamic';
import { useInfluencers, useListings } from '@/lib/hooks';
import { Influencer } from '@/types';
import { MapPin, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function InfluencersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInfluencers, setFilteredInfluencers] = useState<Influencer[]>([]);
  
  const { influencers, loading: influencersLoading, error: influencersError, fetchInfluencers } = useInfluencers();
  const { listings, loading: listingsLoading, fetchListings } = useListings();
  
  const loading = influencersLoading || listingsLoading;
  const error = influencersError;

  useEffect(() => {
    fetchInfluencers();
    fetchListings();
  }, [fetchInfluencers, fetchListings]);

  useEffect(() => {
    // Filter influencers based on search term
    if (searchTerm.trim() === '') {
      setFilteredInfluencers(influencers);
    } else {
      const filtered = influencers.filter(influencer =>
        influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (influencer.region && influencer.region.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredInfluencers(filtered);
    }
  }, [searchTerm, influencers]);

  const getInfluencerStats = (influencerId: string) => {
    const influencerListings = listings.filter(
      listing => listing.influencer.id === influencerId
    );
    const uniqueRestaurants = new Set(influencerListings.map(listing => listing.restaurant.id));
    return {
      totalListings: influencerListings.length,
      uniqueRestaurants: uniqueRestaurants.size
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading influencers...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button asChild variant="outline">
              <Link href="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go back to home
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Badge variant="secondary">👥 INFLUENCERS</Badge>
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Food Influencers</h1>
          <p className="text-slate-600 mb-6 text-lg">
            Discover food influencers and their restaurant recommendations
          </p>
          
          {/* Search Bar */}
          <div className="max-w-md">
            <Input
              type="text"
              placeholder="Search influencers by name or region..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <Badge variant="outline">
            {filteredInfluencers.length} influencer{filteredInfluencers.length !== 1 ? 's' : ''} found
          </Badge>
        </div>

        {filteredInfluencers.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="py-8">
              <p className="text-slate-600 mb-4">
                {searchTerm ? `No influencers found matching "${searchTerm}"` : 'No influencers found.'}
              </p>
              {searchTerm && (
                <Button
                  onClick={() => setSearchTerm('')}
                  variant="outline"
                >
                  Clear search
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInfluencers.map((influencer) => {
              const stats = getInfluencerStats(influencer.id);
              
              return (
                <Card key={influencer.id} className="influencer-card overflow-hidden h-full flex flex-col">
                  {/* Influencer Header */}
                  <CardContent className="p-6 text-center flex-1 flex flex-col">
                    {influencer.avatar_url ? (
                      <Image
                        src={influencer.avatar_url}
                        alt={influencer.name}
                        width={80}
                        height={80}
                        className="rounded-full mx-auto mb-4"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gradient-to-r from-slate-600 to-slate-800 flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
                        {influencer.name.charAt(0)}
                      </div>
                    )}
                    
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{influencer.name}</h3>
                    
                    {influencer.region && (
                      <div className="flex items-center justify-center text-slate-600 mb-3">
                        <MapPin className="w-4 h-4 mr-1" />
                        <Badge variant="secondary" className="text-xs">
                          {influencer.region}
                        </Badge>
                      </div>
                    )}
                    
                    <div className="flex-1">
                      {influencer.bio && (
                        <p className="text-slate-600 text-sm line-clamp-3 mb-4">
                          {influencer.bio}
                        </p>
                      )}
                    </div>
                  
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-slate-200">
                      <div className="text-center">
                        <Badge variant="outline" className="mb-2">
                          🏪 {stats.uniqueRestaurants}
                        </Badge>
                        <div className="text-xs text-slate-600">Restaurants</div>
                      </div>
                      <div className="text-center">
                        <Badge variant="outline" className="mb-2">
                          ⭐ {stats.totalListings}
                        </Badge>
                        <div className="text-xs text-slate-600">Reviews</div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 mt-auto">
                      <Button asChild className="flex-1">
                        <Link href={`/influencers/${influencer.id}`}>
                          View Profile
                        </Link>
                      </Button>
                      
                      {influencer.youtube_channel_url && (
                        <Button asChild variant="outline" size="icon">
                          <a
                            href={influencer.youtube_channel_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Visit YouTube Channel"
                          >
                            <ExternalLink className="w-4 h-4" />
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