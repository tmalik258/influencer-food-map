"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Filter, Tag, HandPlatter, ArrowDownUp } from "lucide-react";

interface RestaurantFiltersProps {
  searchTerm: string;
  selectedTag: string;
  selectedCuisine: string;
  sortBy: string;
  uniqueTags: string[];
  uniqueCuisines: string[];
  onSearchChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onCuisineChange: (value: string) => void;
  onSortChange: (value: string) => void;
  onAddNew: () => void;
}

export function RestaurantFilters({
  searchTerm,
  selectedTag,
  selectedCuisine,
  sortBy,
  uniqueTags,
  uniqueCuisines,
  onSearchChange,
  onTagChange,
  onCuisineChange,
  onSortChange,
  onAddNew
}: RestaurantFiltersProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 justify-between" role="search" aria-label="Restaurant filters">
      <div className="flex flex-col sm:flex-row flex-1 gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder="Search restaurants..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            aria-label="Search restaurants by name or address"
          />
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={selectedTag} onValueChange={onTagChange}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Filter by tag">
              <Tag className="h-4 w-4 mr-2" aria-hidden="true" />
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {uniqueTags.map(tag => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedCuisine} onValueChange={onCuisineChange}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Filter by cuisine">
              <HandPlatter className="h-4 w-4 mr-2" aria-hidden="true" />
              <SelectValue placeholder="Filter by cuisine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cuisines</SelectItem>
              {uniqueCuisines.map(cuisine => (
                <SelectItem key={cuisine} value={cuisine}>
                  {cuisine}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-full sm:w-40" aria-label="Sort restaurants">
              <ArrowDownUp className="h-4 w-4 mr-2" aria-hidden="true" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="city">City</SelectItem>
              <SelectItem value="updated">Last Updated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Button onClick={onAddNew} className="w-full sm:w-auto cursor-pointer" aria-label="Add new restaurant">
        <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
        Add Restaurant
      </Button>
    </div>
  );
}