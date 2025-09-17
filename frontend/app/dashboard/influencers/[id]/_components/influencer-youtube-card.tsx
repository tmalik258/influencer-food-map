"use client";

import Link from "next/link";
import { Video, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Influencer } from "@/lib/types";
import { formatNumberAbbreviated } from "@/lib/utils/number-formatter";

interface InfluencerYouTubeCardProps {
  influencer: Influencer;
}

export function InfluencerYouTubeCard({ influencer }: InfluencerYouTubeCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Video className="h-5 w-5" />
          <span>YouTube Channel</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Channel ID
            </label>
            <p className="font-mono text-sm bg-muted p-2 rounded">
              {influencer.youtube_channel_id}
            </p>
          </div>
          {influencer.youtube_channel_url && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Channel URL
              </label>
              <div className="flex items-center space-x-2">
                <p className="text-sm truncate">{influencer.youtube_channel_url}</p>
                <Link
                  href={influencer.youtube_channel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="ghost" size="sm" className="cursor-pointer">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
        {influencer.subscriber_count && (
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Subscribers
            </label>
            <p className="text-lg font-semibold">
              {formatNumberAbbreviated(influencer.subscriber_count)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}