import { Eye, PlusCircle } from 'lucide-react';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ListingHeaderProps {
  listingCount: number;
  onCreateClick: () => void;
}

export function ListingHeader({ listingCount, onCreateClick }: ListingHeaderProps) {
  return (
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Eye className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            Listing Management
          </CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Total {listingCount} listings
          </p>
        </div>
        <Button 
          className="ml-auto bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 focus:border-orange-500 cursor-pointer" 
          onClick={onCreateClick}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Create New Listing
        </Button>
      </div>
      <CardDescription className="text-gray-600 dark:text-gray-300">
        Review and manage restaurant listings from influencer content
      </CardDescription>
    </CardHeader>
  );
}