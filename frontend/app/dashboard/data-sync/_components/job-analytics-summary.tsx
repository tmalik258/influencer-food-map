import React from 'react';

interface JobAnalyticsSummaryProps {
  data: any; // Replace 'any' with a more specific type if available
}

export function JobAnalyticsSummary({ data }: JobAnalyticsSummaryProps) {
  return (
    <div className="w-full p-4 bg-gray-100 rounded-lg">
      <h3 className="text-lg font-semibold mb-2">Job Analytics Summary (Placeholder)</h3>
      <pre className="text-sm bg-gray-200 p-2 rounded">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}