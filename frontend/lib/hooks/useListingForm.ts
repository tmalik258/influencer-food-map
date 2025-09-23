"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { listingActions } from "@/lib/actions/listing-actions";
import {
  createListingSchema,
  editListingSchema,
  CreateListingFormData,
  EditListingFormData,
} from "@/lib/validations/listing-create";
import { Listing } from "@/lib/types/dashboard";

interface UseListingFormProps {
  mode: 'create' | 'edit';
  listingData?: Listing;
  onSuccess?: () => void;
}

export function useListingForm({
  mode,
  listingData,
  onSuccess,
}: UseListingFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Use appropriate schema based on mode
  const schema = mode === 'create' ? createListingSchema : editListingSchema;
  
  const form = useForm<CreateListingFormData | EditListingFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      restaurant_id: "",
      video_id: "",
      influencer_id: "",
      quotes: [],
      context: [],
      confidence_score: 0,
      approved: false,
      timestamp: 0,
      ...(mode === 'edit' && { visit_date: undefined }),
    },
  });

  // Pre-populate form fields when in edit mode
  useEffect(() => {
    if (mode === 'edit' && listingData) {
      const quotesArray = listingData.quotes 
        ? listingData.quotes.filter(quote => quote.trim() !== '')
        : [];
      
      const contextArray = listingData.context 
        ? listingData.context?.filter(context => context.trim() !== '')
        : [];

      form.reset({
        restaurant_id: listingData.restaurant_id,
        video_id: listingData.video_id,
        influencer_id: listingData.influencer_id,
        visit_date: listingData.visit_date ? new Date(listingData.visit_date) : undefined,
        quotes: quotesArray,
        context: contextArray,
        confidence_score: listingData.confidence_score,
        approved: listingData.approved,
        timestamp: listingData.timestamp ? Number(listingData.timestamp) : 0,
      });
    }
  }, [mode, listingData, form]);

  const handleSubmit = async (data: CreateListingFormData | EditListingFormData) => {
    setIsLoading(true);
    try {
      if (mode === 'create') {
        // Remove visit_date from data if it's undefined (let backend set it)
        const { visit_date, ...createData } = data as CreateListingFormData;
        const submitData = visit_date ? { ...createData, visit_date } : createData;
        await listingActions.createListing(submitData);
        toast.success("Listing created successfully!");
        form.reset();
      } else {
        if (!listingData?.id) {
          throw new Error("Listing ID is required for update");
        }
        await listingActions.updateListing(listingData.id, data as EditListingFormData);
        toast.success("Listing updated successfully!");
      }

      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'creating' : 'updating'} listing:`, error);
      toast.error(`Failed to ${mode === 'create' ? 'create' : 'update'} listing. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (mode === 'create') {
      form.reset();
    } else {
      // In edit mode, reset to original values
      if (listingData) {
        const quotesArray = listingData.quotes 
          ? listingData.quotes.filter(quote => quote.trim() !== '')
          : [];
        
        const contextArray = listingData.context 
          ? listingData.context.filter(context => context.trim() !== '')
          : [];

        form.reset({
          restaurant_id: listingData.restaurant_id,
          video_id: listingData.video_id,
          influencer_id: listingData.influencer_id,
          visit_date: listingData.visit_date ? new Date(listingData.visit_date) : undefined,
          quotes: quotesArray,
          context: contextArray,
          confidence_score: listingData.confidence_score,
          approved: listingData.approved,
          timestamp: listingData.timestamp ? Number(listingData.timestamp) : 0,
        });
      }
    }
  };

  return {
    form,
    isLoading,
    handleSubmit,
    handleReset,
  };
}