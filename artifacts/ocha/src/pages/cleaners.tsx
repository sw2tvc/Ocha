import { useState, useMemo } from "react";
import { useSearch, useLocation } from "wouter";
import { Search, SlidersHorizontal, X, ChevronDown, ArrowLeft } from "lucide-react";
import { useListCleaners, getListCleanersQueryKey } from "@workspace/api-client-react";
import { CleanerCard } from "@/components/cleaner-card";
import { CleanerCardSkeleton } from "@/components/skeleton-loader";
import { FilterSheet, FilterState } from "@/components/filter-sheet";
import { MOCK_CLEANERS } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

/* ── constants ───────────────────────────────── */
const SERVICE_FILTERS = [
  { id: "", label: "All services" },
  { id: "standard", label: "Standard" },
  { id: "deep_clean", label: "Deep Clean" },
  { id: "airbnb_turnover", label: "Airbnb" },
  { id: "end_of_tenancy", label: "End of Tenancy" },
  { id: "office", label: "Office" },
];

const SORT_OPTIONS = [
  { id: "match", label: "Best match" },
  { id: "rating", label: "Top rated" },
  { id: "price_asc", label: "Price: low" },
  { id: "price_desc", label: "Price: high" },
  { id: "response", label: "Fastest response" },
];

const DEFAULT_FILTERS: FilterState = {
  minRate: 0,
  maxRate: 999,
  minRating: 0,
  badge: "",
  availableOnly: false,
};

function countActiveFilters(f: FilterState): number {
  let n = 0;
  if (f.availableOnly) n++;
  if (f.minRate > 0 || f.maxRate < 999) n++;
  if (f.minRating > 0) n++;
  if (f.badge) n++;
  return n;
}

function sortCleaners(list: any[], sortId: string) {
  return [...list].sort((a, b) => {
    switch (sortId) {
      case "rating":
        return (b.averageRating ?? 0) - (a.averageRating ?? 0);
      case "price_asc":
        return (a.hourlyRate ?? 0) - (b.hourlyRate ?? 0);
      case "price_desc":
        return (b.hourlyRate ?? 0) - (a.hourlyRate ?? 0);
      case "response":
        /* parse "< 1 hr" → 60, "< 30 min" → 30 */
        const parse = (r: string) => {
          if (!r) return 999;
          const m = r.match(/(\d+)\s*(min|hr)/);
          if (!m) return 999;
          return Number(m[1]) * (m[2] === "hr" ? 60 : 1);
        };
        return parse(a.responseTime) - parse(b.responseTime);
      default:
        /* best match: available first, then by trust score */
        const aScore = (a.isAvailable ? 1000 : 0) + (a.trustScore ?? 0);
        const bScore = (b.isAvailable ? 1000 : 0) + (b.trustScore ?? 0);
        return bScore - aScore;
    }
  });
}

