"use client";

import { useState, useMemo, useCallback } from "react";
import { useRestaurantsPaginated, useAdminRestaurant } from "@/lib/hooks";
import { useTagsPaginated } from "@/lib/hooks/useTagsPaginated";
import { useCuisinesPaginated } from "@/lib/hooks/useCuisinesPaginated";
import { Restaurant } from "@/lib/types";
import { RestaurantFilters } from "./restaurant-filters";
import { RestaurantEmptyState } from "./restaurant-empty-state";
import { RestaurantTable } from "./restaurant-table";
import { RestaurantPagination } from "./restaurant-pagination";
import ErrorCard from "@/components/error-card";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import CreateRestaurantModal from "./create-restaurant-modal";
import { EditRestaurantModal } from "./edit-restaurant-modal";
import { toast } from "sonner";
import { RestaurantLoading } from "./restaurant-loading";

export function RestaurantManagement() {
  const {
    restaurants,
    total,
    page,
    totalPages,
    loading,
    error,
    goToPage,
    refetch,
    setSearchQuery,
    setTagFilter,
    setCuisineFilter,
    setSortBy,
    params,
  } = useRestaurantsPaginated({ limit: 10 });

  const { deleteRestaurant, loading: deleteLoading } = useAdminRestaurant();
  const { tags, loading: tagsLoading } = useTagsPaginated({ limit: 100 });
  const { cuisines, loading: cuisinesLoading } = useCuisinesPaginated({ limit: 100 });
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState<string | null>(
    null
  );
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [restaurantToEdit, setRestaurantToEdit] = useState<Restaurant | null>(
    null
  );

  // Memoized handlers to prevent unnecessary re-renders
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, [setSearchQuery]);

  const handleEdit = useCallback((restaurant: Restaurant) => {
    setRestaurantToEdit(restaurant);
    setEditModalOpen(true);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setRestaurantToDelete(id);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!restaurantToDelete) return;

    try {
      await deleteRestaurant(restaurantToDelete);
      toast.success("Restaurant deleted successfully");
      setDeleteModalOpen(false);
      setRestaurantToDelete(null);
      refetch();
    } catch (error) {
      console.log("Failed to delete restaurant:", error);
      toast.error("Failed to delete restaurant");
    }
  }, [restaurantToDelete, deleteRestaurant, refetch]);

  const handleAddNew = useCallback(() => {
    setCreateModalOpen(true);
  }, []);

  const handleCreateSuccess = useCallback(() => {
    setCreateModalOpen(false);
    refetch();
    toast.success("Restaurant created successfully");
  }, [refetch]);

  const handleEditSuccess = useCallback(() => {
    setEditModalOpen(false);
    setRestaurantToEdit(null);
    refetch();
    toast.success("Restaurant updated successfully");
  }, [refetch]);

  const handleTagChange = useCallback((tag: string) => {
    setTagFilter(tag === "all" ? "" : tag);
  }, [setTagFilter]);

  const handleCuisineChange = useCallback((cuisine: string) => {
    setCuisineFilter(cuisine === "all" ? "" : cuisine);
  }, [setCuisineFilter]);

  const handleSortChange = useCallback((sort: string) => {
    setSortBy(sort);
  }, [setSortBy]);

  // Memoized unique tags and cuisines to prevent re-computation
  const uniqueTags = useMemo(() => {
    return tags?.map(tag => tag.name).sort() || [];
  }, [tags]);

  const uniqueCuisines = useMemo(() => {
    return cuisines?.map(cuisine => cuisine.name).sort() || [];
  }, [cuisines]);

  // Memoized filter props to prevent unnecessary re-renders of RestaurantFilters
  const filterProps = useMemo(() => ({
    searchTerm: params.name || "",
    selectedTag: params.tag || "",
    selectedCuisine: params.cuisine || "",
    sortBy: params.sort_by || "name",
    uniqueTags,
    uniqueCuisines,
    tagsLoading,
    cuisinesLoading,
    onSearchChange: handleSearch,
    onTagChange: handleTagChange,
    onCuisineChange: handleCuisineChange,
    onSortChange: handleSortChange,
    onAddNew: handleAddNew,
  }), [
    params.name,
    params.tag,
    params.cuisine,
    params.sort_by,
    uniqueTags,
    uniqueCuisines,
    tagsLoading,
    cuisinesLoading,
    handleSearch,
    handleTagChange,
    handleCuisineChange,
    handleSortChange,
    handleAddNew,
  ]);

  // Show table loading only when restaurants are loading
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Show filters with their own loading states */}
        <RestaurantFilters {...filterProps} />
        
        {/* Show table loading */}
        <RestaurantLoading count={6} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorCard
        title="Failed to Load Restaurants"
        message="We're having trouble loading your restaurant data. Please check your connection and try again."
        error={error}
        onRefresh={() => refetch()}
        showRefreshButton={true}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions with separate loading states */}
      <RestaurantFilters {...filterProps} />

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">
          Showing {restaurants?.length || 0} of {total || 0} restaurants
          (Page {page} of {totalPages})
        </p>
      </div>

      {/* Empty state */}
      <RestaurantEmptyState 
        hasRestaurants={(restaurants?.length || 0) > 0}
        hasActiveFilters={false}
      />

      {/* Restaurant table */}
      {restaurants && restaurants.length > 0 && (
        <RestaurantTable 
          restaurants={restaurants}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <RestaurantPagination 
          currentPage={page}
          totalPages={totalPages}
          totalRestaurants={total}
          onPageChange={goToPage}
          loading={false} // Don't show loading on pagination since we handle it separately
        />
      )}

      {/* Create Restaurant Modal */}
      <CreateRestaurantModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Restaurant"
        description="Are you sure you want to delete this restaurant? This action cannot be undone."
        isLoading={deleteLoading}
      />

      {/* Edit Restaurant Modal */}
      <EditRestaurantModal
        restaurant={restaurantToEdit}
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setRestaurantToEdit(null);
        }}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
