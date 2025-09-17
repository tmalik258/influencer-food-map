"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useInfluencer } from "@/lib/hooks";
import { useAdminInfluencer } from "@/lib/hooks/useAdminInfluencer";
import { useAdminAuth } from "@/lib/hooks/useAdminAuth";
import { InfluencerProfileCard } from "./_components/influencer-profile-card";
import { InfluencerYouTubeCard } from "./_components/influencer-youtube-card";
import { InfluencerStatsCard } from "./_components/influencer-stats-card";
import { InfluencerActionsCard } from "./_components/influencer-actions-card";
import { EditInfluencerModal } from "./_components/edit-influencer-modal";
import { DeleteInfluencerModal } from "./_components/delete-influencer-modal";

export default function AdminInfluencerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAdminAuth();
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const influencerId = params.id as string;
  const { influencer, loading, error, refetch } = useInfluencer(influencerId);
  const { updateInfluencer, deleteInfluencer } = useAdminInfluencer();

  const handleEditSuccess = async () => {
    setIsEditModalOpen(false);
    await refetch();
  };

  const handleDeleteSuccess = () => {
    setIsDeleteModalOpen(false);
    router.push("/dashboard/influencers");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-10 w-20" />
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-destructive">Error Loading Influencer</h2>
          <p className="text-muted-foreground">{error || "Failed to load influencer details"}</p>
          <Button onClick={() => refetch()} className="cursor-pointer">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!influencer) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Influencer Not Found</h2>
          <p className="text-muted-foreground">The requested influencer could not be found.</p>
          <Button onClick={() => router.push("/dashboard/influencers")} className="cursor-pointer">
            Back to Influencers
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{influencer.name}</h1>
            <p className="text-muted-foreground">Influencer Details</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <InfluencerProfileCard influencer={influencer} />
          <InfluencerYouTubeCard influencer={influencer} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <InfluencerStatsCard influencer={influencer} />
          <InfluencerActionsCard 
            influencer={influencer}
            onEdit={() => setIsEditModalOpen(true)}
            onDelete={() => setIsDeleteModalOpen(true)}
          />
        </div>
      </div>

      {/* Modals */}
      <EditInfluencerModal
        influencer={influencer}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
      />
      <DeleteInfluencerModal
        influencer={influencer}
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}