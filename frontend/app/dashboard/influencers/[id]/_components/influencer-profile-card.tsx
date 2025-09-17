"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Influencer } from "@/lib/types";

interface InfluencerProfileCardProps {
  influencer: Influencer;
}

export function InfluencerProfileCard({ influencer }: InfluencerProfileCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start space-x-4">
          {influencer.avatar_url && (
            <div className="relative w-20 h-20 rounded-full overflow-hidden flex-shrink-0">
              <Image
                src={influencer.avatar_url}
                alt={influencer.name}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1 space-y-2">
            <h3 className="text-xl font-semibold">{influencer.name}</h3>
            {influencer.bio && (
              <p className="text-muted-foreground">{influencer.bio}</p>
            )}
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <span>ID: {influencer.id}</span>
              <span>Created: {new Date(influencer.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}