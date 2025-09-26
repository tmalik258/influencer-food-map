"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { X, ChefHat, MapPin, Tag } from "lucide-react";
import { Restaurant } from "@/lib/types";
import { CuisinesManagementTab } from "./edit-restaurant-tabs/cuisines-management-tab";
import { RestaurantDetailsTab } from "./edit-restaurant-tabs/restaurant-details-tab";
import { TagsManagementTab } from "./edit-restaurant-tabs/tags-management-tab";

interface EditRestaurantModalProps {
  restaurant: Restaurant | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditRestaurantModal({
  restaurant,
  isOpen,
  onClose,
  onSuccess,
}: EditRestaurantModalProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (
        confirm("You have unsaved changes. Are you sure you want to close?")
      ) {
        setHasUnsavedChanges(false);
        onClose();
      }
    } else {
      onClose();
    }
  };

  const handleSuccess = () => {
    setHasUnsavedChanges(false);
    onSuccess();
    onClose();
  };

  if (!restaurant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] glass-effect border-orange-500/30 backdrop-blur-xl shadow-2xl flex flex-col">
        <DialogHeader className="pb-4 border-b border-border/20 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <MapPin className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-semibold text-foreground">
                  Edit Restaurant
                </DialogTitle>
                <DialogDescription className="text-muted-foreground mt-1">
                  {restaurant.name} • {restaurant.city || "Unknown City"}
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="hover:bg-muted/50 transition-colors duration-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="h-full flex flex-col"
          >
            <TabsList className="grid w-full grid-cols-3 bg-muted/30 border border-border/20 flex-shrink-0">
              <TabsTrigger
                value="details"
                className="flex items-center gap-2 data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-600 data-[state=active]:border-orange-500/20"
              >
                <MapPin className="h-4 w-4" />
                Details
              </TabsTrigger>
              <TabsTrigger
                value="cuisines"
                className="flex items-center gap-2 data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-600 data-[state=active]:border-orange-500/20"
              >
                <ChefHat className="h-4 w-4" />
                Cuisines
              </TabsTrigger>
              <TabsTrigger
                value="tags"
                className="flex items-center gap-2 data-[state=active]:bg-orange-500/10 data-[state=active]:text-orange-600 data-[state=active]:border-orange-500/20"
              >
                <Tag className="h-4 w-4" />
                Tags
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 min-h-0 overflow-y-auto">
              <TabsContent value="cuisines" className="mt-0 h-full">
                <CuisinesManagementTab
                  restaurant={restaurant}
                  onSuccess={handleSuccess}
                  onUnsavedChanges={setHasUnsavedChanges}
                />
              </TabsContent>

              <TabsContent value="details" className="mt-0 h-full">
                <RestaurantDetailsTab
                  restaurant={restaurant}
                  onSuccess={handleSuccess}
                  onUnsavedChanges={setHasUnsavedChanges}
                />
              </TabsContent>

              <TabsContent value="tags" className="mt-0 h-full">
                <TagsManagementTab
                  restaurant={restaurant}
                  onSuccess={handleSuccess}
                  onUnsavedChanges={setHasUnsavedChanges}
                />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
