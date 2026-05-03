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
  Repeat2,
  Clock,
  Zap,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ── Types ─────────────────────────────────────────── */
type DayStatus = "available" | "blocked" | "booked" | "past";
interface Day { date: string; status: DayStatus; reason?: string }
interface CalendarData { cleanerId: string; month: string; days: Day[]; nextAvailable?: string }

const CLEANER_ID = "cleaner-1";

const REASON_LABELS: Record<string, string> = {
  holiday:     "Holiday",
  personal:    "Personal",
  fully_booked:"Fully booked",
  other:       "Other",
};

const DAY_HEADERS     = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_LABELS_FULL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/* ── API helpers ────────────────────────────────────── */
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

/* ── Day cell ────────────────────────────────────────── */
function DayCell({
  day, onTap, selected, large = false,
}: {
  day: Day | null; onTap?: (d: Day) => void; selected: boolean; large?: boolean;
}) {
  if (!day) return <div />;
  const dayNum = Number(day.date.split("-")[2]);

  const cfg: Record<DayStatus, { bg: string; text: string; ring: string }> = {
    available: {
      bg:   "bg-primary/10",
      text: "text-primary font-semibold",
      ring: selected ? "ring-2 ring-primary" : "",
    },
    blocked: {
      bg:   "bg-muted",
      text: "text-muted-foreground",
      ring: selected ? "ring-2 ring-muted-foreground" : "",
    },
    booked: {
      bg:   "bg-amber-50",
      text: "text-amber-700 font-semibold",
      ring: selected ? "ring-2 ring-amber-400" : "",
    },
    past: {
      bg:   "bg-transparent",
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
        "aspect-square rounded-xl flex flex-col items-center justify-center transition-all",
        large ? "text-sm" : "text-xs",
        bg, text, ring,
        interactive ? "hover:opacity-80 active:scale-95 cursor-pointer" : "cursor-default"
      )}
    >
      <span className="leading-none">{dayNum}</span>
      {day.status === "booked"   && <div className="w-1 h-1 rounded-full bg-amber-500 mt-0.5" />}
      {day.status === "blocked"  && <div className="w-1 h-1 rounded-full bg-muted-foreground/50 mt-0.5" />}
    </button>
  );
}

