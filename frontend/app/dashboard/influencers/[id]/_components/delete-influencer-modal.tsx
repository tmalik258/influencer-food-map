"use client";


import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Influencer } from "@/lib/types";
import { useAdminInfluencer } from "@/lib/hooks/useAdminInfluencer";

interface DeleteInfluencerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  influencer: Partial<Influencer>;
}

export function DeleteInfluencerModal({
  isOpen,
  onClose,
  onSuccess,
  influencer,
}: DeleteInfluencerModalProps) {
  const { deleteInfluencer, loading } = useAdminInfluencer();
  const router = useRouter();

  const handleDelete = async () => {
    if (!influencer?.id) {
      return;
    }

    const success = await deleteInfluencer(influencer.id);
    if (success) {
      onSuccess();
      onClose();
      // Redirect to influencers list after successful deletion
      router.push("/dashboard/influencers");
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <DialogTitle>Delete Influencer</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Are you sure you want to delete{" "}
            <span className="font-semibold">{influencer.name}</span>?
            <br />
            <br />
            This action cannot be undone. This will permanently delete the
            influencer and all associated data including listings and videos.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Influencer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}