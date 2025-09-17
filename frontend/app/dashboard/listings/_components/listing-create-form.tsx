"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  restaurant_id: z.string().min(1, { message: "Restaurant ID is required." }),
  video_id: z.string().min(1, { message: "Video ID is required." }),
  influencer_id: z.string().min(1, { message: "Influencer ID is required." }),
  visit_date: z.date({ message: "Visit date is required." }),
  quotes: z.string().min(1, { message: "Quotes are required." }),
  context: z.string().optional(),
  confidence_score: z.number().min(0).max(100).optional(),
  approved: z.boolean(),
});

type ListingFormValues = z.infer<typeof formSchema>;

interface ListingCreateFormProps {
  onSuccess: () => void;
}

export function ListingCreateForm({ onSuccess }: ListingCreateFormProps) {
  const [loading, setLoading] = useState(false);

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      restaurant_id: "",
      video_id: "",
      influencer_id: "",
      visit_date: new Date(),
      quotes: "",
      context: "",
      confidence_score: 0,
      approved: false,
    },
  });

  const onSubmit = async (values: ListingFormValues) => {
    setLoading(true);
    try {
      await axios.post("/api/admin/listings", values);
      toast.success("Listing created successfully!");
      form.reset();
      onSuccess();
    } catch (error) {
      toast.error("Failed to create listing.");
      console.error("Failed to create listing:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="restaurant_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Restaurant ID</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter restaurant ID" 
                  className="glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="video_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Video ID</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter video ID" 
                  className="glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="influencer_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Influencer ID</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter influencer ID" 
                  className="glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="visit_date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Visit Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500",
                        !field.value && "text-gray-500 dark:text-gray-400"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="quotes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quotes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter quotes" 
                  className="glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="context"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Context</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter context" 
                  className="glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confidence_score"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confidence Score</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  placeholder="Enter confidence score (0-100)" 
                  className="glass-effect backdrop-blur-sm bg-white/10 dark:bg-gray-900/10 border border-white/20 dark:border-gray-700/30 focus:border-orange-500 focus:ring-orange-500" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="approved"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Approved</FormLabel>
                <FormDescription>
                  Check this box if the listing is approved.
                </FormDescription>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button 
          type="submit" 
          disabled={loading}
          className="bg-orange-600 hover:bg-orange-700 focus:ring-orange-500 focus:border-orange-500 cursor-pointer"
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            "Create Listing"
          )}
        </Button>
      </form>
    </Form>
  );
}