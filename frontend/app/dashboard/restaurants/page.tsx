import { Suspense } from 'react';
import { RestaurantManagement } from './_components/restaurant-management';
import LoadingSkeleton from '@/components/loading-skeleton';
import { RestaurantLoading } from './_components/restaurant-loading';

export default function RestaurantsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Restaurant Management
        </h1>
        <p className="text-muted-foreground">
          Manage restaurants, view details, and perform CRUD operations
        </p>
      </div>
      
      <Suspense fallback={<RestaurantLoading count={6} />}>
        <RestaurantManagement />
      </Suspense>
    </div>
  );
}