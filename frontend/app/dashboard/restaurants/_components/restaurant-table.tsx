"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Restaurant } from "@/lib/types";
import { RestaurantTableRow } from "./restaurant-table-row";
import { MapPin, Star } from "lucide-react";

interface RestaurantTableProps {
  restaurants: Restaurant[];
  onEdit: (restaurant: Restaurant) => void;
  onDelete: (id: string) => void;
}

export function RestaurantTable({
  restaurants,
  onEdit,
  onDelete,
}: RestaurantTableProps) {
  return (
    <Card className="p-0 glass-effect backdrop-blur-xl border-orange-500/20 shadow-lg">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-orange-500/20 hover:bg-orange-500/5">
              <TableHead className="font-semibold text-foreground">
                Name
              </TableHead>
              <TableHead>
                <div className="inline-flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-500" />{" "}
                  <span className="font-semibold text-foreground">
                    Location
                  </span>
                </div>
              </TableHead>
              <TableHead>
                <div className="inline-flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />{" "}
                  <span className="font-semibold text-foreground">
                    Rating
                  </span>
                </div>
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Tags
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Cuisines
              </TableHead>
              <TableHead className="font-semibold text-foreground">
                Updated
              </TableHead>
              <TableHead className="text-right font-semibold text-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {restaurants.map((restaurant) => (
              <RestaurantTableRow
                key={restaurant.id}
                restaurant={restaurant}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}