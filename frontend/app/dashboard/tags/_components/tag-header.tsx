"use client";

import { Search, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TagHeaderProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  onOpenCreateForm: () => void;
}

export default function TagHeader({
  searchTerm, setSearchTerm, sortBy, setSortBy, onOpenCreateForm
}: TagHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between">
      <div className="flex flex-1 gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500"
          />
        </div>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40 glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="created_at">Created Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={onOpenCreateForm} className="ml-auto cursor-pointer bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 focus:border-orange-500">
        <PlusCircle className="h-4 w-4 mr-2" />
        Add Tag
      </Button>
    </div>
  );
}