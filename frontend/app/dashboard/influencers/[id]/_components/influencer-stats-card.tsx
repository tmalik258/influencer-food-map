"use client";

import { MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Influencer } from "@/lib/types";
import { formatNumberAbbreviated } from "@/lib/utils/number-formatter";

interface InfluencerStatsCardProps {
  influencer: Influencer;
}

export function InfluencerStatsCard({ influencer }: InfluencerStatsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Listings</span>
          </div>
          <Badge variant="secondary">
            {influencer.listings?.length || 0}
          </Badge>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Subscribers</span>
          </div>
          <Badge variant="secondary">
            {influencer.subscriber_count
              ? formatNumberAbbreviated(influencer.subscriber_count)
              : "N/A"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}