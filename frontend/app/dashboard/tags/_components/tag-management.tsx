"use client";

import { useState, useEffect } from 'react';
import { Edit, Trash2, Calendar, Hash } from 'lucide-react';
import { Tag } from '@/lib/types';
import { useTags } from '@/lib/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import DashboardLoadingSkeleton from '@/app/dashboard/_components/dashboard-loading-skeleton';
import TagHeader from './tag-header';
import TagCreateForm from './tag-create-form';

import TagDeleteDialog from './tag-delete-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

export default function TagManagement() {
  const { tags, loading, error, fetchAllTags, searchTagsByName } = useTags();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterBy, setFilterBy] = useState('all');

  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const router = useRouter();

  const refreshTags = () => {
    fetchAllTags();
    setIsCreateFormOpen(false);
    setIsDeleteDialogOpen(false);
    setSelectedTag(null);
  };

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
    router.push(`/dashboard/tags/${tag.id}`);
  };

  const handleDelete = (tag: Tag) => {
    setSelectedTag(tag);
    setIsDeleteDialogOpen(true);
  };

  const handleCreate = () => {
    setIsCreateFormOpen(true);
  };

  if (loading && tags.length === 0) {
    return <DashboardLoadingSkeleton variant="management" />;
  }

  if (error) {
    return (
      <Card className="glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30">
        <CardContent className="p-6">
          <div className="text-center text-orange-600 dark:text-orange-400">
            <p>Error loading tags: {error}</p>
            <Button 
              onClick={() => fetchAllTags()} 
              className="mt-4 bg-orange-600 hover:bg-orange-700 border-orange-500 focus:ring-orange-500 focus:border-orange-500"
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
    <div className="space-y-6 dark:bg-black rounded-lg p-6">
      <TagHeader
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          sortBy={sortBy}
          setSortBy={setSortBy}
          onOpenCreateForm={handleCreate}
        />

      {/* Stats */}
      {/* <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 hover:border-orange-500/50 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Total Tags
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{tags.length}</div>
          </CardContent>
        </Card>
        
        <Card className="glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 hover:border-orange-500/50 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Filtered Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{filteredAndSortedTags.length}</div>
          </CardContent>
        </Card>
        
        <Card className="glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 hover:border-orange-500/50 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Search Active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {searchTerm.trim() ? 'Yes' : 'No'}
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Tags Table */}
      <Card className="glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Hash className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-32">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  Created
                </div>
              </TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedTags.map((tag) => (
              <TableRow key={tag.id} className="hover:bg-orange-50/50 dark:hover:bg-orange-900/20 transition-colors duration-200">
                <TableCell className="font-mono text-xs text-gray-500 dark:text-gray-400">
                  {tag.id}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-sm">
                    {tag.name}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-600 dark:text-gray-300">
                  {new Date(tag.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(tag)}
                      className="cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:text-orange-600 dark:hover:text-orange-400 transition-colors duration-200"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <TagDeleteDialog
                      tagId={tag.id}
                      tagName={tag.name}
                      onSuccess={refreshTags}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Create Tag Dialog */}
      <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
        <DialogContent className="sm:max-w-[425px] glass-effect backdrop-blur-xl bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Create New Tag</DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-300">
              Fill in the details below to create a new tag.
            </DialogDescription>
          </DialogHeader>
          <TagCreateForm onSuccess={refreshTags} />
        </DialogContent>
      </Dialog>



      {/* Delete Tag Dialog (handled within TagDeleteDialog component) */}
    </div>
  );
}