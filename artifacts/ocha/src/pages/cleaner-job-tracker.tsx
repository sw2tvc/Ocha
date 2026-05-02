import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft, MapPin, Clock, Building2, MessageCircle,
  Navigation, Play, CheckCircle2, Loader2, FileText,
  User, Phone, AlertTriangle, XCircle,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const BASE = import.meta.env.BASE_URL;
const CLEANER_HDR = { "x-user-id": "user-cleaner-1" };

const SERVICE_LABELS: Record<string, string> = {
  standard:        "Standard Clean",
  deep_clean:      "Deep Clean",
  airbnb_turnover: "Airbnb Turnover",
  end_of_tenancy:  "End of Tenancy",
  office:          "Office Clean",
  recurring:       "Recurring",
};

/* ── Status stepper data ─────────────────────────── */
type JobStatus = "accepted" | "en_route" | "in_progress" | "completed";

const STEPS: { status: JobStatus; label: string; shortLabel: string }[] = [
  { status: "accepted",    label: "Accepted",    shortLabel: "Accepted" },
  { status: "en_route",   label: "En route",    shortLabel: "En route" },
  { status: "in_progress",label: "In progress", shortLabel: "Working" },
  { status: "completed",  label: "Completed",   shortLabel: "Done" },
];

const NEXT_ACTION: Record<JobStatus, { label: string; icon: typeof Navigation; next: JobStatus; toastTitle: string; toastDesc: string } | null> = {
  accepted:    { label: "I'm on my way",          icon: Navigation,    next: "en_route",    toastTitle: "Customer notified",    toastDesc: "Sarah Mitchell knows you're on the way." },
  en_route:    { label: "I've arrived — start job", icon: Play,        next: "in_progress", toastTitle: "Job started!",          toastDesc: "Customer notified that cleaning has begun." },
  in_progress: { label: "Mark job complete",       icon: CheckCircle2, next: "completed",   toastTitle: "Job complete! 🎉",     toastDesc: "Customer has been asked to leave a review." },
  completed:   null,
};

