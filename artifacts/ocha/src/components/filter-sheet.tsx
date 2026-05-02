import { X, SlidersHorizontal, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FilterState {
  minRate: number;
  maxRate: number;
  minRating: number;
  badge: "" | "verified" | "trusted";
  availableOnly: boolean;
}

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onChange: (f: FilterState) => void;
  onApply: () => void;
  onReset: () => void;
  activeCount: number;
}

const RATE_OPTIONS = [
  { label: "Any price", min: 0, max: 999 },
  { label: "Up to £20/hr", min: 0, max: 20 },
  { label: "£20–£25/hr", min: 20, max: 25 },
  { label: "£25–£30/hr", min: 25, max: 30 },
  { label: "£30+/hr", min: 30, max: 999 },
];

const RATING_OPTIONS = [
  { label: "Any", value: 0 },
  { label: "4.0+", value: 4.0 },
  { label: "4.5+", value: 4.5 },
  { label: "4.8+", value: 4.8 },
];

const BADGE_OPTIONS: { label: string; value: FilterState["badge"] }[] = [
  { label: "Any", value: "" },
  { label: "Verified", value: "verified" },
  { label: "Trusted", value: "trusted" },
];

export function FilterSheet({
  open,
  onClose,
  filters,
  onChange,
  onApply,
  onReset,
  activeCount,
}: FilterSheetProps) {
  const selectedRate = RATE_OPTIONS.findIndex(
    (o) => o.min === filters.minRate && o.max === filters.maxRate
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          "fixed inset-0 bg-black/40 z-40 transition-opacity duration-200",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
      />

      {/* Sheet */}
      <div
        className={cn(
          "fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-card rounded-t-3xl z-50 transition-transform duration-300 ease-out shadow-2xl",
          open ? "translate-y-0" : "translate-y-full"
        )}
        style={{ maxHeight: "85vh", overflowY: "auto" }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={16} className="text-primary" />
            <h2 className="text-sm font-bold text-foreground">Filters</h2>
            {activeCount > 0 && (
              <span className="text-[10px] font-bold bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">
                {activeCount}
              </span>
            )}
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-6">
          {/* Available only toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Available now</p>
              <p className="text-xs text-muted-foreground mt-0.5">Only show cleaners ready to book</p>
            </div>
            <button
              onClick={() => onChange({ ...filters, availableOnly: !filters.availableOnly })}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors",
                filters.availableOnly ? "bg-primary" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
                  filters.availableOnly ? "translate-x-5.5" : "translate-x-0.5"
                )}
              />
            </button>
          </div>

          {/* Price range */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Hourly rate</p>
            <div className="flex flex-wrap gap-2">
              {RATE_OPTIONS.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => onChange({ ...filters, minRate: opt.min, maxRate: opt.max })}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border font-medium transition-all",
                    selectedRate === i || (i === 0 && selectedRate === -1)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:border-primary/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Minimum rating */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Minimum rating</p>
            <div className="flex gap-2">
              {RATING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onChange({ ...filters, minRating: opt.value })}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-1 text-xs px-2 py-2 rounded-xl border font-medium transition-all",
                    filters.minRating === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:border-primary/50"
                  )}
                >
                  {opt.value > 0 && <Star size={10} className="fill-current" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trust badge */}
          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Trust badge</p>
            <div className="flex gap-2">
              {BADGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => onChange({ ...filters, badge: opt.value })}
                  className={cn(
                    "flex-1 text-xs px-3 py-2 rounded-xl border font-medium transition-all",
                    filters.badge === opt.value
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-foreground border-border hover:border-primary/50"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border flex gap-3 pb-8">
          <button
            onClick={onReset}
            className="flex-1 border border-border rounded-2xl py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            Reset all
          </button>
          <button
            onClick={() => { onApply(); onClose(); }}
            className="flex-1 bg-primary text-primary-foreground rounded-2xl py-3.5 text-sm font-bold"
          >
            Show results
          </button>
        </div>
      </div>
    </>
  );
}
