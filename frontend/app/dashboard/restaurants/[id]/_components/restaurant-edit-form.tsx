"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form } from "@/components/ui/form";
import { Restaurant } from "@/lib/types";
import { useRestaurantForm } from "@/lib/hooks/useRestaurantForm";
import { BasicInformationSection } from "./form-sections/basic-information-section";
import { AddressSection } from "./form-sections/address-section";
import { LocationCoordinatesSection } from "./form-sections/location-coordinates-section";
import { GoogleIntegrationSection } from "./form-sections/google-integration-section";
import { FormActions } from "./form-sections/form-actions";



interface RestaurantEditFormProps {
  restaurant: Restaurant;
  onSave: () => void;
  onCancel: () => void;
}

export function RestaurantEditForm({
  restaurant,
  onSave,
  onCancel,
}: RestaurantEditFormProps) {
  const { form, isSubmitting, onSubmit, handleCancel } = useRestaurantForm({
    restaurant,
    onSuccess: onSave,
    onCancel,
  });

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle id="restaurant-edit-title">
          Edit Restaurant Details
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            aria-labelledby="restaurant-edit-title"
            noValidate
          >
            <BasicInformationSection control={form.control} errors={form.formState.errors} />

            <AddressSection control={form.control} errors={form.formState.errors} />

            <LocationCoordinatesSection control={form.control} errors={form.formState.errors} />

            <GoogleIntegrationSection control={form.control} errors={form.formState.errors} />

            <FormActions
              isSubmitting={isSubmitting}
              onCancel={handleCancel}
              submitText="Save Changes"
            />
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
