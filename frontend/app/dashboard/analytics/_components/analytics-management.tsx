"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnalyticsHeader } from "./analytics-header";
import { AnalyticsMetrics } from "./analytics-metrics";
// import { OverviewTab } from "./overview-tab";
// import { EngagementTab } from "./engagement-tab";
import { PerformanceTab } from "./performance-tab";
import { InsightsTab } from "./insights-tab";
import { Users } from "lucide-react";

export function AnalyticsManagement() {
  const [timeRange, setTimeRange] = useState("7d");
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log("Exporting analytics data...");
  };

  return (
    <div className="space-y-6">
      <AnalyticsHeader
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        onRefresh={handleRefresh}
        onExport={handleExport}
        isLoading={isLoading}
      />

      <AnalyticsMetrics
        metrics={[
          {
            title: "Total Users",
            value: "1247",
            change: "+12%",
            trend: "up",
            icon: <Users className="h-4 w-4" />,
          },
          {
            title: "Total Listings",
            value: "892",
            change: "+12%",
            trend: "up",
            icon: <Users className="h-4 w-4" />,
          },
          {
            title: "Total Engagements",
            value: "5432",
            change: "+12%",
            trend: "up",
            icon: <Users className="h-4 w-4" />,
          },
        ]}
      />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* <OverviewTab userGrowthData={{
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [{
              label: 'User Growth',
              data: [10, 20, 30, 40, 50, 60, 70],
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            }]
          }} videoEngagementData={{
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [{
              label: 'Video Engagement',
              data: [10, 20, 30, 40, 50, 60, 70],
              backgroundColor: 'rgba(153, 102, 255, 0.2)',
              borderColor: 'rgba(153, 102, 255, 1)',
              borderWidth: 1
            }]
          }} topInfluencers={[
            {name: 'Influencer 1', engagements: 1000},
            {name: 'Influencer 2', engagements: 800},
            {name: 'Influencer 3', engagements: 600},
          ]} topRestaurants={[
            {name: 'Restaurant 1', engagements: 1000},
            {name: 'Restaurant 2', engagements: 800},
            {name: 'Restaurant 3', engagements: 600},
          ]} /> */}
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          {/* <EngagementTab /> */}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <PerformanceTab />
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <InsightsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
