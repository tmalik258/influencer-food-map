"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Listing } from "@/lib/types";

interface UseListingCardProps {
  listing: Listing;
}

export function useListingCard({ listing }: UseListingCardProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const router = useRouter();

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  const handleListingIdClick = () => {
    router.push(`/dashboard/listings/${listing.id}`);
  };

  const handleEditSuccess = () => {
    setIsEditMode(false);
    // The form will handle the refresh via router.refresh()
  };

  const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return null;
    
    const hours = Math.floor(timestamp / 3600);
    const minutes = Math.floor((timestamp % 3600) / 60);
    const seconds = timestamp % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return {
    isEditMode,
    toggleEditMode,
    handleListingIdClick,
    handleEditSuccess,
    formatTimestamp,
  };
}