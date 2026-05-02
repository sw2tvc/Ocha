import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import {
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Building2,
  Clock,
  AlertCircle,
  Plus,
  CheckCircle2,
  Loader2,
  XCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  useListProperties,
  useCreateBooking,
  getListPropertiesQueryKey,
  getListBookingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MOCK_PROPERTIES } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SERVICES = [
  { id: "standard",       label: "Standard Clean",    desc: "Regular cleaning, 2-3 hrs",  price: 45 },
  { id: "deep_clean",     label: "Deep Clean",         desc: "Thorough clean, 4-5 hrs",   price: 90 },
  { id: "airbnb_turnover",label: "Airbnb Turnover",    desc: "Quick turnover, 2 hrs",     price: 55 },
  { id: "end_of_tenancy", label: "End of Tenancy",     desc: "Full clean, 5-6 hrs",       price: 150 },
];

const URGENCY = [
  { id: "standard",  label: "Anytime", sub: "Best price" },
  { id: "urgent",    label: "Today",   sub: "+10%" },
  { id: "emergency", label: "Now",     sub: "+25%" },
];

const URGENCY_MULTIPLIER: Record<string, number> = { standard: 1, urgent: 1.1, emergency: 1.25 };
const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ═══════════════════════ Availability calendar picker ═══════════════════════ */
type DayStatus = "available" | "blocked" | "booked" | "past" | "today";

interface CalDay { date: string; status: DayStatus }

