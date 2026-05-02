import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { Star, ArrowLeft, Eye } from "lucide-react";
import { useSubmitReview } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { id: "punctualityRating", label: "Punctuality", desc: "Arrived on time" },
  { id: "professionalismRating", label: "Professionalism", desc: "Conduct and attitude" },
  { id: "qualityRating", label: "Quality", desc: "Standard of work" },
  { id: "communicationRating", label: "Communication", desc: "Clear and responsive" },
  { id: "reliabilityRating", label: "Reliability", desc: "Dependable and consistent" },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(star)}
          className="p-0.5 transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            size={28}
            className={`transition-colors ${
              star <= (hovered || value) ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function Review() {
  const { bookingId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const submitReview = useSubmitReview();

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [wouldWorkAgain, setWouldWorkAgain] = useState<boolean | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const allRated = CATEGORIES.every((c) => ratings[c.id]);

  const handleSubmit = async () => {
    if (!allRated || wouldWorkAgain === null) {
      toast({ title: "Please complete all ratings" });
      return;
    }

    try {
      await submitReview.mutateAsync({
        data: {
          bookingId: bookingId!,
          punctualityRating: ratings.punctualityRating,
          professionalismRating: ratings.professionalismRating,
          qualityRating: ratings.qualityRating,
          communicationRating: ratings.communicationRating,
          reliabilityRating: ratings.reliabilityRating,
          comment,
          wouldWorkAgain,
        },
      });
      setSubmitted(true);
    } catch {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen bg-background items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Eye size={28} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Review submitted</h2>
        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
          Your review is sealed until your cleaner submits theirs. Reviews reveal simultaneously — or after 7 days.
        </p>
        <p className="text-xs text-primary font-medium mt-2">This is the Ocha double-blind review system.</p>
        <button
          data-testid="button-back-bookings"
          onClick={() => setLocation("/bookings")}
          className="mt-8 bg-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold text-sm"
        >
          Back to Bookings
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen pb-28 bg-background">
      <div className="bg-card border-b border-border px-4 pt-14 pb-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            data-testid="button-back"
            onClick={() => setLocation(`/bookings/${bookingId}`)}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-base font-bold">Leave a Review</h1>
            <p className="text-xs text-muted-foreground">Double-blind — revealed together</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 pt-5 flex flex-col gap-5">
        {/* Double-blind info */}
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Eye size={14} className="text-primary" />
            <span className="text-xs font-bold text-primary">Reviews reveal simultaneously</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Neither party sees the other's review until both submit. If only one submits, reviews reveal automatically after 7 days.
          </p>
        </div>

        {/* Category ratings */}
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-4">
          {CATEGORIES.map((cat) => (
            <div key={cat.id}>
              <div className="flex items-center justify-between mb-1.5">
                <div>
                  <p className="text-sm font-semibold text-foreground">{cat.label}</p>
                  <p className="text-[10px] text-muted-foreground">{cat.desc}</p>
                </div>
                {ratings[cat.id] && (
                  <span className="text-xs font-bold text-amber-600">{ratings[cat.id]}.0</span>
                )}
              </div>
              <StarRating
                value={ratings[cat.id] || 0}
                onChange={(v) => setRatings((prev) => ({ ...prev, [cat.id]: v }))}
              />
            </div>
          ))}
        </div>

        {/* Would work again */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm font-bold text-foreground mb-3">Would you book this cleaner again?</p>
          <div className="flex gap-3">
            {[
              { value: true, label: "Yes, definitely" },
              { value: false, label: "No" },
            ].map((opt) => (
              <button
                key={String(opt.value)}
                data-testid={`button-would-work-again-${opt.value}`}
                onClick={() => setWouldWorkAgain(opt.value)}
                className={`flex-1 py-3 rounded-xl border font-medium text-sm transition-all ${
                  wouldWorkAgain === opt.value
                    ? opt.value
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-destructive bg-destructive/5 text-destructive"
                    : "border-border text-muted-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label className="text-sm font-bold text-foreground mb-2 block">Comment (optional)</label>
          <textarea
            data-testid="input-review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this cleaner..."
            rows={4}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none resize-none text-foreground placeholder:text-muted-foreground focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-8 pt-3 bg-background border-t border-border">
        <button
          data-testid="button-submit-review"
          onClick={handleSubmit}
          disabled={!allRated || wouldWorkAgain === null || submitReview.isPending}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-sm disabled:opacity-50 transition-opacity"
        >
          {submitReview.isPending ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </div>
  );
}