/* ── Progress stepper ───────────────────────────── */
function JobStepper({ status }: { status: JobStatus }) {
  const currentIdx = STEPS.findIndex((s) => s.status === status);
  return (
    <div className="flex items-center w-full">
      {STEPS.map((step, i) => {
        const isDone    = i < currentIdx;
        const isCurrent = i === currentIdx;
        return (
          <div key={step.status} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all",
                isDone    ? "bg-primary border-primary"        : "",
                isCurrent ? "bg-primary/10 border-primary"    : "",
                !isDone && !isCurrent ? "bg-muted border-border" : "",
              )}>
                {isDone ? (
                  <CheckCircle2 size={14} className="text-primary-foreground" />
                ) : (
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    isCurrent ? "bg-primary" : "bg-muted-foreground/30"
                  )} />
                )}
              </div>
              <span className={cn(
                "text-[9px] font-semibold whitespace-nowrap",
                isCurrent ? "text-primary" : isDone ? "text-primary/70" : "text-muted-foreground"
              )}>
                {step.shortLabel}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-1 mb-4 rounded-full transition-all",
                i < currentIdx ? "bg-primary" : "bg-border"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Main page ──────────────────────────────────── */
export default function CleanerJobTracker() {
  const { bookingId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cancelStep, setCancelStep] = useState<"idle" | "confirm">("idle");

  /* Fetch booking */
  const { data: booking, isLoading } = useQuery({
    queryKey: ["cleaner-job", bookingId],
    queryFn: async () => {
      const res = await fetch(`${BASE}api/bookings/${bookingId}`, {
        headers: CLEANER_HDR,
      });
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    enabled: !!bookingId,
    refetchInterval: (query) => {
      const s = (query.state.data as any)?.status;
      return s === "en_route" || s === "in_progress" ? 10_000 : false;
    },
  });

  /* Status update mutation */
  const statusMutation = useMutation({
    mutationFn: async (newStatus: JobStatus) => {
      const res = await fetch(`${BASE}api/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...CLEANER_HDR },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: (_, newStatus) => {
      queryClient.invalidateQueries({ queryKey: ["cleaner-job", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/cleaner"] });
      const action = NEXT_ACTION[status as JobStatus];
      if (action) {
        toast({ title: action.toastTitle, description: action.toastDesc });
      }
      if (newStatus === "completed") {
        setTimeout(() => setLocation("/cleaner-dashboard"), 2000);
      }
    },
    onError: () => toast({ title: "Update failed", description: "Please try again.", variant: "destructive" }),
  });

  /* Cancel mutation (cleaner-initiated) */
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}api/bookings/${bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...CLEANER_HDR },
        body: JSON.stringify({ reason: "Cancelled by cleaner" }),
      });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Booking cancelled", description: "The customer has been notified." });
      setLocation("/cleaner-dashboard");
    },
    onError: () => toast({ title: "Cancel failed", variant: "destructive" }),
  });

  if (isLoading || !booking) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <div className="bg-primary h-36 px-4 pt-14 flex items-start">
          <button onClick={() => setLocation("/cleaner-dashboard")} className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
            <ArrowLeft size={18} className="text-primary-foreground" />
          </button>
        </div>
        <div className="px-4 -mt-4 flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const status: JobStatus = booking.status as JobStatus;
  const nextAction = NEXT_ACTION[status];
  const serviceLabel = SERVICE_LABELS[booking.serviceType] || booking.serviceType;
  const customerName = booking.customer?.fullName || "The customer";
  const customerFirstName = customerName.split(" ")[0];
  const propertyName = booking.property?.name || "the property";
  const propertyAddress = [booking.property?.addressLine1, booking.property?.city].filter(Boolean).join(", ");
  const scheduledDate = new Date(booking.scheduledAt);
  const dateLabel = scheduledDate.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
  const timeLabel = scheduledDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  /* ETA for en_route status */
  const nowMs = Date.now();
  const schedMs = scheduledDate.getTime();
  const minsUntil = Math.max(0, Math.round((schedMs - nowMs) / 60000));

  /* Header color by status */
  const headerBg = {
    accepted:    "bg-primary",
    en_route:    "bg-amber-600",
    in_progress: "bg-emerald-700",
    completed:   "bg-primary",
  }[status] || "bg-primary";

  const statusBadgeText = {
    accepted:    "Upcoming",
    en_route:    "En route",
    in_progress: "In progress",
    completed:   "Completed",
  }[status];

  const isActing = statusMutation.isPending || cancelMutation.isPending;

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-background">
      {/* ── Header ── */}
      <div className={cn("px-4 pt-14 pb-8 transition-colors", headerBg)}>
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setLocation("/cleaner-dashboard")}
              className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0"
            >
              <ArrowLeft size={18} className="text-white" />
            </button>
            <div className="flex-1">
              <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Job tracker</p>
              <h1 className="text-white text-lg font-bold leading-tight">{serviceLabel}</h1>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/20 text-white">
              {statusBadgeText}
            </span>
          </div>
          {/* Stepper */}
          <div className="bg-white/10 rounded-2xl p-4">
            <JobStepper status={status} />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 -mt-4 flex flex-col gap-4">

        {/* ── En route live countdown ── */}
        {status === "en_route" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
              <Navigation size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-amber-900">You're on your way</p>
              <p className="text-xs text-amber-700">
                {minsUntil > 0
                  ? `Scheduled in ~${minsUntil} min · ${customerFirstName} has been notified`
                  : `Scheduled at ${timeLabel} · ${customerFirstName} is expecting you`}
              </p>
            </div>
          </div>
        )}

        {/* ── In progress banner ── */}
        {status === "in_progress" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
              <Play size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">Job in progress</p>
              <p className="text-xs text-emerald-700">
                {booking.estimatedDurationHours}h job · estimated finish {
                  new Date(nowMs + booking.estimatedDurationHours * 3600000)
                    .toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                }
              </p>
            </div>
          </div>
        )}

        {/* ── Completed banner ── */}
        {status === "completed" && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} className="text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Job complete!</p>
              <p className="text-xs text-muted-foreground">{customerFirstName} has been asked to leave a review.</p>
            </div>
          </div>
        )}

        {/* ── Property & time card ── */}
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
          <p className="text-xs font-bold text-foreground uppercase tracking-wide">Job details</p>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 size={16} className="text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{propertyName}</p>
              {propertyAddress && (
                <p className="text-xs text-muted-foreground mt-0.5">{propertyAddress}</p>
              )}
            </div>
            {propertyAddress && (
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(propertyAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0"
              >
                <MapPin size={15} className="text-primary-foreground" />
              </a>
            )}
          </div>
          <div className="border-t border-border pt-3 grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">Date</p>
                <p className="text-xs font-semibold text-foreground">{dateLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-muted-foreground shrink-0" />
              <div>
                <p className="text-[10px] text-muted-foreground">Time · Duration</p>
                <p className="text-xs font-semibold text-foreground">{timeLabel} · {booking.estimatedDurationHours}h</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Customer card ── */}
        <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
            {booking.customer?.avatarUrl ? (
              <img src={booking.customer.avatarUrl} alt={customerName} className="w-10 h-10 object-cover" />
            ) : (
              <User size={16} className="text-primary" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-[10px] text-muted-foreground">Customer</p>
            <p className="text-sm font-bold text-foreground">{customerName}</p>
          </div>
          <button
            onClick={() => setLocation(`/bookings/${bookingId}/messages`)}
            className="w-9 h-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted transition-colors"
          >
            <MessageCircle size={15} className="text-primary" />
          </button>
        </div>

        {/* ── Notes ── */}
        {booking.notes && (
          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
            <FileText size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-900 mb-1">Customer notes</p>
              <p className="text-xs text-amber-800 leading-relaxed">{booking.notes}</p>
            </div>
          </div>
        )}

        {/* ── Earnings chip ── */}
        <div className="flex items-center justify-between bg-card border border-border rounded-2xl px-4 py-3">
          <p className="text-xs text-muted-foreground font-medium">Your earnings for this job</p>
          <p className="text-base font-bold text-primary">£{booking.totalPrice}</p>
        </div>

        {/* ── Main CTA ── */}
        {nextAction && (
          <button
            onClick={() => statusMutation.mutate(nextAction.next)}
            disabled={isActing}
            data-testid={`button-status-${nextAction.next}`}
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-60",
              status === "en_route"    ? "bg-amber-600 text-white"  : "",
              status === "in_progress" ? "bg-emerald-700 text-white" : "",
              status === "accepted"    ? "bg-primary text-primary-foreground" : "",
            )}
          >
            {isActing ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <nextAction.icon size={16} />
            )}
            {isActing ? "Updating…" : nextAction.label}
          </button>
        )}

        {/* ── Message customer ── */}
        {status !== "completed" && (
          <button
            onClick={() => setLocation(`/bookings/${bookingId}/messages`)}
            className="w-full flex items-center justify-center gap-2 border border-primary/30 text-primary rounded-2xl py-3 font-semibold text-sm hover:bg-primary/5 transition-colors"
          >
            <MessageCircle size={15} />
            Message {customerFirstName}
          </button>
        )}

        {/* ── Cancel (only from accepted) ── */}
        {status === "accepted" && cancelStep === "idle" && (
          <button
            onClick={() => setCancelStep("confirm")}
            className="w-full border border-destructive/30 text-destructive rounded-2xl py-3 font-semibold text-sm hover:bg-destructive/5 transition-colors"
          >
            Cancel this booking
          </button>
        )}
        {status === "accepted" && cancelStep === "confirm" && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-destructive">Cancel this booking?</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {customerFirstName} will be notified. Your response rate may be affected.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCancelStep("idle")}
                className="flex-1 border border-border rounded-xl py-2.5 text-sm font-semibold"
              >
                Keep it
              </button>
              <button
                onClick={() => cancelMutation.mutate()}
                disabled={isActing}
                className="flex-1 bg-destructive text-destructive-foreground rounded-xl py-2.5 text-sm font-bold disabled:opacity-60"
              >
                {cancelMutation.isPending ? "Cancelling…" : "Yes, cancel"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
