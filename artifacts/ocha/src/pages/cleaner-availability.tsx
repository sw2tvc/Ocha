import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  XCircle,
  Lock,
  Loader2,
  Info,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ── Types ─────────────────────────────────────── */
type DayStatus = "available" | "blocked" | "booked" | "past";
interface Day { date: string; status: DayStatus; reason?: string }
interface CalendarData { cleanerId: string; month: string; days: Day[]; nextAvailable?: string }

const CLEANER_ID = "cleaner-1"; /* Demo: Amara's calendar */

const REASON_LABELS: Record<string, string> = {
  holiday: "Holiday",
  personal: "Personal",
  fully_booked: "Fully booked",
  other: "Other",
};

const DAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ── Fetch ──────────────────────────────────────── */
async function fetchCalendar(cleanerId: string, month: string): Promise<CalendarData> {
  const res = await fetch(
    `${import.meta.env.BASE_URL}api/cleaners/${cleanerId}/calendar?month=${month}`,
    { headers: { "x-user-id": "user-cleaner-1" } }
  );
  if (!res.ok) throw new Error("Failed to load calendar");
  return res.json();
}

async function toggleDay(cleanerId: string, date: string, isBlocked: boolean, reason?: string) {
  const res = await fetch(
    `${import.meta.env.BASE_URL}api/cleaners/${cleanerId}/calendar/toggle`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-user-id": "user-cleaner-1" },
      body: JSON.stringify({ date, isBlocked, reason }),
    }
  );
  if (!res.ok) throw new Error("Failed to update day");
  return res.json();
}

/* ── Day cell ───────────────────────────────────── */
function DayCell({
  day,
  onTap,
  selected,
}: {
  day: Day | null;
  onTap?: (d: Day) => void;
  selected: boolean;
}) {
  if (!day) return <div />;

  const dayNum = Number(day.date.split("-")[2]);
  const isWeekend = (() => {
    const d = new Date(day.date + "T00:00:00");
    return d.getDay() === 0 || d.getDay() === 6;
  })();

  const cfg: Record<DayStatus, { bg: string; text: string; ring: string }> = {
    available: {
      bg: isWeekend ? "bg-primary/8" : "bg-primary/10",
      text: "text-primary font-semibold",
      ring: selected ? "ring-2 ring-primary" : "",
    },
    blocked: {
      bg: "bg-muted",
      text: "text-muted-foreground",
      ring: selected ? "ring-2 ring-muted-foreground" : "",
    },
    booked: {
      bg: "bg-amber-50",
      text: "text-amber-700 font-semibold",
      ring: selected ? "ring-2 ring-amber-400" : "",
    },
    past: {
      bg: "bg-transparent",
      text: "text-muted-foreground/40",
      ring: "",
    },
  };

  const { bg, text, ring } = cfg[day.status];
  const interactive = day.status !== "past" && day.status !== "booked";

  return (
    <button
      onClick={() => interactive && onTap?.(day)}
      disabled={!interactive}
      className={cn(
        "aspect-square rounded-xl flex flex-col items-center justify-center text-sm transition-all",
        bg, text, ring,
        interactive ? "hover:opacity-80 active:scale-95 cursor-pointer" : "cursor-default"
      )}
    >
      <span className="text-xs leading-none">{dayNum}</span>
      {day.status === "booked" && <div className="w-1 h-1 rounded-full bg-amber-500 mt-0.5" />}
      {day.status === "blocked" && <div className="w-1 h-1 rounded-full bg-muted-foreground/50 mt-0.5" />}
    </button>
  );
}

