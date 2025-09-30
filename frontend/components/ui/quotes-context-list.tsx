"use client";

import { useState, useRef } from "react";
import { Plus, Trash2, GripVertical, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export interface QuoteContextItem {
  id: string;
  quote: string;
  context: string;
}

interface QuotesContextListProps {
  items: QuoteContextItem[];
  onChange: (items: QuoteContextItem[]) => void;
  className?: string;
  maxItems?: number;
  disabled?: boolean;
}

export function QuotesContextList({
  items,
  onChange,
  className,
  maxItems = 10,
  disabled = false,
}: QuotesContextListProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounter = useRef(0);

  const generateId = () => `quote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addItem = () => {
    if (items.length >= maxItems || disabled) return;
    
    const newItem: QuoteContextItem = {
      id: generateId(),
      quote: "",
      context: "",
    };
    
    onChange([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (disabled) return;
    onChange(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof Omit<QuoteContextItem, 'id'>, value: string) => {
    if (disabled) return;
    
    onChange(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    if (disabled) return;
    
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    onChange(newItems);
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (disabled) return;
    
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", "");
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    if (disabled || draggedIndex === null) return;
    
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    
    if (index !== dragOverIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    dragCounter.current++;
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    if (disabled || draggedIndex === null) return;
    
    e.preventDefault();
    
    if (draggedIndex !== dropIndex) {
      moveItem(draggedIndex, dropIndex);
    }
    
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold text-gray-900 dark:text-white">
          Quotes & Context
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          disabled={disabled || items.length >= maxItems}
          className="bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30 hover:bg-white/60 dark:hover:bg-gray-800/60 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Item
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="bg-white/30 dark:bg-gray-800/30 border-white/20 dark:border-gray-700/30 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Quote className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-center">
              No quotes added yet. Click &quot;Add Item&quot; to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <Card
              key={item.id}
              draggable={!disabled}
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={cn(
                "bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30 transition-all duration-200",
                draggedIndex === index && "opacity-50 scale-95",
                dragOverIndex === index && draggedIndex !== index && "border-orange-500 bg-orange-500/10",
                !disabled && "cursor-move hover:shadow-md hover:bg-white/60 dark:hover:bg-gray-800/60"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Drag Handle */}
                  {!disabled && (
                    <div className="flex flex-col items-center pt-2">
                      <GripVertical className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {index + 1}
                      </span>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`quote-${item.id}`} className="text-sm font-medium">
                        Quote *
                      </Label>
                      <Textarea
                        id={`quote-${item.id}`}
                        placeholder="Enter the quote..."
                        value={item.quote}
                        onChange={(e) => updateItem(item.id, 'quote', e.target.value)}
                        disabled={disabled}
                        rows={2}
                        className="bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200 resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`context-${item.id}`} className="text-sm font-medium">
                        Context
                      </Label>
                      <Input
                        id={`context-${item.id}`}
                        placeholder="Enter context or additional information..."
                        value={item.context}
                        onChange={(e) => updateItem(item.id, 'context', e.target.value)}
                        disabled={disabled}
                        className="bg-white/50 dark:bg-gray-800/50 border-white/30 dark:border-gray-700/30 focus:ring-orange-500/20 focus:border-orange-500 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* Remove Button */}
                  {!disabled && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(item.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-500/10 focus:ring-red-500/20 mt-1"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {items.length > 0 && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          {items.length} of {maxItems} items • Drag items to reorder
        </div>
      )}
    </div>
  );
}