'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, MapPin } from 'lucide-react';

import type { EngagementTabProps } from '@/lib/types';

export function EngagementTab({ topInfluencers, topRestaurants }: EngagementTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Influencers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Influencers
          </CardTitle>
          <CardDescription>Most engaging content creators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topInfluencers.map((influencer, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{influencer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      12M subscribers • 12K videos
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{influencer.engagement}% engagement</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Restaurants */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Top Restaurants
          </CardTitle>
          <CardDescription>Most featured restaurants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topRestaurants.map((restaurant, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{restaurant.name}</p>
                    <p className="text-sm text-muted-foreground">
                      120 videos • 12K views
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">⭐ 4.5</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}