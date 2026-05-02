import { useState } from "react";
import { useLocation, useSearch } from "wouter";
import { ArrowLeft, ChevronRight, Building2, Calendar, Clock, AlertCircle, Plus } from "lucide-react";
import { useListProperties, useCreateBooking, getListPropertiesQueryKey, getListBookingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { MOCK_PROPERTIES } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

const SERVICES = [
  { id: "standard", label: "Standard Clean", desc: "Regular cleaning, 2-3 hrs", price: 45 },
  { id: "deep_clean", label: "Deep Clean", desc: "Thorough clean, 4-5 hrs", price: 90 },
  { id: "airbnb_turnover", label: "Airbnb Turnover", desc: "Quick turnover, 2 hrs", price: 55 },
  { id: "end_of_tenancy", label: "End of Tenancy", desc: "Full clean, 5-6 hrs", price: 150 },
];

const URGENCY = [
  { id: "standard", label: "Anytime", sub: "Best price" },
  { id: "urgent", label: "Today", sub: "+10%" },
  { id: "emergency", label: "Now", sub: "+25%" },
];

const URGENCY_MULTIPLIER: Record<string, number> = { standard: 1, urgent: 1.1, emergency: 1.25 };

export default function Book() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const params = new URLSearchParams(search);
  const cleanerId = params.get("cleanerId") || "cleaner-1";
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState<string>("");
  const [selectedService, setSelectedService] = useState("standard");
  const [selectedUrgency, setSelectedUrgency] = useState("standard");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: propertiesData } = useListProperties({
    query: { queryKey: getListPropertiesQueryKey() },
  });

  const createBookingMutation = useCreateBooking();

  const apiProperties = propertiesData?.properties ?? [];
  const properties = apiProperties.length > 0 ? apiProperties : MOCK_PROPERTIES;
  const selectedServiceData = SERVICES.find((s) => s.id === selectedService)!;
  const urgencyMultiplier = URGENCY_MULTIPLIER[selectedUrgency] ?? 1;
  const estimatedPrice = Math.round(selectedServiceData.price * urgencyMultiplier);

  const getTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  };

  const handleNext = () => {
    if (step === 1 && !selectedProperty) {
      toast({ title: "Select a property", description: "Please choose which property to clean." });
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast({ title: "Select a date", description: "Please choose when you'd like the cleaning." });
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
            <h1 className="text-base font-bold">Book a Clean</h1>
            <p className="text-xs text-muted-foreground">Step {step} of 3</p>
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
        {/* Step 1: Property + Service */}
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

        {/* Step 2: Date + Time + Urgency */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <div>
              <h2 className="text-sm font-bold text-foreground mb-3">When?</h2>
              <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Date</label>
                  <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
                    <Calendar size={16} className="text-primary shrink-0" />
                    <input
                      data-testid="input-date"
                      type="date"
                      min={getTomorrow()}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="bg-transparent text-sm flex-1 outline-none text-foreground"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Time</label>
                  <div className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2.5">
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
              <h2 className="text-sm font-bold text-foreground mb-3">Notes <span className="text-muted-foreground font-normal">(optional)</span></h2>
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

        {/* Step 3: Confirm */}
        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-bold text-foreground">Confirm your booking</h2>

            <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
              {[
                { label: "Property", value: properties.find((p) => p.id === selectedProperty)?.name || "—" },
                { label: "Service", value: SERVICES.find((s) => s.id === selectedService)?.label || "—" },
                {
                  label: "Date",
                  value: selectedDate
                    ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })
                    : "—",
                },
                { label: "Time", value: selectedTime },
                { label: "Urgency", value: URGENCY.find((u) => u.id === selectedUrgency)?.label || "—" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{row.label}</span>
                  <span className="text-xs font-semibold text-foreground" data-testid={`text-booking-${row.label.toLowerCase()}`}>{row.value}</span>
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
            className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-sm disabled:opacity-60 active:opacity-80 transition-opacity"
          >
            {isSubmitting ? "Requesting…" : "Confirm Booking"}
          </button>
        )}
      </div>
    </div>
  );
}
