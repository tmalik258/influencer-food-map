'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { CuisineEditForm } from './cuisine-edit-form';
import { CuisineDeleteDialog } from './cuisine-delete-dialog';
import DashboardLoadingSkeleton from '@/app/dashboard/_components/dashboard-loading-skeleton';
import { toast } from 'sonner';
import axios from 'axios';

interface Cuisine {
  id: string;
  name: string;
  created_at: string;
}

interface CuisineDetailViewProps {
  cuisineId: string;
}

export function CuisineDetailView({ cuisineId }: CuisineDetailViewProps) {
  const router = useRouter();
  const [cuisine, setCuisine] = useState<Cuisine | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchCuisine();
  }, [cuisineId]);

  const fetchCuisine = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/cuisines/${cuisineId}`);
      setCuisine(response.data);
    } catch (error) {
      console.error('Error fetching cuisine:', error);
      toast.error('Failed to load cuisine details');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuccess = (updatedCuisine: Cuisine) => {
    setCuisine(updatedCuisine);
    setIsEditMode(false);
    toast.success('Cuisine updated successfully');
  };

  const handleDeleteSuccess = () => {
    toast.success('Cuisine deleted successfully');
    router.push('/dashboard/cuisines');
  };

  if (loading) {
    return <DashboardLoadingSkeleton variant="detail" />;
  }

  if (!cuisine) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400">Cuisine not found</p>
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/cuisines')}
          className="mt-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cuisines
        </Button>
      </div>
    );
  }

  if (isEditMode) {
    return (
      <CuisineEditForm
        cuisine={cuisine}
        onSuccess={handleEditSuccess}
        onCancel={() => setIsEditMode(false)}
      />
    );
  }

  return (
    <div className="space-y-6 glass-effect backdrop-blur-xl bg-white/80 p-6 rounded-lg border border-orange-200/50 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          onClick={() => router.push('/dashboard/cuisines')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cuisines
        </Button>
        <div className="flex gap-2">
          <Button onClick={() => setIsEditMode(true)} className="bg-orange-600 hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
            <Edit className="mr-2 h-4 w-4 text-white" />
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

      {/* Cuisine Details */}
      <Card className="glass-effect backdrop-blur-xl bg-white/80 border border-orange-200/50 shadow-xl">
        <CardHeader>
          <CardTitle className="text-2xl text-gray-900 dark:text-gray-100">{cuisine.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Basic Information</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Cuisine ID</p>
                    <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">{cuisine.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Name</p>
                    <p className="text-gray-600 dark:text-gray-400">{cuisine.name}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Metadata</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Created</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {new Date(cuisine.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Dialog */}
      <CuisineDeleteDialog
        cuisine={cuisine}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}