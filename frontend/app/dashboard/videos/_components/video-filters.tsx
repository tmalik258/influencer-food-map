'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';
import { useState, useEffect } from 'react';

import type { VideoFiltersProps } from '@/lib/types';

export function VideoFilters({
  searchTerm,
  setSearchTerm,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  hasListings,
  setHasListings,
  selectedInfluencer,
  setSelectedInfluencer
}: VideoFiltersProps) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // Debounce search term
  useEffect(() => {
    // Only update if the local term is different from the current search term
    if (localSearchTerm !== searchTerm) {
      const timer = setTimeout(() => {
        setSearchTerm(localSearchTerm);
      }, 400); // 400ms debounce delay
      
      return () => clearTimeout(timer);
    }
  }, [localSearchTerm, searchTerm, setSearchTerm]);

  return (
    <Card className="border-none shadow-none p-0">
      <CardContent className="space-y-4 p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search videos..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="pl-10 glass-effect backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          {/* Sort By */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full glass-effect backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 text-gray-900 dark:text-white">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="created_at">Created Date</SelectItem>
              <SelectItem value="published_at">Published Date</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Order */}
          <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
            <SelectTrigger className="w-full glass-effect backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 text-gray-900 dark:text-white">
              <SelectValue placeholder="Sort order" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="desc">Newest First</SelectItem>
              <SelectItem value="asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>

          {/* Influencer Filter */}
          <div className="relative">
            <Input
              placeholder="Filter by influencer..."
              value={selectedInfluencer}
              onChange={(e) => setSelectedInfluencer(e.target.value)}
              className="glass-effect backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>

          {/* Has Listings Filter */}
          <Select value={hasListings?.toString() || 'all'} onValueChange={(value) => {
            if (value === 'all') {
              setHasListings(undefined);
            } else {
              setHasListings(value === 'true');
            }
          }}>
            <SelectTrigger className="w-full glass-effect backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 border-orange-200 dark:border-orange-800 focus:border-orange-500 focus:ring-orange-500/20 text-gray-900 dark:text-white">
              <SelectValue placeholder="Filter by listings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Videos</SelectItem>
              <SelectItem value="true">With Listings</SelectItem>
              <SelectItem value="false">Without Listings</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}