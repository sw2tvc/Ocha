import { Truck, Sparkles, Phone, MessageCircle, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type BookingStatus = "en_route" | "in_progress";

interface LiveStatusCardProps {
  status: BookingStatus;
  cleanerName: string;
  cleanerAvatar?: string;
  scheduledAt: string;
  estimatedDurationHours?: number;
}

function LivePulse() {
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
    </span>
  );
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function minutesSince(iso: string) {
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

function minutesUntil(iso: string) {
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 60000));
}

export function LiveStatusCard({
  status,
  cleanerName,
  cleanerAvatar,
  scheduledAt,
  estimatedDurationHours = 3,
}: LiveStatusCardProps) {
  const firstName = cleanerName.split(" ")[0];
  const isEnRoute = status === "en_route";
  const isInProgress = status === "in_progress";

  const minsUntil = minutesUntil(scheduledAt);
  const minsElapsed = minutesSince(scheduledAt);
  const totalMins = estimatedDurationHours * 60;
  const progressPct = isInProgress
    ? Math.min(100, Math.round((minsElapsed / totalMins) * 100))
    : 0;
  const minsRemaining = Math.max(0, totalMins - minsElapsed);

  /* gradient + icon per status */
  const gradientClass = isEnRoute
    ? "from-violet-50 to-violet-100/60 border-violet-200"
    : "from-primary/5 to-primary/10 border-primary/20";
  const iconBgClass = isEnRoute ? "bg-violet-100" : "bg-primary/15";
  const iconColorClass = isEnRoute ? "text-violet-600" : "text-primary";
  const Icon = isEnRoute ? Truck : Sparkles;
  const progressColorClass = isEnRoute ? "bg-violet-500" : "bg-primary";
  const trackColorClass = isEnRoute ? "bg-violet-100" : "bg-primary/10";

  return (
    <div
      className={cn(
        "rounded-2xl border bg-gradient-to-br p-4 flex flex-col gap-4",
        gradientClass
      )}
    >
      {/* Live badge + header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LivePulse />
          <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
            Live
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground font-medium">
          Auto-updating
        </span>
      </div>

      {/* Cleaner row */}
      <div className="flex items-center gap-3">
        {/* Avatar with animated ring */}
        <div className="relative shrink-0">
          <div
            className={cn(
              "absolute inset-0 rounded-full animate-pulse opacity-40",
              isEnRoute ? "bg-violet-400" : "bg-primary"
            )}
            style={{ transform: "scale(1.15)" }}
          />
          <img
            src={cleanerAvatar || `https://i.pravatar.cc/80?u=${cleanerName}`}
            alt={cleanerName}
            className="w-12 h-12 rounded-full object-cover relative z-10 border-2 border-white"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">
            {isEnRoute ? `${firstName} is on the way` : `${firstName} is cleaning now`}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEnRoute
              ? minsUntil > 0
                ? `Arriving around ${formatTime(scheduledAt)} · ~${minsUntil} min`
                : `Should arrive any moment`
              : minsRemaining > 0
              ? `~${minsRemaining} min left · started ${minsElapsed}m ago`
              : `Finishing up now`}
          </p>
        </div>

        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
            iconBgClass
          )}
        >
          <Icon size={18} className={iconColorClass} />
        </div>
      </div>

      {/* Progress bar (in_progress only) */}
      {isInProgress && (
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground font-medium">
              Progress
            </span>
            <span className="text-[10px] font-bold text-primary">
              {progressPct}%
            </span>
          </div>
          <div className={cn("h-2 rounded-full overflow-hidden", trackColorClass)}>
            <div
              className={cn(
                "h-full rounded-full transition-all duration-1000",
                progressColorClass
              )}
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="flex justify-between">
            <span className="text-[9px] text-muted-foreground">Started</span>
            <span className="text-[9px] text-muted-foreground">
              {estimatedDurationHours}h clean
            </span>
          </div>
        </div>
      )}

      {/* Compact step timeline */}
      <div className="flex items-center gap-0">
        {[
          { label: "Booked", done: true, active: false },
          { label: "Confirmed", done: true, active: false },
          {
            label: "En Route",
            done: isInProgress,
            active: isEnRoute,
          },
          {
            label: "Cleaning",
            done: false,
            active: isInProgress,
          },
          { label: "Done", done: false, active: false },
        ].map((step, i, arr) => (
          <div key={step.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center transition-all",
                  step.done && "bg-primary",
                  step.active &&
                    (isEnRoute ? "bg-violet-500 ring-4 ring-violet-200" : "bg-primary ring-4 ring-primary/20"),
                  !step.done && !step.active && "bg-muted"
                )}
              >
                {step.done ? (
                  <CheckCircle2 size={12} className="text-white" strokeWidth={2.5} />
                ) : step.active ? (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
                )}
              </div>
              <span
                className={cn(
                  "text-[8px] mt-1 font-medium whitespace-nowrap",
                  step.active
                    ? isEnRoute
                      ? "text-violet-600"
                      : "text-primary"
                    : step.done
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
            {i < arr.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-7 mx-0.5 mb-4 transition-colors",
                  step.done ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Quick action buttons */}
      <div className="flex gap-2 pt-1">
        <button
          className="flex-1 flex items-center justify-center gap-1.5 bg-white/80 border border-border rounded-xl py-2.5 text-xs font-semibold text-foreground hover:bg-white transition-colors"
          onClick={() => {}}
        >
          <Phone size={13} className="text-muted-foreground" />
          Call {firstName}
        </button>
        <button
          className="flex-1 flex items-center justify-center gap-1.5 bg-white/80 border border-border rounded-xl py-2.5 text-xs font-semibold text-foreground hover:bg-white transition-colors"
          onClick={() => {}}
        >
          <MessageCircle size={13} className="text-muted-foreground" />
          Message
        </button>
      </div>

      {/* Scheduled time note */}
      <div className="flex items-center gap-1.5 bg-white/50 rounded-xl px-3 py-2">
        <Clock size={11} className="text-muted-foreground shrink-0" />
        <p className="text-[10px] text-muted-foreground">
          {isEnRoute
            ? `Scheduled for ${formatTime(scheduledAt)} today`
            : `Started at ${formatTime(scheduledAt)} · expected to finish by ${
                new Date(
                  new Date(scheduledAt).getTime() + estimatedDurationHours * 3600000
                ).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
              }`}
        </p>
      </div>
    </div>
  );
}
