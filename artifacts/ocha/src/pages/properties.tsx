import { useLocation, Link } from "wouter";
import { Building2, Plus, ChevronRight, QrCode, Zap } from "lucide-react";
import { useListProperties, getListPropertiesQueryKey } from "@workspace/api-client-react";
import { PropertyCardSkeleton } from "@/components/skeleton-loader";
import { MOCK_PROPERTIES } from "@/lib/mock-data";

const TYPE_LABELS: Record<string, string> = {
  apartment: "Apartment",
  house: "House",
  office: "Office",
  airbnb: "Airbnb",
  hmo: "HMO",
  serviced_accommodation: "Serviced",
  other: "Other",
};

const FREQ_LABELS: Record<string, string> = {
  once: "One-off",
  weekly: "Weekly",
  biweekly: "Fortnightly",
  monthly: "Monthly",
  on_demand: "On demand",
};

export default function Properties() {
  const [, setLocation] = useLocation();

  const { data, isLoading } = useListProperties({
    query: { queryKey: getListPropertiesQueryKey() },
  });

  const properties = data?.properties || MOCK_PROPERTIES;

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-background">
      <div className="bg-card border-b border-border px-4 pt-14 pb-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">Properties</h1>
          <button
            data-testid="button-add-property"
            onClick={() => setLocation("/properties/new")}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-2 rounded-xl"
          >
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 pt-4 flex flex-col gap-3">
        {isLoading ? (
          Array(2).fill(0).map((_, i) => <PropertyCardSkeleton key={i} />)
        ) : properties.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Building2 size={22} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">No properties yet</p>
            <p className="text-xs text-muted-foreground mt-1">Add a property profile to book faster.</p>
            <button
              data-testid="button-add-first-property"
              onClick={() => setLocation("/properties/new")}
              className="mt-4 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-xl"
            >
              Add your first property
            </button>
          </div>
        ) : (
          properties.map((prop) => (
            <div
              key={prop.id}
              data-testid={`card-property-${prop.id}`}
              className="bg-card border border-border rounded-2xl overflow-hidden"
            >
              {prop.photoUrl && (
                <img
                  src={prop.photoUrl}
                  alt={prop.name}
                  className="w-full h-36 object-cover"
                />
              )}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="text-sm font-bold text-foreground" data-testid={`text-property-name-${prop.id}`}>{prop.name}</h3>
                    <p className="text-xs text-muted-foreground">{prop.addressLine1}, {prop.city}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                      {TYPE_LABELS[prop.propertyType] || prop.propertyType}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{prop.cleaningFrequency ? (FREQ_LABELS[prop.cleaningFrequency] || prop.cleaningFrequency) : ""}</span>
                  </div>
                </div>

                {prop.accessNotes && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-1">
                    Access: {prop.accessNotes}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    data-testid={`button-book-property-${prop.id}`}
                    onClick={() => setLocation(`/book?propertyId=${prop.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold py-2 rounded-xl"
                  >
                    <Zap size={12} />
                    Book Clean
                  </button>
                  <button
                    data-testid={`button-view-property-${prop.id}`}
                    onClick={() => setLocation(`/properties/${prop.id}`)}
                    className="px-3 py-2 border border-border rounded-xl"
                  >
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </button>
                  {prop.qrCodeUrl && (
                    <button
                      data-testid={`button-qr-property-${prop.id}`}
                      onClick={() => setLocation(`/properties/${prop.id}`)}
                      className="px-3 py-2 border border-border rounded-xl"
                    >
                      <QrCode size={14} className="text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
