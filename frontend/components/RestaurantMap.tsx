'use client';

import React from 'react';
import { Restaurant } from '@/types';
import dynamic from 'next/dynamic';

interface RestaurantMapProps {
  restaurants: Restaurant[];
  selectedRestaurant?: Restaurant | null;
  onRestaurantSelect?: (restaurant: Restaurant | null) => void;
  className?: string;
}

// Dynamic import of the actual map component to avoid SSR issues
const DynamicMapComponent = dynamic(() => import('./RestaurantMapClient'), {
  ssr: false,
  loading: () => (
    <div className="bg-gradient-to-br from-slate-100 to-gray-200 rounded-xl border-2 border-dashed border-slate-300 flex items-center justify-center h-96">
      <div className="text-center p-8">
        <div className="w-12 h-12 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-600 font-medium">Loading map...</p>
      </div>
    </div>
  ),
});

const RestaurantMap: React.FC<RestaurantMapProps> = (props) => {
  return <DynamicMapComponent {...props} />;
};

export default RestaurantMap;