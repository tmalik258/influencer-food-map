import { Suspense } from 'react';
import { ListingManagement } from './_components/listing-management';
import DashboardLoadingSkeleton from '@/app/dashboard/_components/dashboard-loading-skeleton';

export default function ListingsPage() {
  return (
    <div className="container mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Listing Management</h1>
        <p className="text-gray-600 mt-2">
          Manage restaurant listings and their associated influencer content
        </p>
      </div>
      
      <Suspense fallback={<DashboardLoadingSkeleton variant="management" />}>
        <ListingManagement />
      </Suspense>
    </div>
  );
}