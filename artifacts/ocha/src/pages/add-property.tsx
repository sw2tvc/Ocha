import { useLocation, useSearch } from "wouter";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCreateProperty, getListPropertiesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(1, "Property name is required"),
  propertyType: z.string().min(1, "Select a property type"),
  addressLine1: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  postcode: z.string().min(1, "Postcode is required"),
  accessNotes: z.string().optional(),
  parkingInfo: z.string().optional(),
  petsInfo: z.string().optional(),
  cleaningFrequency: z.string().optional(),
  bedroomCount: z.coerce.number().optional(),
  bathroomCount: z.coerce.number().optional(),
  sqft: z.coerce.number().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AddProperty() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const returnTo = params.get("returnTo");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createProperty = useCreateProperty();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      propertyType: "apartment",
      cleaningFrequency: "on_demand",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createProperty.mutateAsync({ data: data as any });
      await queryClient.invalidateQueries({ queryKey: getListPropertiesQueryKey() });
      toast({ title: "Property added", description: `${data.name} is now available for booking.` });
      setLocation(returnTo || "/properties");
    } catch {
      toast({ title: "Failed to save property", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-28 bg-background">
      <div className="bg-card border-b border-border px-4 pt-14 pb-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            data-testid="button-back"
            onClick={() => setLocation(returnTo || "/properties")}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base font-bold">Add Property</h1>
            {returnTo && <p className="text-xs text-muted-foreground">Saved, you'll return to booking</p>}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 pt-5">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Property Info</p>

              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Property Name</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-property-name" placeholder="e.g. Shoreditch Studio" className="rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="propertyType" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-property-type" className="rounded-xl">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[
                        { value: "apartment", label: "Apartment" },
                        { value: "house", label: "House" },
                        { value: "airbnb", label: "Airbnb" },
                        { value: "office", label: "Office" },
                        { value: "hmo", label: "HMO" },
                        { value: "serviced_accommodation", label: "Serviced Accommodation" },
                        { value: "other", label: "Other" },
                      ].map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="addressLine1" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Address</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-address" placeholder="14 Example Street" className="rounded-xl" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-3">
                <FormField control={form.control} name="city" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">City</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-city" placeholder="London" className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="postcode" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs text-muted-foreground">Postcode</FormLabel>
                    <FormControl>
                      <Input {...field} data-testid="input-postcode" placeholder="EC2A 3NZ" className="rounded-xl" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {["bedroomCount", "bathroomCount", "sqft"].map((name) => (
                  <FormField key={name} control={form.control} name={name as any} render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-muted-foreground capitalize">
                        {name === "sqft" ? "Sq ft" : name === "bedroomCount" ? "Beds" : "Baths"}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min={0} data-testid={`input-${name}`} className="rounded-xl" />
                      </FormControl>
                    </FormItem>
                  )} />
                ))}
              </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Access & Notes</p>

              <FormField control={form.control} name="accessNotes" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Access Notes</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      data-testid="input-access-notes"
                      placeholder="Key location, entry codes, lift instructions..."
                      rows={3}
                      className="w-full bg-background border border-input rounded-xl px-3 py-2 text-sm outline-none resize-none text-foreground placeholder:text-muted-foreground focus:border-primary transition-colors"
                    />
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="parkingInfo" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Parking</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-parking" placeholder="Parking availability..." className="rounded-xl" />
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="petsInfo" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Pets</FormLabel>
                  <FormControl>
                    <Input {...field} data-testid="input-pets" placeholder="No pets / 1 dog..." className="rounded-xl" />
                  </FormControl>
                </FormItem>
              )} />

              <FormField control={form.control} name="cleaningFrequency" render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs text-muted-foreground">Cleaning Frequency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-frequency" className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {[
                        { value: "on_demand", label: "On demand" },
                        { value: "weekly", label: "Weekly" },
                        { value: "biweekly", label: "Fortnightly" },
                        { value: "monthly", label: "Monthly" },
                        { value: "once", label: "One-off" },
                      ].map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )} />
            </div>

            <button
              type="submit"
              data-testid="button-save-property"
              disabled={createProperty.isPending}
              className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-sm disabled:opacity-60 active:opacity-80 transition-opacity"
            >
              {createProperty.isPending ? "Saving…" : returnTo ? "Save & Return to Booking" : "Save Property"}
            </button>
          </form>
        </Form>
      </div>
    </div>
  );
}
