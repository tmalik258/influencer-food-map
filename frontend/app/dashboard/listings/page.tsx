import { Suspense } from 'react';
import { ListingManagement } from './_components/listing-management';
import LoadingSkeleton from '@/components/loading-skeleton';

export default function ListingsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Listing Management</h1>
        <p className="text-gray-600 mt-2">
          Manage restaurant listings and their associated influencer content
        </p>
      </div>
      
      <Suspense fallback={<LoadingSkeleton />}>
        <ListingManagement />
      </Suspense>
    </div>
  );
}