/* ── Shared calendar panel (used in both mobile and desktop) ── */
function CalendarPanel({
  days, isLoading, monthLabel,
  prevMonth, nextMonth,
  selected, handleTap,
  large = false,
}: {
  days: Day[]; isLoading: boolean; monthLabel: string;
  prevMonth: () => void; nextMonth: () => void;
  selected: Day | null; handleTap: (d: Day) => void;
  large?: boolean;
}) {
  const firstDate = days[0]?.date;
  const startPad  = firstDate
    ? (() => { const dow = new Date(firstDate + "T00:00:00").getDay(); return dow === 0 ? 6 : dow - 1; })()
    : 0;
  const grid: (Day | null)[] = [...Array(startPad).fill(null), ...days];
  while (grid.length % 7 !== 0) grid.push(null);

  return (
    <div className="bg-card border border-border rounded-2xl p-4">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <ChevronLeft size={16} />
        </button>
        <p className={cn("font-bold text-foreground", large ? "text-sm" : "text-sm")}>{monthLabel}</p>
        <button onClick={nextMonth} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
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

      {/* Grid */}
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
              large={large}
            />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border justify-center flex-wrap">
        {[
          { dot: "bg-primary/60",             label: "Available" },
          { dot: "bg-muted-foreground/40",    label: "Blocked"   },
          { dot: "bg-amber-400",              label: "Booked"    },
          { dot: "bg-transparent border border-muted-foreground/20", label: "Past" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={cn("w-2.5 h-2.5 rounded-sm", l.dot)} />
            <span className="text-[10px] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Day action panel ────────────────────────────────── */
function DayActionPanel({
  selected, showReason, setShowReason, setSelected,
  pendingReason, setPendingReason,
  handleBlock, confirmBlock,
  isPending,
}: {
  selected: Day; showReason: boolean; setShowReason: (v: boolean) => void;
  setSelected: (v: Day | null) => void;
  pendingReason: string; setPendingReason: (v: string) => void;
  handleBlock: () => void; confirmBlock: (r: string) => void;
  isPending: boolean;
}) {
  return (
    <>
      {!showReason && (
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-foreground">
                {new Date(selected.date + "T00:00:00").toLocaleDateString("en-GB", {
                  weekday: "long", day: "numeric", month: "long",
                })}
              </p>
              <p className={cn("text-xs mt-0.5 font-medium", {
                "text-primary":           selected.status === "available",
                "text-muted-foreground":  selected.status === "blocked",
                "text-amber-600":         selected.status === "booked",
              })}>
                {selected.status === "available" && "Available"}
                {selected.status === "blocked"   && `Blocked${selected.reason ? ` — ${REASON_LABELS[selected.reason] || selected.reason}` : ""}`}
                {selected.status === "booked"    && "Has a booking"}
              </p>
            </div>
            <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground">
              <XCircle size={18} />
            </button>
          </div>

          {selected.status !== "booked" && (
            <button
              onClick={handleBlock}
              disabled={isPending}
              className={cn(
                "w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all",
                selected.status === "blocked"
                  ? "bg-primary/10 text-primary hover:bg-primary/15"
                  : "bg-muted text-foreground hover:bg-muted/80"
              )}
            >
              {isPending ? (
                <Loader2 size={15} className="animate-spin" />
              ) : selected.status === "blocked" ? (
                <><CheckCircle2 size={15} />Mark as available</>
              ) : (
                <><Lock size={15} />Block this day</>
              )}
            </button>
          )}

          {selected.status === "booked" && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
              <Info size={13} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">This day has a confirmed booking and can't be blocked.</p>
            </div>
          )}
        </div>
      )}

      {showReason && (
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
              disabled={isPending}
              className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-bold disabled:opacity-70"
            >
              {isPending ? "Blocking…" : "Confirm"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

/* ════════════════════════════════════ PAGE ════════════════════════════════════ */
export default function CleanerAvailability() {
  const [, setLocation] = useLocation();
  const { toast }       = useToast();
  const queryClient     = useQueryClient();

  const now = new Date();
  const [year,          setYear]          = useState(now.getFullYear());
  const [month,         setMonth]         = useState(now.getMonth() + 1);
  const [selected,      setSelected]      = useState<Day | null>(null);
  const [showReason,    setShowReason]    = useState(false);
  const [pendingReason, setPendingReason] = useState("holiday");

  // Recurring preferences (desktop UI state — persisted to API in real product)
  const [workDays,      setWorkDays]      = useState<number[]>([0, 1, 2, 3, 4]); // Mon–Fri indices
  const [shortNotice,   setShortNotice]   = useState(true);

  const monthStr  = `${year}-${String(month).padStart(2, "0")}`;
  const queryKey  = ["cleaner-calendar", CLEANER_ID, monthStr];

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
            d.date === date ? { ...d, status: isBlocked ? "blocked" : "available", reason } : d
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

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1);
    setSelected(null);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1);
    setSelected(null);
  };

  const days      = data?.days || [];
  const monthLabel = new Date(year, month - 1, 1).toLocaleString("en-GB", { month: "long", year: "numeric" });

  const stats = {
    available: days.filter((d) => d.status === "available").length,
    blocked:   days.filter((d) => d.status === "blocked").length,
    booked:    days.filter((d) => d.status === "booked").length,
  };

  const handleTap = (day: Day) => {
    if (selected?.date === day.date) { setSelected(null); return; }
    setSelected(day);
    setShowReason(false);
  };
  const handleBlock = () => {
    if (!selected) return;
    if (selected.status === "blocked") mutation.mutate({ date: selected.date, isBlocked: false });
    else setShowReason(true);
  };
  const confirmBlock = (reason: string) => {
    if (!selected) return;
    mutation.mutate({ date: selected.date, isBlocked: true, reason });
  };

  const toggleWorkDay = (idx: number) => {
    setWorkDays((prev) =>
      prev.includes(idx) ? prev.filter((d) => d !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background pb-24 md:pb-8">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="bg-card border-b border-border px-4 md:px-6 pt-14 md:pt-8 pb-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto md:max-w-none flex items-center gap-3">
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

      {/* ══════════ MOBILE (< md) ══════════════════════════════ */}
      <div className="md:hidden max-w-md mx-auto w-full px-4 pt-5 flex flex-col gap-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Available", value: stats.available, color: "text-primary",          dot: "bg-primary/70" },
            { label: "Blocked",   value: stats.blocked,   color: "text-muted-foreground", dot: "bg-muted-foreground/50" },
            { label: "Booked",    value: stats.booked,    color: "text-amber-600",         dot: "bg-amber-400" },
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

        <CalendarPanel
          days={days} isLoading={isLoading} monthLabel={monthLabel}
          prevMonth={prevMonth} nextMonth={nextMonth}
          selected={selected} handleTap={handleTap}
        />

        {selected && (
          <DayActionPanel
            selected={selected}
            showReason={showReason} setShowReason={setShowReason}
            setSelected={setSelected}
            pendingReason={pendingReason} setPendingReason={setPendingReason}
            handleBlock={handleBlock} confirmBlock={confirmBlock}
            isPending={mutation.isPending}
          />
        )}

        <div className="bg-muted/50 rounded-2xl p-3.5">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Tip:</span> Keeping your calendar
            up to date reduces last-minute cancellations and improves your trust score.
          </p>
        </div>
      </div>

      {/* ══════════ DESKTOP (md+) ══════════════════════════════ */}
      <div className="hidden md:flex gap-6 px-6 py-6 items-start">

        {/* LEFT: calendar */}
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          <CalendarPanel
            days={days} isLoading={isLoading} monthLabel={monthLabel}
            prevMonth={prevMonth} nextMonth={nextMonth}
            selected={selected} handleTap={handleTap}
            large
          />
        </div>

        {/* RIGHT: stats + action + preferences */}
        <aside className="w-[300px] shrink-0 sticky top-6 self-start flex flex-col gap-4">

          {/* Month stats */}
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">
              {monthLabel}
            </p>
            <div className="flex flex-col gap-2">
              {[
                { label: "Available days", value: stats.available, color: "text-primary",          dot: "bg-primary/70" },
                { label: "Blocked days",   value: stats.blocked,   color: "text-muted-foreground", dot: "bg-muted-foreground/50" },
                { label: "Booked days",    value: stats.booked,    color: "text-amber-600",         dot: "bg-amber-400" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", s.dot)} />
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                  <p className={cn("text-sm font-bold", s.color)}>
                    {isLoading ? "—" : s.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Selected day action */}
          {selected && (
            <DayActionPanel
              selected={selected}
              showReason={showReason} setShowReason={setShowReason}
              setSelected={setSelected}
              pendingReason={pendingReason} setPendingReason={setPendingReason}
              handleBlock={handleBlock} confirmBlock={confirmBlock}
              isPending={mutation.isPending}
            />
          )}

          {/* Recurring preferences */}
          <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-4">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Recurring Preferences
            </p>

            {/* Preferred working days */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Repeat2 size={12} className="text-primary" />
                <p className="text-xs font-semibold text-foreground">Preferred working days</p>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {DAY_LABELS_FULL.map((d, idx) => (
                  <button
                    key={d}
                    onClick={() => toggleWorkDay(idx)}
                    className={cn(
                      "aspect-square rounded-lg text-[9px] font-bold transition-all",
                      workDays.includes(idx)
                        ? "bg-primary/15 text-primary"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {d.slice(0, 1)}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                {workDays.length === 0
                  ? "No preferred days set"
                  : `${workDays.length} day${workDays.length !== 1 ? "s" : ""} per week`}
              </p>
            </div>

            {/* Short-notice toggle */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Zap size={12} className="text-amber-500" />
                <p className="text-xs font-semibold text-foreground">Short-notice availability</p>
              </div>
              <button
                onClick={() => setShortNotice((v) => !v)}
                className={cn(
                  "w-full flex items-center justify-between text-xs px-3 py-2.5 rounded-xl border font-medium transition-all",
                  shortNotice
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-muted text-muted-foreground border-border hover:border-primary/40"
                )}
              >
                <span>{shortNotice ? "Accepting same-day requests" : "No same-day requests"}</span>
                <div className={cn("w-8 h-4 rounded-full transition-all", shortNotice ? "bg-amber-400" : "bg-muted-foreground/30")}>
                  <div className={cn("w-3.5 h-3.5 rounded-full bg-white shadow-sm mt-[1px] ml-[1px] transition-all", shortNotice ? "translate-x-4" : "translate-x-0")} />
                </div>
              </button>
            </div>

            {/* Response window */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Clock size={12} className="text-primary" />
                <p className="text-xs font-semibold text-foreground">Notice period</p>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {["2 hrs", "4 hrs", "24 hrs"].map((t) => (
                  <button
                    key={t}
                    className="py-2 rounded-xl text-[10px] font-semibold border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground transition-all"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tip */}
          <div className="bg-muted/50 rounded-2xl p-3.5">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">Tip:</span> Keeping your calendar
              current reduces last-minute cancellations and lifts your trust score.
              Days with confirmed bookings cannot be blocked.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
