"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useRestaurantsPaginated, useAdminRestaurant } from "@/lib/hooks";
import { Restaurant } from "@/lib/types";
import { RestaurantFilters } from "./restaurant-filters";
import { RestaurantTableRow } from "./restaurant-table-row";
import { RestaurantLoading } from "./restaurant-loading";
import ErrorCard from "@/components/error-card";
import { DeleteConfirmationModal } from "@/components/delete-confirmation-modal";
import { MapPin, Star } from "lucide-react";
import { toast } from "sonner";

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
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);

  const router = useRouter();
  const { deleteRestaurant, loading: deleteLoading } = useAdminRestaurant();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [restaurantToDelete, setRestaurantToDelete] = useState<string | null>(null);

  const handleEdit = (restaurant: Restaurant) => {
    router.push(`/dashboard/restaurants/${restaurant.id}?mode=edit`);
  };

  const handleDelete = (id: string) => {
    setRestaurantToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
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
    // TODO: Open create modal or navigate to create page
    console.log("Add new restaurant");
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
          return restaurant.cuisines?.some((cuisine) => cuisine.name === selectedCuisine);
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
            return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
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
        message="We&apos;re having trouble loading your restaurant data. Please check your connection and try again."
        error={error}
        onRefresh={() => refetch()}
        showRefreshButton={true}
      />
    );
  }

  // Get unique tags for filter (from all restaurants data)
  const allTags = restaurants?.flatMap((r) => r.tags || []) || [];
  const uniqueTags = Array.from(new Set(allTags.map((tag) => tag.name))).sort();
  
  // Get unique cuisines for filter (from all restaurants data)
  const allCuisines = restaurants?.flatMap((r) => r.cuisines || []) || [];
  const uniqueCuisines = Array.from(new Set(allCuisines.map((cuisine) => cuisine.name))).sort();

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
        <p className="text-sm text-muted-foreground">
          Showing {filteredRestaurants.length} of {total || 0} restaurants
          {(searchTerm || selectedTag !== "all" || selectedCuisine !== "all") && " (filtered)"}
          {" "} (Page {page} of {totalPages})
        </p>
      </div>

      {/* Restaurant Table */}
      {filteredRestaurants.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>
              {restaurants?.length === 0
                ? "No restaurants found."
                : "No restaurants match your current filters."}
            </p>
            {(searchTerm || selectedTag !== "all" || selectedCuisine !== "all") && (
              <p className="text-xs mt-2">
                Try adjusting your search terms or filters.
              </p>
            )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setRestaurantToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Restaurant"
        description="Are you sure you want to delete this restaurant? This action cannot be undone."
        isLoading={deleteLoading}
      />
          </CardContent>
        </Card>
      ) : (
        <Card className="p-0">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>
                    <div className="inline-flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />{" "}
                      Location
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="inline-flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />{" "}
                      Rating
                    </div>
                  </TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Cuisines</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRestaurants.map((restaurant) => (
                  <RestaurantTableRow
                    key={restaurant.id}
                    restaurant={restaurant}
                    onView={handleView}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => page > 1 && goToPage(page - 1)}
                  className={`${
                    page <= 1 || loading
                      ? "pointer-events-none opacity-50"
                      : "hover:bg-orange-50 hover:text-orange-600 cursor-pointer"
                  }`}
                />
              </PaginationItem>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (pageNum) => (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      onClick={() => goToPage(pageNum)}
                      isActive={pageNum === page}
                      className={`${
                        loading
                          ? "pointer-events-none opacity-50"
                          : page === pageNum
                          ? "bg-orange-600 text-white hover:bg-orange-700"
                          : "hover:bg-orange-50 hover:text-orange-600 cursor-pointer"
                      }`}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={() => page < totalPages && goToPage(page + 1)}
                  className={
                    page >= totalPages
                      ? "pointer-events-none opacity-50"
                      : "hover:bg-orange-50 hover:text-orange-600 cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
