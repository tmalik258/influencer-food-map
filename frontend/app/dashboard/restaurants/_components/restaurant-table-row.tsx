"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, MapPin, Star, Clock } from "lucide-react";
import { Restaurant } from "@/lib/types";

interface RestaurantTableRowProps {
  restaurant: Restaurant;
  onView: (restaurant: Restaurant) => void;
  onEdit: (restaurant: Restaurant) => void;
  onDelete: (id: string) => void;
}

export function RestaurantTableRow({ restaurant, onView, onEdit, onDelete }: RestaurantTableRowProps) {
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onView(restaurant);
    }
  };

  return (
    <TableRow 
      key={restaurant.id} 
      className="cursor-pointer hover:bg-muted/50 focus-within:bg-muted/50" 
      onClick={() => onView(restaurant)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${restaurant.name}`}
    >
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
          <span>{restaurant.city || 'Unknown'}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          
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
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {restaurant.cuisines?.slice(0, 2).map((cuisine) => (
            <Badge key={cuisine.id} variant="default" className="text-xs">
              {cuisine.name}
            </Badge>
          ))}
          {restaurant.cuisines && restaurant.cuisines.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{restaurant.cuisines.length - 2}
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
              onEdit(restaurant);
            }}
            className="cursor-pointer"
            aria-label={`Edit ${restaurant.name}`}
          >
            <Edit className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Edit</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(restaurant.id);
            }}
            className="cursor-pointer"
            aria-label={`Delete ${restaurant.name}`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}