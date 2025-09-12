"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import axios from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Cuisine name must be at least 2 characters." }),
});

interface CuisineCreateFormProps {
  onSuccess: () => void;
}

export function CuisineCreateForm({ onSuccess }: CuisineCreateFormProps) {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await axios.post("/api/cuisines", values);
      toast.success("Cuisine created successfully.");
      onSuccess();
    } catch (error) {
      console.error("Failed to create cuisine:", error);
      toast.error("Failed to create cuisine.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 glass-effect backdrop-blur-sm bg-white/70 p-4 rounded-lg">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-gray-900 dark:text-gray-100">Cuisine Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Italian" {...field} className="glass-effect backdrop-blur-sm bg-white/70 border-orange-200/50 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={isLoading} className="bg-orange-600 hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800">
            {isLoading ? "Creating..." : "Create Cuisine"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}