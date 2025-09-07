"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import Link from "next/link";

interface FormActionsProps {
  isSubmitting: boolean;
  onCancel?: () => void;
  cancelHref?: string;
  submitText?: string;
  cancelText?: string;
}

export function FormActions({
  isSubmitting,
  onCancel,
  cancelHref = "/dashboard/restaurants",
  submitText = "Update Restaurant",
  cancelText = "Cancel",
}: FormActionsProps) {
  const CancelComponent = onCancel ? (
    <Button
      type="button"
      variant="outline"
      onClick={onCancel}
      disabled={isSubmitting}
      className="cursor-pointer"
    >
      {cancelText}
    </Button>
  ) : (
    <Button
      asChild
      variant="outline"
      disabled={isSubmitting}
      className="cursor-pointer"
    >
      <Link href={cancelHref}>{cancelText}</Link>
    </Button>
  );

  return (
    <div className="flex flex-col sm:flex-row gap-4 pt-6">
      <Button
        type="submit"
        disabled={isSubmitting}
        className="cursor-pointer order-2 sm:order-1"
      >
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSubmitting ? "Updating..." : submitText}
      </Button>
      <div className="order-1 sm:order-2">{CancelComponent}</div>
    </div>
  );
}