/* ── Main page ──────────────────────────────────── */
export default function CleanerAvailability() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selected, setSelected] = useState<Day | null>(null);
  const [showReason, setShowReason] = useState(false);
  const [pendingReason, setPendingReason] = useState<string>("holiday");

  const monthStr = `${year}-${String(month).padStart(2, "0")}`;
  const queryKey = ["cleaner-calendar", CLEANER_ID, monthStr];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchCalendar(CLEANER_ID, monthStr),
  });

  const mutation = useMutation({
    mutationFn: ({ date, isBlocked, reason }: { date: string; isBlocked: boolean; reason?: string }) =>
      toggleDay(CLEANER_ID, date, isBlocked, reason),
    onMutate: async ({ date, isBlocked, reason }) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData<CalendarData>(queryKey);
      if (prev) {
        queryClient.setQueryData<CalendarData>(queryKey, {
          ...prev,
          days: prev.days.map((d) =>
            d.date === date
              ? { ...d, status: isBlocked ? "blocked" : "available", reason }
              : d
          ),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(queryKey, ctx.prev);
      toast({ title: "Failed to update", variant: "destructive" });
    },
    onSuccess: (_data, vars) => {
      toast({
        title: vars.isBlocked ? "Day blocked" : "Day unblocked",
        description: vars.isBlocked
          ? `${vars.date} marked as unavailable`
          : `${vars.date} is now available`,
      });
    },
    onSettled: () => {
      setSelected(null);
      setShowReason(false);
    },
  });

  /* Navigate months */
  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelected(null);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelected(null);
  };

  /* Build grid — pad start with nulls to align Mon=0 */
  const days = data?.days || [];
  const firstDate = days[0]?.date;
  const startPad = firstDate
    ? (() => {
        const dow = new Date(firstDate + "T00:00:00").getDay();
        return dow === 0 ? 6 : dow - 1; /* Mon-based */
      })()
    : 0;
  const grid: (Day | null)[] = [...Array(startPad).fill(null), ...days];
  while (grid.length % 7 !== 0) grid.push(null);

  const monthLabel = new Date(year, month - 1, 1).toLocaleString("en-GB", { month: "long", year: "numeric" });

  const stats = {
    available: days.filter(d => d.status === "available").length,
    blocked: days.filter(d => d.status === "blocked").length,
    booked: days.filter(d => d.status === "booked").length,
  };

  const handleTap = (day: Day) => {
    if (selected?.date === day.date) {
      setSelected(null);
      return;
    }
    setSelected(day);
    setShowReason(false);
  };

  const handleBlock = () => {
    if (!selected) return;
    if (selected.status === "blocked") {
      mutation.mutate({ date: selected.date, isBlocked: false });
    } else {
      setShowReason(true);
    }
  };

  const confirmBlock = (reason: string) => {
    if (!selected) return;
    mutation.mutate({ date: selected.date, isBlocked: true, reason });
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-14 pb-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            onClick={() => setLocation("/cleaner-dashboard")}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base font-bold text-foreground">Manage Availability</h1>
            <p className="text-xs text-muted-foreground">Block dates you can't work</p>
          </div>
          <Calendar size={18} className="ml-auto text-primary" />
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 pt-5 flex flex-col gap-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Available", value: stats.available, color: "text-primary", dot: "bg-primary/70" },
            { label: "Blocked", value: stats.blocked, color: "text-muted-foreground", dot: "bg-muted-foreground/50" },
            { label: "Booked", value: stats.booked, color: "text-amber-600", dot: "bg-amber-400" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <div className={cn("w-2 h-2 rounded-full", s.dot)} />
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
              <p className={cn("text-xl font-bold", s.color)}>{isLoading ? "—" : s.value}</p>
            </div>
          ))}
        </div>

        {/* Month nav */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
            >
              <ChevronLeft size={16} />
            </button>
            <p className="text-sm font-bold text-foreground">{monthLabel}</p>
            <button
              onClick={nextMonth}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {DAY_HEADERS.map((d) => (
              <div key={d} className="text-center text-[9px] font-bold text-muted-foreground uppercase py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 size={22} className="animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {grid.map((day, i) => (
                <DayCell
                  key={day ? day.date : `pad-${i}`}
                  day={day}
                  onTap={handleTap}
                  selected={selected?.date === day?.date}
                />
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border justify-center flex-wrap">
            {[
              { dot: "bg-primary/60", label: "Available" },
              { dot: "bg-muted-foreground/40", label: "Blocked" },
              { dot: "bg-amber-400", label: "Booked" },
              { dot: "bg-transparent border border-muted-foreground/20", label: "Past" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className={cn("w-2.5 h-2.5 rounded-sm", l.dot)} />
                <span className="text-[10px] text-muted-foreground">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selected day actions */}
        {selected && !showReason && (
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-foreground">
                  {new Date(selected.date + "T00:00:00").toLocaleDateString("en-GB", {
                    weekday: "long", day: "numeric", month: "long"
                  })}
                </p>
                <p className={cn("text-xs mt-0.5 font-medium", {
                  "text-primary": selected.status === "available",
                  "text-muted-foreground": selected.status === "blocked",
                  "text-amber-600": selected.status === "booked",
                })}>
                  {selected.status === "available" && "Available"}
                  {selected.status === "blocked" && `Blocked${selected.reason ? ` — ${REASON_LABELS[selected.reason] || selected.reason}` : ""}`}
                  {selected.status === "booked" && "Has a booking"}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
                <XCircle size={18} />
              </button>
            </div>

            {selected.status !== "booked" && (
              <button
                onClick={handleBlock}
                disabled={mutation.isPending}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all",
                  selected.status === "blocked"
                    ? "bg-primary/10 text-primary hover:bg-primary/15"
                    : "bg-muted text-foreground hover:bg-muted/80"
                )}
              >
                {mutation.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : selected.status === "blocked" ? (
                  <><CheckCircle2 size={15} /> Mark as available</>
                ) : (
                  <><Lock size={15} /> Block this day</>
                )}
              </button>
            )}

            {selected.status === "booked" && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                <Info size={13} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  This day has a confirmed booking and can't be blocked.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Reason picker */}
        {selected && showReason && (
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
            <p className="text-sm font-bold text-foreground">Reason for blocking</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(REASON_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPendingReason(key)}
                  className={cn(
                    "py-2.5 px-3 rounded-xl border text-xs font-semibold text-left transition-all",
                    pendingReason === key
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border text-foreground hover:border-primary/30"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setShowReason(false)}
                className="flex-1 border border-border rounded-xl py-2.5 text-sm font-medium text-muted-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => confirmBlock(pendingReason)}
                disabled={mutation.isPending}
                className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold disabled:opacity-70"
              >
                {mutation.isPending ? "Blocking…" : "Confirm"}
              </button>
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="bg-muted/50 rounded-2xl p-3.5">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Tip:</span> Keeping your
            calendar up to date reduces last-minute cancellations and improves your
            trust score. Days with confirmed bookings are shown in amber and cannot
            be blocked.
          </p>
        </div>
      </div>
    </div>
  );
}