function AvailabilityCalendarPicker({
  cleanerId,
  selectedDate,
  onSelect,
}: {
  cleanerId: string;
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const initMonth = selectedDate ? Number(selectedDate.split("-")[1]) : now.getMonth() + 1;
  const initYear  = selectedDate ? Number(selectedDate.split("-")[0]) : now.getFullYear();

  const [year, setYear]   = useState(initYear);
  const [month, setMonth] = useState(initMonth);

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  const { data, isLoading } = useQuery<{ days: CalDay[]; nextAvailable?: string }>({
    queryKey: ["book-cal", cleanerId, monthStr],
    queryFn: async () => {
      const res = await fetch(
        `${import.meta.env.BASE_URL}api/cleaners/${cleanerId}/calendar?month=${monthStr}`
      );
      if (!res.ok) throw new Error("Failed to load availability");
      return res.json();
    },
    staleTime: 60_000,
  });

  const days = (data?.days ?? []).map((d) => ({
    ...d,
    status: (d.date === todayStr && d.status === "available" ? "today" : d.status) as DayStatus,
  }));

  const firstDate = days[0]?.date;
  const startPad  = firstDate
    ? (() => { const dow = new Date(firstDate + "T00:00:00").getDay(); return dow === 0 ? 6 : dow - 1; })()
    : 0;
  const grid: (CalDay | null)[] = [...Array(startPad).fill(null), ...days];
  while (grid.length % 7 !== 0) grid.push(null);

  const monthLabel = new Date(year, month - 1, 1).toLocaleString("en-GB", { month: "long", year: "numeric" });

  const isPrevDisabled = year === now.getFullYear() && month <= now.getMonth() + 1;

  const prevMonth = () => {
    if (isPrevDisabled) return;
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const tappable = (s: DayStatus) => s === "available" || s === "today";

  const nextAvailable = data?.nextAvailable
    ? new Date(data.nextAvailable + "T00:00:00").toLocaleDateString("en-GB", {
        weekday: "short", day: "numeric", month: "short",
      })
    : null;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold text-foreground">Pick a date</h2>
          {nextAvailable && !selectedDate && (
            <span className="text-[10px] text-primary font-medium">Next available: {nextAvailable}</span>
          )}
        </div>

        <div className="bg-card border border-border rounded-2xl p-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={prevMonth}
              disabled={isPrevDisabled}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                isPrevDisabled ? "opacity-30 cursor-default" : "bg-muted hover:bg-muted/70"
              )}
            >
              <ChevronLeft size={16} />
            </button>
            <p className="text-sm font-bold text-foreground">{monthLabel}</p>
            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_HEADERS.map((d) => (
              <div key={d} className="text-center text-[9px] font-bold text-muted-foreground/60 uppercase py-0.5">
                {d}
              </div>
            ))}
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={20} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {grid.map((day, i) => {
                if (!day) return <div key={`pad-${i}`} />;
                const dayNum = Number(day.date.split("-")[2]);
                const isSelected = day.date === selectedDate;
                const ok = tappable(day.status);

                const base = "aspect-square rounded-xl flex flex-col items-center justify-center text-xs transition-all";

                const style = isSelected
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : day.status === "today"
                    ? "bg-primary/10 text-primary font-semibold ring-1 ring-primary/30"
                    : day.status === "available"
                      ? "bg-primary/8 text-primary/90 font-medium hover:bg-primary/15"
                      : day.status === "blocked"
                        ? "bg-muted text-muted-foreground/40 cursor-not-allowed"
                        : day.status === "booked"
                          ? "bg-amber-50 text-amber-400 cursor-not-allowed"
                          : "text-muted-foreground/25 cursor-default";

                return (
                  <button
                    key={day.date}
                    onClick={() => ok && onSelect(day.date)}
                    disabled={!ok}
                    className={cn(base, style)}
                    title={
                      day.status === "blocked" ? "Unavailable" :
                      day.status === "booked"  ? "Already booked" :
                      day.status === "past"    ? "Past date" : undefined
                    }
                  >
                    <span className="leading-none">{dayNum}</span>
                    {day.status === "booked" && (
                      <div className="w-1 h-1 rounded-full bg-amber-400 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border flex-wrap">
            {[
              { dot: "bg-primary/50",          label: "Available" },
              { dot: "bg-muted-foreground/30",  label: "Unavailable" },
              { dot: "bg-amber-300",            label: "Already booked" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1">
                <div className={cn("w-2 h-2 rounded-sm", l.dot)} />
                <span className="text-[9px] text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected date confirmation chip */}
      {selectedDate && (
        <div className="flex items-center gap-2 bg-primary/8 border border-primary/20 rounded-xl px-3 py-2.5">
          <CheckCircle2 size={14} className="text-primary shrink-0" />
          <p className="text-sm font-semibold text-primary flex-1">
            {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-GB", {
              weekday: "long", day: "numeric", month: "long",
            })}
          </p>
          <button onClick={() => onSelect("")} className="text-muted-foreground hover:text-foreground">
            <XCircle size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════ Main page ═══════════════════════════════ */
export default function Book() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const cleanerId  = params.get("cleanerId")   || "cleaner-1";
  const prefillDate= params.get("date")         || "";
  const { toast }  = useToast();
  const queryClient = useQueryClient();

  const prefillProperty = params.get("propertyId") || "";
  const prefillService  = params.get("serviceType") || "standard";
  const isRebook = !!(params.get("propertyId") || params.get("serviceType"));

  const [step, setStep]                   = useState(1);
  const [selectedProperty, setSelectedProperty] = useState<string>(prefillProperty);
  const [selectedService, setSelectedService]   = useState(
    SERVICES.find((s) => s.id === prefillService) ? prefillService : "standard"
  );
  const [selectedUrgency, setSelectedUrgency]   = useState("standard");
  const [selectedDate, setSelectedDate]         = useState(prefillDate);
  const [selectedTime, setSelectedTime]         = useState("10:00");
  const [notes, setNotes]                       = useState("");
  const [isSubmitting, setIsSubmitting]         = useState(false);

  const { data: propertiesData } = useListProperties({
    query: { queryKey: getListPropertiesQueryKey() },
  });

  const createBookingMutation = useCreateBooking();

  const apiProperties = propertiesData?.properties ?? [];
  const properties = apiProperties.length > 0 ? apiProperties : MOCK_PROPERTIES;
  const selectedServiceData = SERVICES.find((s) => s.id === selectedService)!;
  const urgencyMultiplier = URGENCY_MULTIPLIER[selectedUrgency] ?? 1;
  const estimatedPrice = Math.round(selectedServiceData.price * urgencyMultiplier);

  const handleNext = () => {
    if (step === 1 && !selectedProperty) {
      toast({ title: "Select a property", description: "Please choose which property to clean." });
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast({ title: "Select a date", description: "Please tap an available date on the calendar." });
      return;
    }
    setIsSubmitting(true);
    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00`).toISOString();
      const durationHours = selectedServiceData.price / 22;
      await createBookingMutation.mutateAsync({
        data: {
          cleanerId,
          propertyId: selectedProperty,
          serviceType: selectedService as any,
          scheduledAt,
          estimatedDurationHours: durationHours,
          urgency: selectedUrgency as any,
          notes,
        },
      });
      await queryClient.invalidateQueries({ queryKey: getListBookingsQueryKey({ role: "customer" }) });
      toast({ title: "Booking requested!", description: "Your cleaner has been notified." });
      setLocation("/bookings");
    } catch (err: any) {
      const msg = err?.data?.error || err?.message || "Unknown error";
      toast({ title: "Failed to create booking", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-14 pb-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            data-testid="button-back"
            onClick={() => (step > 1 ? setStep(step - 1) : setLocation("/cleaners"))}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base font-bold">{isRebook ? "Rebook a Clean" : "Book a Clean"}</h1>
            <p className="text-xs text-muted-foreground">
              Step {step} of 3{isRebook ? " · Pre-filled from last booking" : ""}
            </p>
          </div>
        </div>
        <div className="max-w-md mx-auto mt-3">
          <div className="flex gap-1">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all ${s <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 pt-5">
        {/* ── Step 1: Property + Service ── */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-sm font-bold text-foreground mb-3">Which property?</h2>
              <div className="flex flex-col gap-2">
                {properties.map((prop) => (
                  <button
                    key={prop.id}
                    data-testid={`button-select-property-${prop.id}`}
                    onClick={() => setSelectedProperty(prop.id)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border text-left transition-all ${
                      selectedProperty === prop.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{prop.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{prop.addressLine1}, {prop.city}</p>
                    </div>
                    {selectedProperty === prop.id && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                        <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
                <button
                  data-testid="button-add-property"
                  onClick={() => setLocation(`/properties/new?returnTo=/book?cleanerId=${cleanerId}`)}
                  className="flex items-center gap-3 p-4 rounded-2xl border border-dashed border-border bg-transparent text-left hover:border-primary/50 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <Plus size={18} className="text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">Add a new property</p>
                </button>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-foreground mb-3">Service type</h2>
              <div className="flex flex-col gap-2">
                {SERVICES.map((service) => (
                  <button
                    key={service.id}
                    data-testid={`button-service-${service.id}`}
                    onClick={() => setSelectedService(service.id)}
                    className={`flex items-center justify-between p-4 rounded-2xl border text-left transition-all ${
                      selectedService === service.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-semibold text-foreground">{service.label}</p>
                      <p className="text-xs text-muted-foreground">{service.desc}</p>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-bold text-foreground">from £{service.price}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Date (real calendar) + Time + Urgency ── */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <AvailabilityCalendarPicker
              cleanerId={cleanerId}
              selectedDate={selectedDate}
              onSelect={setSelectedDate}
            />

            <div>
              <h2 className="text-sm font-bold text-foreground mb-3">Preferred time</h2>
              <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-3">
                <Clock size={16} className="text-primary shrink-0" />
                <input
                  data-testid="input-time"
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="bg-transparent text-sm flex-1 outline-none text-foreground"
                />
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-foreground mb-3">Urgency</h2>
              <div className="flex gap-2">
                {URGENCY.map((opt) => (
                  <button
                    key={opt.id}
                    data-testid={`button-urgency-${opt.id}`}
                    onClick={() => setSelectedUrgency(opt.id)}
                    className={`flex-1 py-3 px-2 rounded-xl border text-center transition-all ${
                      selectedUrgency === opt.id
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-card"
                    }`}
                  >
                    <p className="text-xs font-bold">{opt.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{opt.sub}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-foreground mb-3">
                Notes <span className="text-muted-foreground font-normal">(optional)</span>
              </h2>
              <textarea
                data-testid="input-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions for the cleaner..."
                rows={3}
                className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none resize-none text-foreground placeholder:text-muted-foreground focus:border-primary transition-colors"
              />
            </div>
          </div>
        )}

        {/* ── Step 3: Confirm ── */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-bold text-foreground">Confirm your booking</h2>

            <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
              {[
                { label: "Property", value: properties.find((p) => p.id === selectedProperty)?.name || "—" },
                { label: "Service",  value: SERVICES.find((s) => s.id === selectedService)?.label || "—" },
                {
                  label: "Date",
                  value: selectedDate
                    ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-GB", {
                        weekday: "long", day: "numeric", month: "long",
                      })
                    : "—",
                },
                { label: "Time",    value: selectedTime },
                { label: "Urgency", value: URGENCY.find((u) => u.id === selectedUrgency)?.label || "—" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <span
                    className="text-xs font-semibold text-foreground"
                    data-testid={`text-booking-${row.label.toLowerCase()}`}
                  >
                    {row.value}
                  </span>
                </div>
              ))}
              <div className="border-t border-border pt-3 flex justify-between items-center">
                <span className="text-sm font-bold text-foreground">Estimated total</span>
                <span className="text-sm font-bold text-primary" data-testid="text-booking-price">
                  £{estimatedPrice}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
              <AlertCircle size={14} className="text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-700 leading-relaxed">
                Payment is collected after the clean is completed. You can cancel up to 24 hours before.
              </p>
            </div>

            {notes && (
              <div className="bg-muted rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1 font-medium">Your notes</p>
                <p className="text-xs text-foreground">{notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-8 pt-3 bg-background/95 backdrop-blur border-t border-border">
        {step < 3 ? (
          <button
            data-testid="button-next-step"
            onClick={handleNext}
            className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-sm flex items-center justify-center gap-2 active:opacity-80 transition-opacity"
          >
            Continue <ChevronRight size={16} />
          </button>
        ) : (
          <button
            data-testid="button-confirm-booking"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-sm disabled:opacity-60 active:opacity-80 transition-opacity flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <><Loader2 size={15} className="animate-spin" /> Requesting…</>
            ) : (
              "Confirm Booking"
            )}
          </button>
        )}
      </div>
    </div>
  );
}
