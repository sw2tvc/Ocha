import { useLocation } from "wouter";
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
    <div className="flex flex-col min-h-screen pb-8 bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 pt-8 pb-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Portfolio</p>
            <h1 className="text-2xl font-bold text-foreground">Properties</h1>
          </div>
          <button
            data-testid="button-add-property"
            onClick={() => setLocation("/properties/new")}
            className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-4 py-2.5 rounded-xl"
          >
            <Plus size={16} />
            Add Property
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-6 pt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(3).fill(0).map((_, i) => <PropertyCardSkeleton key={i} />)}
          </div>
        ) : properties.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Building2 size={26} className="text-muted-foreground" />
            </div>
            <p className="text-base font-semibold text-foreground">No properties yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add a property to start booking cleaners faster.</p>
            <button
              data-testid="button-add-first-property"
              onClick={() => setLocation("/properties/new")}
              className="mt-5 bg-primary text-primary-foreground text-sm font-semibold px-6 py-3 rounded-xl"
            >
              Add your first property
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {properties.map((prop) => (
              <div
                key={prop.id}
                data-testid={`card-property-${prop.id}`}
                className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col"
              >
                {prop.photoUrl && (
                  <img
                    src={prop.photoUrl}
                    alt={prop.name}
                    className="w-full h-44 object-cover"
                  />
                )}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-foreground" data-testid={`text-property-name-${prop.id}`}>{prop.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{prop.addressLine1}, {prop.city}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                        {TYPE_LABELS[prop.propertyType] || prop.propertyType}
                      </span>
                      {prop.cleaningFrequency && (
                        <span className="text-[10px] text-muted-foreground">
                          {FREQ_LABELS[prop.cleaningFrequency] || prop.cleaningFrequency}
                        </span>
                      )}
                    </div>
                  </div>

                  {prop.accessNotes && (
                    <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
                      Access: {prop.accessNotes}
                    </p>
                  )}

                  <div className="flex gap-2 mt-auto">
                    <button
                      data-testid={`button-book-property-${prop.id}`}
                      onClick={() => setLocation(`/book?propertyId=${prop.id}`)}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold py-2.5 rounded-xl"
                    >
                      <Zap size={13} />
                      Book Clean
                    </button>
                    <button
                      data-testid={`button-view-property-${prop.id}`}
                      onClick={() => setLocation(`/book?propertyId=${prop.id}`)}
                      className="px-3 py-2.5 border border-border rounded-xl"
                    >
                      <ChevronRight size={15} className="text-muted-foreground" />
                    </button>
                    {prop.qrCodeUrl && (
                      <button
                        data-testid={`button-qr-property-${prop.id}`}
                        onClick={() => setLocation(`/book?propertyId=${prop.id}`)}
                        className="px-3 py-2.5 border border-border rounded-xl"
                      >
                        <QrCode size={15} className="text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
