'use client';

import { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  id: string;
}

interface AsyncSearchableSelectProps {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  errorMessage?: string;
  fetchOptions: (query: string) => Promise<SelectOption[]>;
  disabled?: boolean;
  className?: string;
}

export function AsyncSearchableSelect({
  value,
  onValueChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  emptyMessage = "No options found",
  errorMessage = "Failed to load options",
  fetchOptions,
  disabled = false,
  className
}: AsyncSearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [options, setOptions] = useState<SelectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<SelectOption | null>(null);
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Prevent body scroll when dropdown is open
  useEffect(() => {
    if (open) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  // Find selected option when value changes
  useEffect(() => {
    if (value && options.length > 0) {
      const option = options.find(opt => opt.value === value);
      setSelectedOption(option || null);
    } else if (!value) {
      setSelectedOption(null);
    }
  }, [value, options]);

  // Fetch options when search query changes
  useEffect(() => {
    if (!open) return;

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      
      try {
        abortControllerRef.current = new AbortController();
        const results = await fetchOptions(searchQuery);
        
        if (!abortControllerRef.current.signal.aborted) {
          setOptions(results);
        }
      } catch (err) {
        if (!abortControllerRef.current?.signal.aborted) {
          setError(errorMessage);
          setOptions([]);
        }
      } finally {
        if (!abortControllerRef.current?.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, open, fetchOptions, errorMessage]);

  // Initial load when popover opens
  useEffect(() => {
    if (open && options.length === 0 && !loading && !error) {
      setSearchQuery(''); // Trigger initial fetch
    }
  }, [open, options.length, loading, error]);

  const handleSelect = (option: SelectOption) => {
    setSelectedOption(option);
    onValueChange(option.value);
    setOpen(false);
    setSearchQuery('');
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setSearchQuery('');
      setError(null);
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 hover:bg-white/20 dark:hover:bg-gray-800/20 focus:border-orange-500 focus:ring-orange-500 cursor-pointer",
            !selectedOption && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="flex items-center border-b px-3">
          <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus:ring-0"
          />
        </div>
        
        <div 
          className="max-h-60 overflow-y-auto p-1"
          onWheel={(e) => {
            // Enable smooth scrolling with mouse wheel
            e.stopPropagation();
          }}
        >
          {loading && (
            <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading options...
            </div>
          )}
          
          {error && (
            <div className="flex items-center justify-center py-6 text-sm text-red-500">
              <AlertCircle className="mr-2 h-4 w-4" />
              {error}
            </div>
          )}
          
          {!loading && !error && options.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          )}
          
          {!loading && !error && options.length > 0 && (
            <div className="space-y-1">
              {options.map((option) => (
                <Button
                  key={option.value}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start font-normal cursor-pointer text-left transition-all duration-200",
                    selectedOption?.value === option.value 
                      ? "bg-orange-500/15 border-l-4 border-orange-500 text-orange-700 hover:bg-orange-500/20" 
                      : "hover:bg-orange-500/10 focus:bg-orange-500/10"
                  )}
                  onClick={() => handleSelect(option)}
                >
                  <span className="truncate text-left pl-1">{option.label}</span>
                </Button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}