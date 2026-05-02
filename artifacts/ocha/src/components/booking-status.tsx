import { cn } from "@/lib/utils";
import { Clock, CheckCircle2, Truck, Sparkles, Star, XCircle, AlertTriangle } from "lucide-react";

type BookingStatus = "pending" | "accepted" | "en_route" | "in_progress" | "completed" | "cancelled" | "disputed";

const STATUS_CONFIG: Record<BookingStatus, { label: string; color: string; bg: string; icon: typeof Clock }> = {
  pending: { label: "Pending", color: "text-amber-600", bg: "bg-amber-50", icon: Clock },
  accepted: { label: "Confirmed", color: "text-blue-600", bg: "bg-blue-50", icon: CheckCircle2 },
  en_route: { label: "En Route", color: "text-violet-600", bg: "bg-violet-50", icon: Truck },
  in_progress: { label: "In Progress", color: "text-primary", bg: "bg-primary/10", icon: Sparkles },
  completed: { label: "Completed", color: "text-green-700", bg: "bg-green-50", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", color: "text-destructive", bg: "bg-destructive/10", icon: XCircle },
  disputed: { label: "Disputed", color: "text-orange-600", bg: "bg-orange-50", icon: AlertTriangle },
};

const STEPS: { status: BookingStatus; label: string }[] = [
  { status: "pending", label: "Requested" },
  { status: "accepted", label: "Confirmed" },
  { status: "en_route", label: "En Route" },
  { status: "in_progress", label: "Cleaning" },
  { status: "completed", label: "Done" },
];

const STEP_ORDER = ["pending", "accepted", "en_route", "in_progress", "completed"];

interface BookingStatusPillProps {
  status: BookingStatus;
  className?: string;
}

export function BookingStatusPill({ status, className }: BookingStatusPillProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <span
      data-testid={`status-pill-${status}`}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        config.color,
        config.bg,
        className
      )}
    >
      <Icon size={12} strokeWidth={2} />
      {config.label}
    </span>
  );
}

interface BookingTimelineProps {
  status: BookingStatus;
}

export function BookingTimeline({ status }: BookingTimelineProps) {
  if (status === "cancelled" || status === "disputed") {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <XCircle size={16} />
        <span className="font-medium">{STATUS_CONFIG[status].label}</span>
      </div>
    );
  }

  const currentIdx = STEP_ORDER.indexOf(status);

  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
        const isDone = STEP_ORDER.indexOf(step.status) < currentIdx;
        const isCurrent = step.status === status;
        const isPending = STEP_ORDER.indexOf(step.status) > currentIdx;

        return (
          <div key={step.status} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                  isDone && "bg-primary",
                  isCurrent && "bg-primary ring-4 ring-primary/20",
                  isPending && "bg-muted"
                )}
              >
                {isDone ? (
                  <CheckCircle2 size={14} className="text-primary-foreground" strokeWidth={2.5} />
                ) : (
                  <div className={cn("w-2 h-2 rounded-full", isCurrent ? "bg-primary-foreground" : "bg-muted-foreground/30")} />
                )}
              </div>
              <span className={cn("text-[9px] mt-1 font-medium whitespace-nowrap", isCurrent ? "text-primary" : isDone ? "text-primary" : "text-muted-foreground")}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn("h-0.5 w-8 mx-0.5 mb-4 transition-colors", isDone ? "bg-primary" : "bg-muted")} />
            )}
          </div>
        );
      })}
    </div>
  );
}
