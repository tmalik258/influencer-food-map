"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { Tag } from "@/types";
import { TagFilterDropdown } from "./tag-filter-dropdown";

interface RestaurantSearchFilterProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchType: string;
  setSearchType: (type: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  getSearchPlaceholder: (searchType: string) => string;
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  city?: string;
}

export function RestaurantSearchFilter({
  city,
  searchQuery,
  setSearchQuery,
  searchType,
  setSearchType,
  sortBy,
  setSortBy,
  getSearchPlaceholder,
  selectedTags,
  onTagsChange,
}: RestaurantSearchFilterProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 z-[10000]">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder={getSearchPlaceholder(searchType)}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={searchType} onValueChange={setSearchType}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Search by" />
          </SelectTrigger>
          <SelectContent className="z-[1000]">
            <SelectItem value="restaurant">Restaurant Name</SelectItem>
            <SelectItem value="influencer">Influencer Name</SelectItem>
            {/* <SelectItem value="video">Video Name</SelectItem> */}
            <SelectItem value="tags">Tags</SelectItem>
            <SelectItem value="city">City</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="z-[1000]">
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="rating">Rating</SelectItem>
            <SelectItem value="city">City</SelectItem>
          </SelectContent>
        </Select>
        <div className="w-full sm:w-64">
          <TagFilterDropdown
            city={city}
            selectedTags={selectedTags}
            onTagsChange={onTagsChange}
          />
        </div>
      </div>
    </div>
  );
}
