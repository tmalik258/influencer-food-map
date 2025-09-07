import { Eye } from 'lucide-react';
import { CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ListingHeader() {
  return (
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <Eye className="h-5 w-5" />
        Listing Management
      </CardTitle>
      <CardDescription>
        Review and manage restaurant listings from influencer content
      </CardDescription>
    </CardHeader>
  );
}