import { useState } from "react";
import { useLocation } from "wouter";
import { MapPin, ChevronRight, Zap, Clock, Sparkles, ArrowRight, List, Map, ShieldCheck } from "lucide-react";
import { useListCleaners, useGetNearbyAvailability, getListCleanersQueryKey } from "@workspace/api-client-react";
import { CleanerCard } from "@/components/cleaner-card";
import { CleanerCardSkeleton } from "@/components/skeleton-loader";
import { CleanerMap } from "@/components/cleaner-map";
import { UpcomingBookingCard } from "@/components/upcoming-booking-card";
import { MOCK_CLEANERS } from "@/lib/mock-data";

const SERVICE_TYPES = [
  { id: "standard",        label: "Standard",       icon: Sparkles,   desc: "Regular clean" },
  { id: "deep_clean",      label: "Deep Clean",     icon: Zap,        desc: "Thorough top-to-bottom" },
  { id: "airbnb_turnover", label: "Airbnb",         icon: Clock,      desc: "Fast turnover" },
  { id: "end_of_tenancy",  label: "End of Tenancy", icon: ArrowRight, desc: "Move out clean" },
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
    <div className="flex flex-col min-h-screen pb-20 md:pb-8 bg-background">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="bg-primary text-primary-foreground px-5 pt-14 md:pt-8 pb-8">
        <div className="max-w-md mx-auto md:max-w-none">
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

      {/* ══════════ MOBILE LAYOUT (< md) ══════════════════════ */}
      <div className="md:hidden max-w-md mx-auto w-full px-4 -mt-4 flex flex-col gap-5">

        <UpcomingBookingCard />

        {/* Search card */}
        <div className="bg-card rounded-2xl border border-border shadow-sm p-4 flex flex-col gap-4">
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

        {/* Nearby section with list/map toggle */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Available Now</h2>
            <div className="flex items-center gap-2">
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

        {/* Trust callout */}
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

      {/* ══════════ DESKTOP LAYOUT (md+) ══════════════════════ */}
      <div className="hidden md:flex gap-6 px-6 py-6 -mt-4 items-start">

        {/* LEFT: geographic map panel — visible on xl+ */}
        <aside className="hidden xl:flex flex-col gap-4 w-[260px] shrink-0 sticky top-6 self-start">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nearby</p>
              {nearbyCount > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-[10px] font-medium text-muted-foreground">{nearbyCount} available</span>
                </div>
              )}
            </div>
            <CleanerMap cleaners={cleaners as any[]} height={300} />
            <div className="px-4 py-2 border-t border-border">
              <p className="text-[10px] text-muted-foreground">Click a pin to view profile</p>
            </div>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <ShieldCheck size={14} className="text-primary shrink-0" />
              <span className="text-xs font-bold text-primary uppercase tracking-wide">Identity-verified</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every cleaner is identity-checked and reputation-scored before joining Ocha.
            </p>
          </div>
        </aside>

        {/* CENTRE: cleaner discovery feed */}
        <div className="flex-1 min-w-0 flex flex-col gap-5">

          {/* Service type + urgency selector */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Service Type</p>
              <div className="flex bg-muted rounded-lg p-0.5">
                {URGENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSelectedUrgency(opt.id)}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      selectedUrgency === opt.id
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {SERVICE_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = selectedService === type.id;
                return (
                  <button
                    key={type.id}
                    data-testid={`button-service-${type.id}-desktop`}
                    onClick={() => setSelectedService(type.id)}
                    className={`flex flex-col items-start px-3 py-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-background text-foreground hover:border-primary/40"
                    }`}
                  >
                    <Icon size={15} strokeWidth={2} className="mb-1.5" />
                    <span className="text-xs font-semibold leading-tight">{type.label}</span>
                    <span className="text-[10px] text-muted-foreground mt-0.5">{type.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Available cleaners */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wide">Available Now</h2>
              <button
                onClick={() => setLocation("/cleaners")}
                className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline"
              >
                Browse all <ChevronRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              {isLoading
                ? Array(4).fill(0).map((_, i) => <CleanerCardSkeleton key={i} />)
                : cleaners.filter((c) => c.isAvailable).slice(0, 6).map((cleaner) => (
                    <CleanerCard key={cleaner.id} cleaner={cleaner as any} />
                  ))
              }
            </div>
          </div>
        </div>

        {/* RIGHT: booking panel — visible on lg+ */}
        <aside className="hidden lg:flex flex-col gap-4 w-[252px] shrink-0 sticky top-6 self-start">

          <UpcomingBookingCard />

          <div className="bg-card rounded-2xl border border-border shadow-sm p-4 flex flex-col gap-3">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Book a Clean</p>
            <div>
              <label className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide mb-1.5 block">Location</label>
              <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                <MapPin size={13} className="text-primary shrink-0" />
                <input
                  data-testid="input-location-desktop"
                  className="bg-transparent text-xs flex-1 outline-none text-foreground placeholder:text-muted-foreground"
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="Your location"
                />
              </div>
            </div>
            <button
              data-testid="button-search-cleaners-desktop"
              onClick={handleSearch}
              className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 font-semibold text-xs hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
            >
              Find Cleaners <ChevronRight size={13} />
            </button>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-xs font-semibold text-foreground">{nearbyCount} cleaners nearby</p>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              ~{waitTime} min average arrival · Identity-verified only
            </p>
            <button
              onClick={() => setLocation("/cleaners")}
              className="mt-1 flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline"
            >
              <Zap size={12} />
              Book for today
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
