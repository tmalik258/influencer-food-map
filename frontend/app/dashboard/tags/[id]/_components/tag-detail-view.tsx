'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Trash2, Tag } from 'lucide-react';
import { TagEditForm } from './tag-edit-form';
import { TagDeleteDialog } from './tag-delete-dialog';
import DashboardLoadingSkeleton from '@/app/dashboard/_components/dashboard-loading-skeleton';
import { toast } from 'sonner';
import axios from 'axios';

interface Tag {
  id: string;
  name: string;
  created_at: string;
}

interface TagDetailViewProps {
  tagId: string;
}

export function TagDetailView({ tagId }: TagDetailViewProps) {
  const router = useRouter();
  const [tag, setTag] = useState<Tag | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchTag();
  }, [tagId]);

  const fetchTag = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/tags/${tagId}`);
      setTag(response.data);
    } catch (error) {
      console.error('Error fetching tag:', error);
      toast.error('Failed to load tag details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuccess = (updatedTag: Tag) => {
    setTag(updatedTag);
    setIsEditMode(false);
    toast.success('Tag updated successfully');
  };

  const handleDeleteSuccess = () => {
    toast.success('Tag deleted successfully');
    router.push('/dashboard/tags');
  };

  if (loading) {
    return <DashboardLoadingSkeleton variant="detail" />;
  }

  if (!tag) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Tag not found</p>
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/tags')}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tags
        </Button>
      </div>
    );
  }

  if (isEditMode) {
    return (
      <TagEditForm
        tag={tag}
        onSuccess={handleEditSuccess}
        onCancel={() => setIsEditMode(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/tags')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Tags
        </Button>
        <div className="flex gap-2">
          <Button onClick={() => setIsEditMode(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Tag Details */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Tag className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">{tag.name}</CardTitle>
              <p className="text-muted-foreground">Tag Details</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Tag Preview */}
          <div>
            <h3 className="font-semibold mb-2">Tag Preview</h3>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              <Tag className="mr-1 h-3 w-3" />
              {tag.name}
            </Badge>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Basic Information</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Tag ID</p>
                    <p className="text-muted-foreground font-mono text-sm">{tag.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Name</p>
                    <p className="text-muted-foreground">{tag.name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Metadata</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium">Created</p>
                    <p className="text-muted-foreground">
                      {new Date(tag.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Usage Information */}
          <div>
            <h3 className="font-semibold mb-2">Usage</h3>
            <p className="text-muted-foreground">
              This tag can be used to categorize and organize content such as videos, restaurants, or other entities. 
              Tags help with filtering, searching, and content discovery throughout the application.
            </p>
          </div>

          {/* Additional Features */}
          <div>
            <h3 className="font-semibold mb-2">Features</h3>
            <ul className="text-muted-foreground space-y-1">
              <li>• Can be associated with multiple content types</li>
              <li>• Enables advanced filtering and search capabilities</li>
              <li>• Supports content categorization and organization</li>
              <li>• Improves content discoverability</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <TagDeleteDialog
        tag={tag}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}