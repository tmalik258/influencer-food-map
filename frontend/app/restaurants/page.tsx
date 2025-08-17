import { Suspense } from 'react';
import { RestaurantsContent } from './_components/restaurants-content';

export default function RestaurantsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-600"></div>
      </div>
    }>
      <RestaurantsContent />
    </Suspense>
  );
}