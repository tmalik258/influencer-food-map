import { Suspense } from "react";
import { CuisineManagement } from "./_components/cuisine-management";
import { CuisineLoading } from "./_components/cuisine-loading";

export default function CuisinesPage() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Cuisines</h1>
        <p className="text-muted-foreground">
          Manage and organize cuisine types for your restaurant listings.
        </p>
      </div>
      
      <Suspense fallback={<CuisineLoading />}>
        <CuisineManagement />
      </Suspense>
    </div>
  );
}