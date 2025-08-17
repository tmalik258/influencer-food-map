'use client';

import dynamicImport from 'next/dynamic';

const RestaurantMap = dynamicImport(() => import('@/components/restaurant-map-wrapper'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96 bg-gray-100 rounded-xl">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
    </div>
  ),
});

export default RestaurantMap;