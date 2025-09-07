'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function InsightsTab() {
  const trendingTopics = [
    { tag: 'Street Food', count: 234, trend: '+15%' },
    { tag: 'Vegan Options', count: 189, trend: '+28%' },
    { tag: 'Local Favorites', count: 156, trend: '+8%' },
    { tag: 'Fine Dining', count: 134, trend: '+12%' },
    { tag: 'Food Trucks', count: 98, trend: '+22%' }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>AI-powered analytics insights</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
            <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">📈 Growth Opportunity</h4>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Video engagement peaks during weekend evenings. Consider scheduling more content during these times.
            </p>
          </div>
          <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
            <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">🎯 Content Strategy</h4>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Asian cuisine videos have 40% higher engagement rates than other categories.
            </p>
          </div>
          <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
            <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">💡 Recommendation</h4>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              Collaborations between top influencers increase reach by an average of 180%.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trending Topics</CardTitle>
          <CardDescription>Popular content themes this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trendingTopics.map((topic, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">#{topic.tag}</Badge>
                  <span className="text-sm text-muted-foreground">{topic.count} mentions</span>
                </div>
                <span className="text-sm font-medium text-orange-600">{topic.trend}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}