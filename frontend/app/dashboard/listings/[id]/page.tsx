import { Suspense } from 'react';
import { ListingDetailView } from './_components/listing-detail-view';
import DashboardLoadingSkeleton from '@/app/dashboard/_components/dashboard-loading-skeleton';

interface ListingDetailPageProps {
  params: {
    id: string;
  };
}

export default function ListingDetailPage({ params }: ListingDetailPageProps) {
  return (
    <div className="container mx-auto py-6">
      <Suspense fallback={<DashboardLoadingSkeleton variant="detail" />}>
        <ListingDetailView listingId={params.id} />
      </Suspense>
    </div>
  );
}