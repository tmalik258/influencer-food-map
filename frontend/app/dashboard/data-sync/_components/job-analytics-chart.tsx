import React from 'react';

interface JobAnalyticsChartProps {
  data: any[]; // Replace 'any' with a more specific type if available
}

export function JobAnalyticsChart({ data }: JobAnalyticsChartProps) {
  return (
    <div className="w-full h-64 flex items-center justify-center bg-gray-100 rounded-lg">
      <p className="text-gray-500">Job Analytics Chart (Placeholder)</p>
    </div>
  );
}