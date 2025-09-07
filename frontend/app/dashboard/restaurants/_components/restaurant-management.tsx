"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  MapPin, 
  Star, 
  Clock,
  Filter,
} from "lucide-react";

import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRestaurants } from "@/lib/hooks";
import { Restaurant } from "@/lib/types";
import LoadingSkeleton from "@/components/loading-skeleton";



export function RestaurantManagement() {
  const { restaurants, fetchRestaurants, loading, error, refetch } = useRestaurants();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]); // Only run once on mount

  const handleEdit = (restaurant: Restaurant) => {
    // TODO: Open edit modal or navigate to edit page
    console.log("Edit restaurant:", restaurant);
  };

  const handleDelete = (id: string) => {
    // TODO: Show confirmation dialog and delete restaurant
    console.log("Delete restaurant:", id);
  };

  const handleView = (restaurant: Restaurant) => {
    // TODO: Navigate to restaurant detail page
    console.log("View restaurant:", restaurant);
  };

  const handleAddNew = () => {
    // TODO: Open create modal or navigate to create page
    console.log("Add new restaurant");
  };

  if (loading) {
    return <LoadingSkeleton variant="restaurant" count={6} />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-orange-600">
          <p>Failed to load restaurants: {error}</p>
          <Button onClick={() => refetch()} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Filter and sort restaurants
  const filteredRestaurants = restaurants?.filter(restaurant => {
    const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === "all" || 
                      restaurant.tags?.some(tag => tag.name === selectedTag);
    return matchesSearch && matchesTag;
  }) || [];

  const sortedRestaurants = [...filteredRestaurants].sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name);
      case "rating":
        return (b.google_rating || 0) - (a.google_rating || 0);
      case "city":
        return (a.city || '').localeCompare(b.city || '');
      case "updated":
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      default:
        return 0;
    }
  });

  // Get unique tags for filter
  const allTags = restaurants?.flatMap(r => r.tags || []) || [];
  const uniqueTags = Array.from(new Set(allTags.map(tag => tag.name))).sort();

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search restaurants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="w-48">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {uniqueTags.map(tag => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="city">City</SelectItem>
              <SelectItem value="updated">Last Updated</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add Restaurant
        </Button>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {sortedRestaurants.length} of {restaurants?.length || 0} restaurants
        </p>
      </div>

      {/* Restaurant Table */}
      {sortedRestaurants.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            <p>No restaurants found matching your criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRestaurants.map(restaurant => (
                  <TableRow key={restaurant.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleView(restaurant)}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{restaurant.name}</div>
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {restaurant.address}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{restaurant.city || 'Unknown'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span>{restaurant.google_rating?.toFixed(1) || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {restaurant.tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag.id} variant="secondary" className="text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                        {restaurant.tags && restaurant.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{restaurant.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(restaurant.updated_at).toLocaleDateString()}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(restaurant);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(restaurant.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}