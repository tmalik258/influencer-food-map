'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface PaginationInfoProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  className?: string;
  itemName?: string;
}

export function PaginationInfo({
  currentPage,
  totalItems,
  itemsPerPage,
  className,
  itemName = 'items',
}: PaginationInfoProps) {
  if (totalItems === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        No {itemName} found
      </div>
    );
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={cn('text-sm text-muted-foreground', className)}>
      Showing {startItem} to {endItem} of {totalItems} {itemName}
    </div>
  );
}