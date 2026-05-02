import { useState } from "react";
import { useLocation } from "wouter";
import { MapPin, ChevronRight, Zap, Clock, Sparkles, ArrowRight, List, Map } from "lucide-react";
import { useListCleaners, useGetNearbyAvailability, getListCleanersQueryKey } from "@workspace/api-client-react";
import { CleanerCard } from "@/components/cleaner-card";
import { CleanerCardSkeleton } from "@/components/skeleton-loader";
import { CleanerMap } from "@/components/cleaner-map";
import { UpcomingBookingCard } from "@/components/upcoming-booking-card";
import { MOCK_CLEANERS } from "@/lib/mock-data";

const SERVICE_TYPES = [
  { id: "standard",        label: "Standard",         icon: Sparkles,  desc: "Regular clean" },
  { id: "deep_clean",      label: "Deep Clean",        icon: Zap,       desc: "Thorough top-to-bottom" },
  { id: "airbnb_turnover", label: "Airbnb",            icon: Clock,     desc: "Fast turnover" },
  { id: "end_of_tenancy",  label: "End of Tenancy",    icon: ArrowRight, desc: "Move out clean" },
];

const URGENCY_OPTIONS = [
  { id: "standard",  label: "Anytime", sub: "Best price" },
  { id: "urgent",    label: "Today",   sub: "Within 4 hours" },
  { id: "emergency", label: "Now",     sub: "ASAP" },
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [selectedService, setSelectedService] = useState("standard");
  const [selectedUrgency, setSelectedUrgency] = useState("standard");
  const [locationInput, setLocationInput] = useState("London, UK");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const { data: nearbyData } = useGetNearbyAvailability(
    { lat: 51.515, lng: -0.09, radius: 10 },
    { query: { queryKey: ["nearby-availability"] } }
  );

  const { data: cleanersData, isLoading } = useListCleaners(
    { available: true, serviceType: selectedService, limit: 8 },
    { query: { queryKey: getListCleanersQueryKey({ available: true, serviceType: selectedService }) } }
  );

  const apiCleaners = cleanersData?.cleaners ?? [];
  const cleaners = apiCleaners.length > 0 ? apiCleaners : MOCK_CLEANERS;
  const nearbyCount = nearbyData?.nearbyCount ?? cleaners.filter((c) => c.isAvailable).length;
  const waitTime = nearbyData?.estimatedWaitMinutes ?? 20;

  const handleSearch = () => {
    setLocation(`/cleaners?serviceType=${selectedService}&urgency=${selectedUrgency}`);
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-background">
      {/* ── Header ── */}
      <div className="bg-primary text-primary-foreground px-5 pt-14 pb-8">
        <div className="max-w-md mx-auto">
          <p className="text-primary-foreground/60 text-xs font-medium tracking-widest uppercase mb-1">Ocha</p>
          <h1 className="text-2xl font-bold leading-tight mb-1">Find a trusted cleaner nearby</h1>
          {nearbyCount > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm text-primary-foreground/80">
                {nearbyCount} cleaner{nearbyCount !== 1 ? "s" : ""} nearby · ~{waitTime} min
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 -mt-4 flex flex-col gap-5">
        {/* ── Upcoming booking live card ── */}
        <UpcomingBookingCard />

        {/* ── Search card ── */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4 flex flex-col gap-4">
          {/* Location */}
          <div>
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1.5 block">Location</label>
            <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
              <MapPin size={16} className="text-primary shrink-0" />
              <input
                data-testid="input-location"
                className="bg-transparent text-sm flex-1 outline-none text-foreground placeholder:text-muted-foreground"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Enter your location"
              />
            </div>
          </div>

          {/* Service type */}
          <div>
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1.5 block">Service</label>
            <div className="grid grid-cols-2 gap-2">
              {SERVICE_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedService === type.id;
                return (
                  <button
                    key={type.id}
                    data-testid={`button-service-${type.id}`}
                    onClick={() => setSelectedService(type.id)}
                    className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-background text-foreground"
                    }`}
                  >
                    <Icon size={15} strokeWidth={2} className="mb-1" />
                    <span className="text-xs font-semibold">{type.label}</span>
                    <span className="text-[10px] text-muted-foreground">{type.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Urgency */}
          <div>
            <label className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1.5 block">When</label>
            <div className="flex gap-2">
              {URGENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  data-testid={`button-urgency-${opt.id}`}
                  onClick={() => setSelectedUrgency(opt.id)}
                  className={`flex-1 py-2 px-3 rounded-xl border text-center transition-all ${
                    selectedUrgency === opt.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border bg-background"
                  }`}
                >
                  <div className="text-xs font-semibold">{opt.label}</div>
                  <div className="text-[10px] text-muted-foreground">{opt.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <button
            data-testid="button-search-cleaners"
            onClick={handleSearch}
            className="w-full bg-primary text-primary-foreground rounded-xl py-3 font-semibold text-sm hover:opacity-90 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            View Available Cleaners
            <ChevronRight size={16} />
          </button>
        </div>

        {/* ── Nearby section with list/map toggle ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Available Now</h2>
            <div className="flex items-center gap-2">
              {/* List / Map toggle */}
              <div className="flex bg-muted rounded-lg p-0.5 gap-0.5">
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                    viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  <List size={11} />
                  List
                </button>
                <button
                  onClick={() => setViewMode("map")}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold transition-all ${
                    viewMode === "map" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  <Map size={11} />
                  Map
                </button>
              </div>
              {viewMode === "list" && (
                <button
                  data-testid="link-view-all-cleaners"
                  onClick={() => setLocation("/cleaners")}
                  className="text-xs text-primary font-medium flex items-center gap-0.5"
                >
                  See all <ChevronRight size={12} />
                </button>
              )}
            </div>
          </div>

          {/* ── Map view ── */}
          {viewMode === "map" && (
            <div className="flex flex-col gap-3">
              {isLoading ? (
                <div className="h-[320px] rounded-2xl bg-muted animate-pulse" />
              ) : (
                <CleanerMap cleaners={cleaners as any[]} />
              )}
              <p className="text-[10px] text-muted-foreground text-center">
                Tap a cleaner pin to see their details and book
              </p>
            </div>
          )}

          {/* ── List view ── */}
          {viewMode === "list" && (
            <div className="flex flex-col gap-3">
              {isLoading
                ? Array(3).fill(0).map((_, i) => <CleanerCardSkeleton key={i} />)
                : cleaners.filter((c) => c.isAvailable).slice(0, 4).map((cleaner) => (
                    <CleanerCard key={cleaner.id} cleaner={cleaner as any} />
                  ))
              }
            </div>
          )}
        </div>

        {/* ── Trust callout ── */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-primary" />
            </div>
            <span className="text-xs font-bold text-primary uppercase tracking-wide">Identity-verified only</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Every cleaner on Ocha is identity-checked and reputation-scored. Your trust score grows with every reliable interaction.
          </p>
        </div>
      </div>
    </div>
  );
}
