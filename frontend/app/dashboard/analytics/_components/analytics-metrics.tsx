'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

import type { AnalyticsMetricsProps } from '@/lib/types';

export function AnalyticsMetrics({ metrics }: AnalyticsMetricsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
            {metric.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metric.value}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {metric.trend === 'up' ? (
                <TrendingUp className="h-3 w-3 mr-1 text-orange-500" />
              ) : (
                <TrendingDown className="h-3 w-3 mr-1 text-orange-500" />
              )}
              <span className={metric.trend === 'up' ? 'text-orange-500' : 'text-orange-500'}>
                {metric.change}
              </span>
              <span className="ml-1">from last period</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}