/* ── component ───────────────────────────────── */
export default function Cleaners() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);

  const [query, setQuery] = useState("");
  const [serviceType, setServiceType] = useState(params.get("serviceType") || "");
  const [sortId, setSortId] = useState("match");
  const [showSort, setShowSort] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pendingFilters, setPendingFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(DEFAULT_FILTERS);

  const activeCount = countActiveFilters(appliedFilters);

  const { data, isLoading } = useListCleaners(
    { serviceType: serviceType || undefined },
    { query: { queryKey: getListCleanersQueryKey({ serviceType }) } }
  );

  const rawCleaners: any[] = data?.cleaners?.length ? data.cleaners : MOCK_CLEANERS;

  const results = useMemo(() => {
    let list = rawCleaners;

    /* text search */
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (c) =>
          c.fullName?.toLowerCase().includes(q) ||
          c.bio?.toLowerCase().includes(q) ||
          c.serviceTypes?.some((s: string) => s.toLowerCase().includes(q))
      );
    }

    /* service type (client-side guard) */
    if (serviceType) {
      list = list.filter((c) => c.serviceTypes?.includes(serviceType));
    }

    /* price range */
    if (appliedFilters.minRate > 0 || appliedFilters.maxRate < 999) {
      list = list.filter(
        (c) =>
          (c.hourlyRate ?? 0) >= appliedFilters.minRate &&
          (c.hourlyRate ?? 0) <= appliedFilters.maxRate
      );
    }

    /* min rating */
    if (appliedFilters.minRating > 0) {
      list = list.filter((c) => (c.averageRating ?? 0) >= appliedFilters.minRating);
    }

    /* trust badge — "trusted" includes both "trusted" and "elite" */
    if (appliedFilters.badge) {
      if (appliedFilters.badge === "trusted") {
        list = list.filter((c) =>
          ["trusted", "elite"].includes(c.verificationBadge)
        );
      } else {
        list = list.filter(
          (c) => c.verificationBadge === appliedFilters.badge ||
                 ["verified", "trusted", "elite"].includes(c.verificationBadge)
        );
      }
    }

    /* available only */
    if (appliedFilters.availableOnly) {
      list = list.filter((c) => c.isAvailable);
    }

    return sortCleaners(list, sortId);
  }, [rawCleaners, query, serviceType, appliedFilters, sortId]);

  const sortLabel = SORT_OPTIONS.find((s) => s.id === sortId)?.label ?? "Sort";

  const clearFilter = (key: keyof FilterState) => {
    const reset: FilterState = { ...appliedFilters };
    if (key === "minRate" || key === "maxRate") {
      reset.minRate = 0;
      reset.maxRate = 999;
    } else if (key === "minRating") {
      reset.minRating = 0;
    } else if (key === "badge") {
      reset.badge = "";
    } else if (key === "availableOnly") {
      reset.availableOnly = false;
    }
    setAppliedFilters(reset);
    setPendingFilters(reset);
  };

  /* active filter chips */
  const activeChips: { label: string; key: keyof FilterState }[] = [];
  if (appliedFilters.availableOnly)
    activeChips.push({ label: "Available now", key: "availableOnly" });
  if (appliedFilters.minRate > 0 || appliedFilters.maxRate < 999)
    activeChips.push({
      label: `£${appliedFilters.minRate}–${appliedFilters.maxRate === 999 ? "∞" : "£" + appliedFilters.maxRate}/hr`,
      key: "minRate",
    });
  if (appliedFilters.minRating > 0)
    activeChips.push({ label: `${appliedFilters.minRating}+ ★`, key: "minRating" });
  if (appliedFilters.badge)
    activeChips.push({ label: appliedFilters.badge.charAt(0).toUpperCase() + appliedFilters.badge.slice(1), key: "badge" });

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-14 pb-3 sticky top-0 z-30">
        <div className="max-w-md mx-auto flex flex-col gap-3">

          {/* Top row */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation("/")}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-base font-bold flex-1">Find a cleaner</h1>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              data-testid="input-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or service…"
              className="w-full pl-9 pr-9 py-2.5 rounded-2xl bg-muted border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Service chips */}
          <div className="flex gap-2 overflow-x-auto -mx-1 px-1" style={{ scrollbarWidth: "none" }}>
            {SERVICE_FILTERS.map((f) => (
              <button
                key={f.id}
                data-testid={`filter-service-${f.id || "all"}`}
                onClick={() => setServiceType(f.id)}
                className={cn(
                  "shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-all whitespace-nowrap",
                  serviceType === f.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Filter + Sort row */}
          <div className="flex items-center gap-2">
            {/* Filter button */}
            <button
              data-testid="button-filters"
              onClick={() => { setPendingFilters(appliedFilters); setSheetOpen(true); }}
              className={cn(
                "flex items-center gap-1.5 text-xs px-3 py-2 rounded-full border font-semibold transition-all",
                activeCount > 0
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:border-primary/40"
              )}
            >
              <SlidersHorizontal size={13} />
              Filters
              {activeCount > 0 && (
                <span className="w-4 h-4 bg-white/30 rounded-full text-[9px] font-bold flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                data-testid="button-sort"
                onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-1 text-xs px-3 py-2 rounded-full border border-border bg-background font-semibold hover:border-primary/40 transition-all"
              >
                {sortLabel}
                <ChevronDown size={12} className={cn("transition-transform", showSort && "rotate-180")} />
              </button>
              {showSort && (
                <div className="absolute left-0 top-full mt-1 bg-card border border-border rounded-2xl shadow-xl py-1 z-20 min-w-[160px]">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => { setSortId(opt.id); setShowSort(false); }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-xs font-medium transition-colors hover:bg-muted",
                        sortId === opt.id ? "text-primary font-semibold" : "text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Result count */}
            <span className="ml-auto text-xs text-muted-foreground font-medium">
              {isLoading ? "…" : `${results.length} found`}
            </span>
          </div>

          {/* Active filter chips */}
          {activeChips.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {activeChips.map((chip) => (
                <button
                  key={chip.key}
                  onClick={() => clearFilter(chip.key)}
                  className="flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                >
                  {chip.label}
                  <X size={10} />
                </button>
              ))}
              <button
                onClick={() => { setAppliedFilters(DEFAULT_FILTERS); setPendingFilters(DEFAULT_FILTERS); }}
                className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-muted text-muted-foreground"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="max-w-md mx-auto w-full px-4 pt-4 flex flex-col gap-3">
        {isLoading ? (
          Array(4).fill(0).map((_, i) => <CleanerCardSkeleton key={i} />)
        ) : results.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Search size={22} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">No cleaners found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Try adjusting your filters or broadening your search.
            </p>
            <button
              onClick={() => {
                setQuery("");
                setServiceType("");
                setAppliedFilters(DEFAULT_FILTERS);
                setPendingFilters(DEFAULT_FILTERS);
              }}
              className="mt-4 text-xs text-primary font-semibold underline underline-offset-2"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          results.map((cleaner) => (
            <CleanerCard key={cleaner.id} cleaner={cleaner as any} />
          ))
        )}
      </div>

      {/* Filter Sheet */}
      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        filters={pendingFilters}
        onChange={setPendingFilters}
        onApply={() => setAppliedFilters(pendingFilters)}
        onReset={() => setPendingFilters(DEFAULT_FILTERS)}
        activeCount={countActiveFilters(pendingFilters)}
      />

      {/* Close sort dropdown on outside click */}
      {showSort && (
        <div className="fixed inset-0 z-10" onClick={() => setShowSort(false)} />
      )}
    </div>
  );
}
