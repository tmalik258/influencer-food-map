"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRestaurantsPaginated, useAdminRestaurant } from "@/lib/hooks";
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
  } = useRestaurantsPaginated({ limit: 10 });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedCuisine, setSelectedCuisine] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>(
    []
  );

  const router = useRouter();
  const { deleteRestaurant, loading: deleteLoading } = useAdminRestaurant();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState<string | null>(
    null
  );
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [restaurantToEdit, setRestaurantToEdit] = useState<Restaurant | null>(
    null
  );

  const handleEdit = (restaurant: Restaurant) => {
    setRestaurantToEdit(restaurant);
    setEditModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setRestaurantToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!restaurantToDelete) return;

    try {
      await deleteRestaurant(restaurantToDelete);
      toast.success("Restaurant deleted successfully");
      refetch(); // Refresh the list
      setDeleteModalOpen(false);
      setRestaurantToDelete(null);
    } catch (error) {
      toast.error("Failed to delete restaurant");
    }
  };

  const handleView = (restaurant: Restaurant) => {
    router.push(`/dashboard/restaurants/${restaurant.id}`);
  };

  const handleAddNew = () => {
    setCreateModalOpen(true);
  };

  const handleCreateSuccess = () => {
    setCreateModalOpen(false);
    refetch(); // Refresh the restaurant list
    toast.success("Restaurant created successfully!");
  };

  const handleEditSuccess = () => {
    setEditModalOpen(false);
    setRestaurantToEdit(null);
    refetch(); // Refresh the restaurant list
    toast.success("Restaurant updated successfully!");
  };

  const handleSearch = (value: string) => {
    if (value.trim()) {
      setSearchTerm(value.trim());
    } else {
      setSearchTerm("");
    }
  };

  // Client-side filtering logic
  useEffect(() => {
    if (restaurants && restaurants.length > 0) {
      let filtered = [...restaurants];

      // Apply search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        filtered = filtered.filter((restaurant) => {
          return (
            restaurant.name.toLowerCase().includes(query) ||
            restaurant.city?.toLowerCase().includes(query) ||
            restaurant.address?.toLowerCase().includes(query) ||
            restaurant.tags?.some((tag) =>
              tag.name.toLowerCase().includes(query)
            ) ||
            restaurant.cuisines?.some((cuisine) =>
              cuisine.name.toLowerCase().includes(query)
            )
          );
        });
      }

      // Apply tag filter
      if (selectedTag !== "all") {
        filtered = filtered.filter((restaurant) => {
          return restaurant.tags?.some((tag) => tag.name === selectedTag);
        });
      }

      // Apply cuisine filter
      if (selectedCuisine !== "all") {
        filtered = filtered.filter((restaurant) => {
          return restaurant.cuisines?.some(
            (cuisine) => cuisine.name === selectedCuisine
          );
        });
      }

      // Apply sorting
      filtered.sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name);
          case "rating":
            return (b.google_rating || 0) - (a.google_rating || 0);
          case "city":
            return (a.city || "").localeCompare(b.city || "");
          case "updated":
            return (
              new Date(b.updated_at).getTime() -
              new Date(a.updated_at).getTime()
            );
          default:
            return 0;
        }
      });

      setFilteredRestaurants(filtered);
    } else {
      setFilteredRestaurants([]);
    }
  }, [restaurants, searchTerm, selectedTag, selectedCuisine, sortBy]);

  if (loading) {
    return <RestaurantLoading count={6} />;
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

  // Get unique tags for filter (from all restaurants data)
  const allTags = restaurants?.flatMap((r) => r.tags || []) || [];
  const uniqueTags = Array.from(
    new Set(
      (Array.isArray(allTags) ? allTags : []).map((tag) => tag?.name || "")
    )
  ).sort();

  // Get unique cuisines for filter (from all restaurants data)
  const allCuisines = restaurants?.flatMap((r) => r.cuisines || []) || [];
  const uniqueCuisines = Array.from(
    new Set(
      (Array.isArray(allCuisines) ? allCuisines : []).map(
        (cuisine) => cuisine?.name || ""
      )
    )
  ).sort();

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <RestaurantFilters
        searchTerm={searchTerm}
        selectedTag={selectedTag}
        selectedCuisine={selectedCuisine}
        sortBy={sortBy}
        uniqueTags={uniqueTags}
        uniqueCuisines={uniqueCuisines}
        onSearchChange={handleSearch}
        onTagChange={setSelectedTag}
        onCuisineChange={setSelectedCuisine}
        onSortChange={setSortBy}
        onAddNew={handleAddNew}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">
          Showing {filteredRestaurants.length} of {total || 0} restaurants
          {(searchTerm || selectedTag !== "all" || selectedCuisine !== "all") &&
            " (filtered)"}{" "}
          (Page {page} of {totalPages})
        </p>
      </div>

      {/* Empty state */}
      <RestaurantEmptyState 
        hasRestaurants={filteredRestaurants.length > 0}
        hasActiveFilters={searchTerm !== "" || selectedTag !== "all" || selectedCuisine !== "all"}
      />

      {/* Restaurant table */}
      {filteredRestaurants.length > 0 && (
        <RestaurantTable 
          restaurants={filteredRestaurants}
          onView={handleView}
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
          loading={loading}
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
        onClose={() => setDeleteModalOpen(false)}
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
