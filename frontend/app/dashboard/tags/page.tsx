import { Suspense } from 'react';
import DashboardLoadingSkeleton from '@/app/dashboard/_components/dashboard-loading-skeleton';
import { TagManagement } from './_components/tag-management';

export default function TagsPage() {
  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tag Management</h1>
        <p className="text-gray-600 mt-2">
          Manage and organize tags used throughout the platform
        </p>
      </div>
      
      <Suspense fallback={<DashboardLoadingSkeleton variant="management" />}>
        <TagManagement />
      </Suspense>
    </div>
  );
}