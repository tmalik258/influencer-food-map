"use client";

import { useState, useEffect, useRef } from "react";
import { Check, ChevronDown, Tag as TagIcon } from "lucide-react";
import { Tag } from "@/lib/types";
import { useTags } from "@/lib/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TagFilterDropdownProps {
  city?: string;
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  className?: string;
}

export function TagFilterDropdown({
  city,
  selectedTags,
  onTagsChange,
  className = "",
}: TagFilterDropdownProps) {
  const { tags, loading, error, fetchAllTags } = useTags();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAllTags(100, city);
  }, [fetchAllTags, city]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleTagToggle = (tag: Tag) => {
    const isSelected = selectedTags.some((t) => t.id === tag.id);
    if (isSelected) {
      onTagsChange(selectedTags.filter((t) => t.id !== tag.id));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  if (loading) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("text-sm text-red-600", className)}>
        Failed to load tags: {error}
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)} ref={dropdownRef}>
      {/* Custom Multi-Select using Select styling */}
      <div className="relative z-[2000]">
        <button
          type="button"
          className={cn(
            "border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex w-full items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 h-9 cursor-pointer"
          )}
          disabled={loading}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            <TagIcon className="h-4 w-4" />
            <span
              className={
                selectedTags.length === 0 ? "text-muted-foreground" : ""
              }
            >
              {selectedTags.length > 0
                ? `${selectedTags.length} tag${
                    selectedTags.length > 1 ? "s" : ""
                  } selected`
                : "Select tags"}
            </span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform opacity-50",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {isOpen && (
          <div
            className={cn(
              "bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 absolute max-h-60 min-w-[8rem] overflow-x-hidden overflow-y-auto rounded-md border shadow-md top-full left-0 right-0 mt-1"
            )}
          >
            <div className="p-1">
              {loading && (
                <div className="p-2 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              )}
              {error && (
                <div className="p-2 text-sm text-red-600">
                  Error loading tags: {error}
                </div>
              )}
              {!loading && !error && tags.length === 0 && (
                <div className="p-2 text-sm text-muted-foreground">
                  No tags available
                </div>
              )}
              {!loading &&
                !error &&
                tags.map((tag) => {
                  const isSelected = selectedTags.some((t) => t.id === tag.id);
                  return (
                    <div
                      key={tag.id}
                      className={cn(
                        "focus:bg-accent focus:text-accent-foreground [&_svg:not([class*='text-'])]:text-muted-foreground relative flex w-full items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none hover:bg-accent hover:text-accent-foreground cursor-pointer"
                      )}
                      onClick={() => handleTagToggle(tag)}
                    >
                      <span className="flex items-center gap-2">
                        {tag.name}
                      </span>
                      <span className="absolute right-2 flex size-3.5 items-center justify-center">
                        {isSelected && <Check className="h-4 w-4" />}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
