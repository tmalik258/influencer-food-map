'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp } from 'lucide-react';

import type { SystemApprovalRateProps } from '@/lib/types';

export function SystemApprovalRate({ 
  approvedListings, 
  totalListings, 
  pendingListings 
}: SystemApprovalRateProps) {
  const approvalRate = Math.round((approvedListings / totalListings) * 100);

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Listing Approval Rate
        </CardTitle>
        <CardDescription>
          Current approval rate for submitted listings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Approved</span>
          <span className="text-sm text-muted-foreground">
            {approvedListings} / {totalListings}
          </span>
        </div>
        <Progress value={approvalRate} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{approvalRate}% approved</span>
          <span>{pendingListings} pending review</span>
        </div>
      </CardContent>
    </Card>
  );
}