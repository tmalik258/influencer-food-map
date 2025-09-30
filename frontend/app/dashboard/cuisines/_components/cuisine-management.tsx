"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Pencil, Trash2, Plus } from "lucide-react";
import { CuisineCreateForm } from "./cuisine-create-form";
import CuisineDeleteDialog from "./cuisine-delete-dialog";
import { PaginationInfo } from "@/components/ui/pagination-info";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { Cuisine } from "@/lib/types";
import { useCuisinesPaginated } from "@/lib/hooks/useCuisinesPaginated";
import { cuisineActions } from "@/lib/actions";
import { CuisineHeader } from "./cuisine-header";
import DashboardLoadingSkeleton from "../../_components/dashboard-loading-skeleton";

export function CuisineManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "created_at">("name");
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [editingCuisine, setEditingCuisine] = useState<Cuisine | null>(null);
  const [deletingCuisine, setDeletingCuisine] = useState<Cuisine | null>(null);

  const {
    cuisines,
    total,
    page,
    limit,
    totalPages,
    loading,
    error,
    goToPage,
    setSearchQuery,
    setLimit,
    refetch,
  } = useCuisinesPaginated({
    name: searchTerm,
    limit: 20,
  });

  // Filter and sort cuisines on the client side for now
  // In the future, this could be moved to the backend
  const filteredAndSortedCuisines = useMemo(() => {
    let filtered = cuisines;

    if (searchTerm) {
      filtered = cuisines.filter((cuisine) =>
        cuisine.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [cuisines, searchTerm, sortBy]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setSearchQuery(term);
  };

  const handleSort = (sort: "name" | "created_at") => {
    setSortBy(sort);
  };

  const handleEdit = (cuisine: Cuisine) => {
    setEditingCuisine(cuisine);
  };

  const handleDelete = (cuisine: Cuisine) => {
    setDeletingCuisine(cuisine);
  };

  const handleCreateSuccess = () => {
    setIsCreateFormOpen(false);
    refetch();
  };

  const handleEditSuccess = () => {
    setEditingCuisine(null);
    refetch();
  };

  const handleDeleteSuccess = async () => {
    if (!deletingCuisine) return;

    try {
      await cuisineActions.deleteCuisine(deletingCuisine.id);
      setDeletingCuisine(null);
      refetch();
    } catch (error) {
      console.error("Error deleting cuisine:", error);
      // You could add a toast notification here for better UX
    }
  };

  const handleItemsPerPageChange = (newLimit: number) => {
    setLimit(newLimit);
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Error loading cuisines: {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <CuisineHeader
        searchTerm={searchTerm}
        onSearchChange={handleSearch}
        sortBy={sortBy}
        onSortChange={handleSort}
        onOpenCreateForm={() => setIsCreateFormOpen(true)}
      />

      {loading ? (
        <DashboardLoadingSkeleton variant="management" />
      ) : (
        <>
          {/* Results Summary */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground font-medium">
              Showing {filteredAndSortedCuisines.length} of {total || 0}{" "}
              cuisines
              {searchTerm && " (filtered)"} (Page {page} of {totalPages})
            </p>
          </div>
          {/* Cuisine Table */}
          {filteredAndSortedCuisines.length === 0 ? (
            <Card className="glass-effect backdrop-blur-xl border-orange-500/20 shadow-lg">
              <CardContent className="pt-6 text-center text-muted-foreground">
                <p className="text-lg font-medium">
                  {cuisines?.length === 0
                    ? "No cuisines found."
                    : "No cuisines match your current search."}
                </p>
                {searchTerm && (
                  <p className="text-sm mt-2 text-orange-500">
                    Try adjusting your search terms.
                  </p>
                )}
                {cuisines?.length === 0 && (
                  <Button
                    onClick={() => setIsCreateFormOpen(true)}
                    className="mt-4 cursor-pointer bg-orange-500 hover:bg-orange-600"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Cuisine
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="p-0 glass-effect backdrop-blur-xl border-orange-500/20 shadow-lg">
              <CardContent className="p-0">
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-orange-500/20 hover:bg-orange-500/5">
                          <TableHead className="font-semibold text-foreground">
                            Name
                          </TableHead>
                          <TableHead className="font-semibold text-foreground">
                            Created
                          </TableHead>
                          <TableHead className="text-right font-semibold text-foreground">
                            Actions
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAndSortedCuisines.map((cuisine) => (
                          <TableRow
                            key={cuisine.id}
                            className="border-orange-500/20 hover:bg-orange-500/5"
                          >
                            <TableCell className="py-3 px-4">
                              <Link
                                href={`/dashboard/cuisines/${cuisine.id}`}
                                className="font-medium text-orange-600 hover:text-orange-800 cursor-pointer"
                              >
                                {cuisine.name}
                              </Link>
                            </TableCell>
                            <TableCell className="py-3 px-4 text-muted-foreground">
                              {new Date(
                                cuisine.created_at
                              ).toLocaleDateString()}
                            </TableCell>
                            <TableCell className="py-3 px-4">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(cuisine)}
                                  className="cursor-pointer border-orange-500/20 hover:bg-orange-500/10 hover:border-orange-500/40"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDelete(cuisine)}
                                  className="cursor-pointer text-red-600 hover:text-red-800 border-red-500/20 hover:bg-red-500/10 hover:border-red-500/40"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="flex items-center justify-between pt-4">
                    <PaginationInfo
                      currentPage={page}
                      itemsPerPage={limit}
                      totalItems={total}
                    />
                    <div className="flex items-center gap-4">
                      <PaginationControls
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={goToPage}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
      {/* Create Form Dialog */}
      <CuisineCreateForm
        open={isCreateFormOpen}
        onOpenChange={setIsCreateFormOpen}
        onSuccess={handleCreateSuccess}
      />
      {/* Edit Form Dialog */}
      {editingCuisine && (
        <CuisineCreateForm
          open={!!editingCuisine}
          onOpenChange={(open) => !open && setEditingCuisine(null)}
          onSuccess={handleEditSuccess}
          cuisine={editingCuisine}
        />
      )}
      {/* Delete Dialog */}
      <CuisineDeleteDialog
        open={!!deletingCuisine}
        onOpenChange={(open) => !open && setDeletingCuisine(null)}
        cuisine={deletingCuisine}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
