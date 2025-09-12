"use client";

import { useState, useEffect } from "react";
import { PlusCircle, Edit, Trash2, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

import { CuisineCreateForm } from "./cuisine-create-form";
import { CuisineDeleteDialog } from "./cuisine-delete-dialog";
import { Cuisine } from "@/lib/types";
import { useCuisines } from "@/lib/hooks/useCuisines";
import DashboardLoadingSkeleton from "@/app/dashboard/_components/dashboard-loading-skeleton";
import { DialogTitle } from "@radix-ui/react-dialog";

export function CuisineManagement() {
  const router = useRouter();
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCuisine, setSelectedCuisine] = useState<Cuisine | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const { cuisines, loading, error, fetchAllCuisines, searchCuisinesByName } =
    useCuisines();

  useEffect(() => {
    fetchAllCuisines();
  }, [fetchAllCuisines]);

  useEffect(() => {
    if (searchTerm.trim()) {
      const debounceTimer = setTimeout(() => {
        searchCuisinesByName(searchTerm);
      }, 300);
      return () => clearTimeout(debounceTimer);
    } else {
      fetchAllCuisines();
    }
  }, [searchTerm, searchCuisinesByName, fetchAllCuisines]);

  const handleCreate = () => {
    setIsCreateFormOpen(true);
  };

  const handleCreateSuccess = () => {
    setIsCreateFormOpen(false);
    fetchAllCuisines(); // Refresh the list
  };

  const handleEdit = (cuisine: Cuisine) => {
    router.push(`/dashboard/cuisines/${cuisine.id}`);
  };

  const handleDelete = (cuisine: Cuisine) => {
    setSelectedCuisine(cuisine);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSuccess = () => {
    setIsDeleteDialogOpen(false);
    setSelectedCuisine(null);
    fetchAllCuisines(); // Refresh the list
  };

  if (loading) {
    return <DashboardLoadingSkeleton variant="management" />;
  }

  if (error) {
    return (
      <div className="space-y-4 glass-effect backdrop-blur-xl bg-white/80 p-6 rounded-lg border border-orange-200/50 shadow-xl">
        <div className="text-center py-8">
          <p className="text-orange-600 dark:text-orange-400 mb-4 border border-orange-200 bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
            Error loading cuisines: {error}
          </p>
          <Button onClick={() => fetchAllCuisines()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Cuisines</h2>
      </div>
      <div className="flex flex-col md:flex-row justify-between gap-4 py-4">
        <div className="relative w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-orange-500" />
          <Input
            placeholder="Search cuisines..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 glass-effect backdrop-blur-sm bg-white/70 border-orange-200/50 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={isCreateFormOpen} onOpenChange={setIsCreateFormOpen}>
            <DialogTrigger asChild>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800" onClick={handleCreate}>
                <PlusCircle className="mr-2 h-4 w-4 text-white" /> Add Cuisine
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] glass-effect backdrop-blur-xl bg-white/80 border border-orange-200/50 shadow-xl">
              <DialogHeader className="font-bold">
                <DialogTitle className="text-gray-900 dark:text-gray-100">Create New Cuisine</DialogTitle>
              </DialogHeader>
              <CuisineCreateForm onSuccess={handleCreateSuccess} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="glass-effect backdrop-blur-xl bg-white/80 border border-orange-200/50 shadow-xl">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-gray-100">Cuisines ({cuisines.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {cuisines.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm
                  ? `No cuisines found matching "${searchTerm}"`
                  : "No cuisines found."}
              </p>
              {!searchTerm && (
                <Button
                  onClick={handleCreate}
                  className="mt-4 bg-orange-600 hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                  variant="outline"
                >
                  <PlusCircle className="mr-2 h-4 w-4 text-white" />
                  Add Your First Cuisine
                </Button>
              )}
            </div>
          ) : (
            <Table className="glass-effect backdrop-blur-sm bg-white/50">
              <TableHeader>
                <TableRow className="hover:bg-orange-50/50 dark:hover:bg-orange-900/10 border-orange-200/30">
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cuisines.map((cuisine) => (
                  <TableRow key={cuisine.id} className="hover:bg-orange-50/50 dark:hover:bg-orange-900/10 border-orange-200/30">
                    <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                      {cuisine.name}
                    </TableCell>
                    <TableCell className="text-gray-600 dark:text-gray-400">
                      {new Date(cuisine.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(cuisine)}
                          className="cursor-pointer text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:text-orange-300 dark:hover:bg-orange-900/20"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(cuisine)}
                          className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedCuisine && (
        <CuisineDeleteDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={setIsDeleteDialogOpen}
          cuisine={selectedCuisine}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}
