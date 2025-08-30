'use client';

import React from 'react';
import { Restaurant } from '@/lib/types';
import dynamic from 'next/dynamic';

interface RestaurantMapProps {
  restaurants: (Restaurant | null)[];
  selectedRestaurant?: (Restaurant | null);
  onRestaurantSelect?: (restaurant: (Restaurant | null)) => void;
  className?: string;
}

// Dynamic import of the actual map component to avoid SSR issues
const DynamicMapComponent = dynamic(() => import('@/components/restaurant-map-client'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse rounded-xl bg-slate-200 h-96 w-full">
      <div className="h-full w-full bg-gradient-to-br from-slate-100 to-gray-200"></div>
    </div>
  ),
});

const RestaurantMap: React.FC<RestaurantMapProps> = (props) => {
  return <DynamicMapComponent {...props} />;
};

export default RestaurantMap;