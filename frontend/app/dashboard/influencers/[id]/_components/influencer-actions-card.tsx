"use client";

import Link from "next/link";
import { ExternalLink, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Influencer } from "@/lib/types";

interface InfluencerActionsCardProps {
  influencer: Influencer;
  onEdit: () => void;
  onDelete: () => void;
}

export function InfluencerActionsCard({ influencer, onEdit, onDelete }: InfluencerActionsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Link href={`/influencers/${influencer.id}`} target="_blank">
          <Button variant="outline" className="w-full cursor-pointer">
            <ExternalLink className="h-4 w-4 mr-2" />
            View Public Profile
          </Button>
        </Link>
        <Button
          variant="outline"
          className="w-full cursor-pointer"
          onClick={onEdit}
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Influencer
        </Button>
        <Button
          variant="destructive"
          className="w-full cursor-pointer"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete Influencer
        </Button>
      </CardContent>
    </Card>
  );
}