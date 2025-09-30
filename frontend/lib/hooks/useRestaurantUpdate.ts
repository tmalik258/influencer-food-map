"use client";

import { useState } from "react";
import { toast } from "sonner";
import { restaurantActions } from "@/lib/actions/restaurant-actions";
import { Restaurant } from "@/lib/types";

interface UseRestaurantUpdateProps {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useRestaurantUpdate({ onSuccess, onError }: UseRestaurantUpdateProps = {}) {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateRestaurant = async (id: string, data: Partial<Restaurant>): Promise<Restaurant | null> => {
    setIsUpdating(true);
    
    try {
      const updatedRestaurant = await restaurantActions.updateRestaurant(id, data);
      
      toast.success("Restaurant details updated successfully");
      
      if (onSuccess) {
        onSuccess();
      }
      
      return updatedRestaurant;
    } catch (error) {
      console.error("Error updating restaurant:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to update restaurant details";
      toast.error(errorMessage);
      
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }
      
      return null;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateRestaurant,
    isUpdating,
  };
}