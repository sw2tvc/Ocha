import { useState } from "react";
import { useSearch } from "wouter";
import { Filter, SlidersHorizontal } from "lucide-react";
import { useListCleaners, getListCleanersQueryKey } from "@workspace/api-client-react";
import { CleanerCard } from "@/components/cleaner-card";
import { CleanerCardSkeleton } from "@/components/skeleton-loader";
import { MOCK_CLEANERS } from "@/lib/mock-data";

const SERVICE_FILTERS = [
  { id: "", label: "All" },
  { id: "standard", label: "Standard" },
  { id: "deep_clean", label: "Deep Clean" },
  { id: "airbnb_turnover", label: "Airbnb" },
  { id: "end_of_tenancy", label: "End of Tenancy" },
  { id: "office", label: "Office" },
];

export default function Cleaners() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const [serviceType, setServiceType] = useState(params.get("serviceType") || "");
  const [availableOnly, setAvailableOnly] = useState(true);

  const { data, isLoading } = useListCleaners(
    { serviceType: serviceType || undefined, available: availableOnly || undefined },
    { query: { queryKey: getListCleanersQueryKey({ serviceType, available: availableOnly }) } }
  );

  const apiCleaners = data?.cleaners ?? [];
  const cleaners = apiCleaners.length > 0 ? apiCleaners : MOCK_CLEANERS;
  const filtered = availableOnly ? cleaners.filter((c) => c.isAvailable) : cleaners;

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-14 pb-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-foreground">Cleaners</h1>
            <div className="flex items-center gap-2">
              <button
                data-testid="button-toggle-available"
                onClick={() => setAvailableOnly(!availableOnly)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  availableOnly
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-foreground border-border"
                }`}
              >
                {availableOnly ? "Available now" : "All cleaners"}
              </button>
            </div>
          </div>

          {/* Service filter chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
            {SERVICE_FILTERS.map((f) => (
              <button
                key={f.id}
                data-testid={`filter-service-${f.id || "all"}`}
                onClick={() => setServiceType(f.id)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  serviceType === f.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 pt-4">
        {data && (
          <p className="text-xs text-muted-foreground mb-3" data-testid="text-cleaner-count">
            {filtered.length} cleaner{filtered.length !== 1 ? "s" : ""} {availableOnly ? "available" : "found"}
          </p>
        )}

        <div className="flex flex-col gap-3">
          {isLoading
            ? Array(4).fill(0).map((_, i) => <CleanerCardSkeleton key={i} />)
            : filtered.map((cleaner) => (
                <CleanerCard key={cleaner.id} cleaner={cleaner as any} />
              ))
          }
        </div>

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground text-sm">No cleaners available right now.</p>
            <p className="text-muted-foreground text-xs mt-1">Try removing filters or checking back soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
