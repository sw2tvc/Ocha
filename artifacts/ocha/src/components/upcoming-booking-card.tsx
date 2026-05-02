import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetCustomerDashboard } from "@workspace/api-client-react";
import { Star, MapPin, ChevronRight, Clock, Navigation, CheckCircle2, AlertCircle, Hourglass } from "lucide-react";

/* ── helpers ─────────────────────────────────────────── */
function useCountdown(target: string | null) {
  const [diff, setDiff] = useState<number>(0);
  useEffect(() => {
    if (!target) return;
    const tick = () => setDiff(new Date(target).getTime() - Date.now());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return diff;
}

function formatCountdown(ms: number) {
  if (ms <= 0) return { label: "Now", urgent: true };
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return { label: `${h}h ${m}m`, urgent: false };
  if (m > 5) return { label: `${m}m`, urgent: false };
  return { label: `${m}m ${s.toString().padStart(2, "0")}s`, urgent: true };
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string; bg: string; pulse: boolean }> = {
  en_route:   { icon: Navigation,    label: "On the way",         color: "text-blue-700",   bg: "bg-blue-50 border-blue-200",   pulse: true },
  confirmed:  { icon: CheckCircle2,  label: "Confirmed",          color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200", pulse: false },
  pending:    { icon: Hourglass,     label: "Awaiting confirmation", color: "text-amber-700", bg: "bg-amber-50 border-amber-200",  pulse: false },
  in_progress:{ icon: Clock,         label: "In progress",        color: "text-primary",    bg: "bg-primary/5 border-primary/20", pulse: true },
  disputed:   { icon: AlertCircle,   label: "Disputed",           color: "text-red-700",    bg: "bg-red-50 border-red-200",      pulse: false },
};

const SERVICE_LABELS: Record<string, string> = {
  standard: "Standard Clean",
  deep_clean: "Deep Clean",
  airbnb_turnover: "Airbnb Turnover",
  end_of_tenancy: "End of Tenancy",
  ironing: "Ironing",
};

/* ═══════════════════════════════════════════════════════ */
export function UpcomingBookingCard() {
  const [, setLocation] = useLocation();

  const { data } = useGetCustomerDashboard({
    query: { queryKey: ["customer-dashboard-home"], refetchInterval: 30_000 },
  });

  const booking = data?.upcomingBookings?.[0] ?? null;
  const countdown = useCountdown(booking?.scheduledAt ?? null);

  if (!booking) return null;

  const cfg = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;
  const { label: countdownLabel, urgent } = formatCountdown(countdown);
  const cleaner = (booking as any).cleaner;
  const property = (booking as any).property;
  const serviceLabel = SERVICE_LABELS[booking.serviceType ?? "standard"] ?? booking.serviceType;
  const isImminentOrActive = ["en_route", "in_progress"].includes(booking.status);

  return (
    <button
      onClick={() => setLocation(`/bookings/${booking.id}`)}
      className={`w-full text-left rounded-2xl border p-4 transition-all active:scale-[0.98] ${cfg.bg}`}
    >
      {/* ── Top row: status badge + countdown ── */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {cfg.pulse && (
            <span className="relative flex h-2 w-2 mr-0.5">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${booking.status === "en_route" ? "bg-blue-500" : "bg-primary"}`} />
              <span className={`relative inline-flex h-2 w-2 rounded-full ${booking.status === "en_route" ? "bg-blue-500" : "bg-primary"}`} />
            </span>
          )}
          <StatusIcon size={13} className={cfg.color} />
          <span className={`text-xs font-bold uppercase tracking-wide ${cfg.color}`}>{cfg.label}</span>
        </div>

        {isImminentOrActive && booking.scheduledAt && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${urgent ? "bg-red-100" : "bg-white/60"}`}>
            <Clock size={10} className={urgent ? "text-red-600" : "text-muted-foreground"} />
            <span className={`text-[11px] font-bold tabular-nums ${urgent ? "text-red-600" : "text-foreground"}`}>
              {countdownLabel}
            </span>
          </div>
        )}

        {!isImminentOrActive && booking.scheduledAt && (
          <span className="text-[11px] text-muted-foreground font-medium">
            {formatDate(booking.scheduledAt)} · {formatTime(booking.scheduledAt)}
          </span>
        )}
      </div>

      {/* ── Cleaner row ── */}
      {cleaner && (
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-white border-2 border-white shadow-sm shrink-0">
            {cleaner.avatarUrl ? (
              <img src={cleaner.avatarUrl} alt={cleaner.fullName} className="w-10 h-10 object-cover" />
            ) : (
              <div className="w-10 h-10 flex items-center justify-center bg-primary/10">
                <span className="text-sm font-bold text-primary">{cleaner.fullName?.[0]}</span>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm font-bold text-foreground truncate">{cleaner.fullName}</p>
              {cleaner.verificationBadge === "trusted" && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-white/70 text-emerald-700 rounded-full border border-emerald-200">Trusted</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              {cleaner.averageRating && (
                <div className="flex items-center gap-0.5">
                  <Star size={10} className="text-amber-500 fill-amber-500" />
                  <span className="text-[11px] font-semibold text-foreground">{cleaner.averageRating}</span>
                </div>
              )}
              <span className="text-[11px] text-muted-foreground">{serviceLabel}</span>
            </div>
          </div>
          <ChevronRight size={16} className="text-muted-foreground shrink-0" />
        </div>
      )}

      {/* ── Property + time row ── */}
      {property && (
        <div className="flex items-center gap-2 pt-2.5 border-t border-black/10">
          <MapPin size={11} className="text-muted-foreground shrink-0" />
          <span className="text-[11px] text-muted-foreground flex-1 truncate">{property.name} · {property.addressLine1}</span>
          {booking.scheduledAt && isImminentOrActive && (
            <span className="text-[11px] font-semibold text-foreground">{formatTime(booking.scheduledAt)}</span>
          )}
        </div>
      )}
    </button>
  );
}
