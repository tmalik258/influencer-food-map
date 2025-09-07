"use client";

import { useState, useEffect } from 'react';
import { Search, Filter, Plus, Edit, Trash2, Calendar, Hash } from 'lucide-react';
import { Tag } from '@/lib/types';
import { useTags } from '@/lib/hooks';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import LoadingSkeleton from '@/components/loading-skeleton';

export default function TagManagement() {
  const { tags, loading, error, fetchAllTags, searchTagsByName } = useTags();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');

  useEffect(() => {
    fetchAllTags();
  }, [fetchAllTags]);

  // Handle search
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchTerm.trim()) {
        searchTagsByName(searchTerm);
      } else {
        fetchAllTags();
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, searchTagsByName, fetchAllTags]);

  // Filter and sort tags
  const filteredAndSortedTags = tags
    .filter(tag => {
      if (filterBy === 'all') return true;
      // Add more filter options as needed
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  const handleEdit = (tag: Tag) => {
    // TODO: Implement edit functionality
    console.log('Edit tag:', tag);
  };

  const handleDelete = (tag: Tag) => {
    // TODO: Implement delete functionality
    console.log('Delete tag:', tag);
  };

  const handleCreate = () => {
    // TODO: Implement create functionality
    console.log('Create new tag');
  };

  if (loading && tags.length === 0) {
    return <LoadingSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-orange-600">
            <p>Error loading tags: {error}</p>
            <Button 
              onClick={() => fetchAllTags()} 
              className="mt-4"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="created_at">Created Date</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={handleCreate} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-2" />
          Add Tag
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tags.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Filtered Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredAndSortedTags.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Search Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {searchTerm.trim() ? 'Yes' : 'No'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tags Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Hash className="h-4 w-4" />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-32">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Created
                </div>
              </TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedTags.map((tag) => (
              <TableRow key={tag.id} className="hover:bg-muted/50">
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {tag.id}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-sm">
                    {tag.name}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(tag.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(tag)}
                      className="h-8 w-8 p-0 cursor-pointer"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(tag)}
                      className="h-8 w-8 p-0 cursor-pointer text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Empty State */}
      {filteredAndSortedTags.length === 0 && !loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground">
              {searchTerm.trim() ? (
                <>
                  <p className="text-lg mb-2">No tags found</p>
                  <p>Try adjusting your search terms</p>
                </>
              ) : (
                <>
                  <p className="text-lg mb-2">No tags available</p>
                  <p>Create your first tag to get started</p>
                  <Button 
                    onClick={handleCreate} 
                    className="mt-4 cursor-pointer"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tag
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}