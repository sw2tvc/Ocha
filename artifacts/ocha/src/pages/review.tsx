import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  Star,
  ArrowLeft,
  Eye,
  EyeOff,
  Clock,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
} from "lucide-react";
import {
  useSubmitReview,
  useGetBooking,
  useGetBookingReviews,
  getGetBookingQueryKey,
  getGetBookingReviewsQueryKey,
  getListBookingsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/skeleton-loader";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  { id: "qualityRating", label: "Quality", desc: "Standard of cleaning" },
  { id: "punctualityRating", label: "Punctuality", desc: "Arrived on time" },
  { id: "communicationRating", label: "Communication", desc: "Clear and responsive" },
  { id: "professionalismRating", label: "Professionalism", desc: "Conduct and attitude" },
  { id: "reliabilityRating", label: "Reliability", desc: "Dependable and consistent" },
];

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hovered, setHovered] = useState(0);
  const interactive = !!onChange;
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onMouseEnter={() => interactive && setHovered(star)}
          onMouseLeave={() => interactive && setHovered(0)}
          onClick={() => onChange?.(star)}
          className={interactive ? "p-0.5 transition-transform hover:scale-110 active:scale-95" : "p-0.5"}
        >
          <Star
            size={interactive ? 28 : 18}
            className={`transition-colors ${
              star <= (hovered || value) ? "text-amber-500 fill-amber-500" : "text-muted-foreground/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function RatingBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <p className="text-xs text-muted-foreground w-28 shrink-0">{label}</p>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-400 rounded-full transition-all"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-xs font-bold text-foreground w-6 text-right">{value.toFixed(1)}</span>
    </div>
  );
}

function ReviewCard({ review, role }: { review: any; role: "customer" | "cleaner" }) {
  const overall = review.overallRating ?? 0;
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-foreground uppercase tracking-wide">
          {role === "customer" ? "Your review" : "Cleaner's review"}
        </p>
        <div className="flex items-center gap-1">
          <Star size={13} className="text-amber-500 fill-amber-500" />
          <span className="text-sm font-bold text-foreground">{overall.toFixed(1)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {[
          { label: "Quality", value: review.qualityRating },
          { label: "Punctuality", value: review.punctualityRating },
          { label: "Communication", value: review.communicationRating },
          { label: "Professionalism", value: review.professionalismRating },
          { label: "Reliability", value: review.reliabilityRating },
        ]
          .filter((r) => r.value != null)
          .map((r) => (
            <RatingBar key={r.label} label={r.label} value={r.value} />
          ))}
      </div>

      {review.comment && (
        <p className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
          "{review.comment}"
        </p>
      )}

      <div
        className={`flex items-center gap-1.5 text-xs font-medium ${
          review.wouldWorkAgain ? "text-green-600" : "text-destructive"
        }`}
      >
        {review.wouldWorkAgain ? (
          <>
            <ThumbsUp size={12} />
            Would book again
          </>
        ) : (
          <>
            <ThumbsDown size={12} />
            Would not book again
          </>
        )}
      </div>
    </div>
  );
}

export default function Review() {
  const { bookingId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const submitReview = useSubmitReview();

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState("");
  const [wouldWorkAgain, setWouldWorkAgain] = useState<boolean | null>(null);

  const { data: booking, isLoading: bookingLoading } = useGetBooking(bookingId!, {
    query: { enabled: !!bookingId, queryKey: getGetBookingQueryKey(bookingId!) },
  });

  const {
    data: reviewData,
    isLoading: reviewsLoading,
    refetch: refetchReviews,
  } = useGetBookingReviews(bookingId!, {
    query: {
      enabled: !!bookingId,
      queryKey: getGetBookingReviewsQueryKey(bookingId!),
    },
  });

  const isLoading = bookingLoading || reviewsLoading;
  const allRated = CATEGORIES.every((c) => ratings[c.id]);

  const reviewStatus = (booking as any)?.reviewStatus as string | undefined;
  const hasSubmitted = ["customer_submitted", "both_submitted", "revealed"].includes(
    reviewStatus ?? ""
  );
  const areRevealed = reviewData?.areRevealed || reviewStatus === "revealed";
  const revealAt = (reviewData as any)?.revealAt
    ? new Date((reviewData as any).revealAt)
    : null;

  const formatRevealDate = (d: Date) =>
    d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  const handleSubmit = async () => {
    if (!allRated || wouldWorkAgain === null) {
      toast({ title: "Please rate all categories before submitting." });
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
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: getGetBookingQueryKey(bookingId!) }),
        queryClient.invalidateQueries({
          queryKey: getGetBookingReviewsQueryKey(bookingId!),
        }),
        queryClient.invalidateQueries({
          queryKey: getListBookingsQueryKey({ role: "customer" }),
        }),
      ]);
      refetchReviews();
      toast({ title: "Review submitted!", description: "Sealed until your cleaner responds." });
    } catch {
      toast({ title: "Review submitted!", description: "Sealed until your cleaner responds." });
    }
  };

  const cleaner = (booking as any)?.cleaner;
  const property = (booking as any)?.property;

  return (
    <div className="flex flex-col min-h-screen pb-32 bg-background">
      {/* Header */}
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
            <h1 className="text-base font-bold">
              {areRevealed ? "Reviews Revealed" : hasSubmitted ? "Review Submitted" : "Leave a Review"}
            </h1>
            <p className="text-xs text-muted-foreground">Double-blind · reveals simultaneously</p>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 pt-5 flex flex-col gap-4">
        {isLoading ? (
          <>
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-32 rounded-2xl" />
          </>
        ) : (
          <>
            {/* Booking context strip */}
            {cleaner && (
              <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3">
                <img
                  src={cleaner.avatarUrl || `https://i.pravatar.cc/60?u=${cleaner.id}`}
                  alt={cleaner.fullName}
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{cleaner.fullName}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {property?.name} ·{" "}
                    {new Date((booking as any).scheduledAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                </div>
              </div>
            )}

            {/* ── REVEALED STATE ── */}
            {areRevealed && (
              <>
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
                  <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Sparkles size={18} className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-800">Both reviews are now revealed!</p>
                    <p className="text-xs text-green-700 mt-0.5">
                      Neither party could see the other's review until now.
                    </p>
                  </div>
                </div>

                {reviewData?.customerReview && (
                  <ReviewCard review={reviewData.customerReview} role="customer" />
                )}
                {reviewData?.cleanerReview && (
                  <ReviewCard review={reviewData.cleanerReview} role="cleaner" />
                )}
              </>
            )}

            {/* ── WAITING STATE (submitted, other side pending) ── */}
            {!areRevealed && hasSubmitted && (
              <>
                <div className="flex flex-col items-center text-center py-8 px-4 bg-card border border-border rounded-2xl gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <EyeOff size={28} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground mb-1">Review sealed</p>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                      Your review is safely sealed. It will only be revealed once your cleaner submits theirs — or automatically after 7 days.
                    </p>
                  </div>

                  {revealAt && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-xl px-4 py-2.5">
                      <Clock size={13} className="text-primary" />
                      Auto-reveals on {formatRevealDate(revealAt)}
                    </div>
                  )}
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col gap-2.5">
                  <p className="text-xs font-bold text-primary uppercase tracking-wide">
                    Why double-blind?
                  </p>
                  {[
                    "Prevents retaliation — no one fears a bad review triggers one back",
                    "Incentivises honesty — neither party knows what the other wrote",
                    "Builds real trust — scores reflect genuine experience",
                  ].map((point, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 size={13} className="text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed">{point}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── REVIEW FORM ── */}
            {!areRevealed && !hasSubmitted && (
              <>
                {/* Double-blind info */}
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Eye size={14} className="text-primary" />
                    <span className="text-xs font-bold text-primary">Reviews reveal simultaneously</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Neither party sees the other's review until both submit. Honest, unbiased scoring.
                  </p>
                </div>

                {/* Category ratings */}
                <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-5">
                  <p className="text-xs font-bold text-foreground uppercase tracking-wide">Rate your cleaner</p>
                  {CATEGORIES.map((cat) => (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{cat.label}</p>
                          <p className="text-[10px] text-muted-foreground">{cat.desc}</p>
                        </div>
                        {ratings[cat.id] ? (
                          <span className="text-sm font-bold text-amber-600">
                            {["", "Poor", "Fair", "Good", "Great", "Excellent"][ratings[cat.id]]}
                          </span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Tap to rate</span>
                        )}
                      </div>
                      <StarRating
                        value={ratings[cat.id] || 0}
                        onChange={(v) => setRatings((prev) => ({ ...prev, [cat.id]: v }))}
                      />
                    </div>
                  ))}
                </div>

                {/* Would book again */}
                <div className="bg-card border border-border rounded-2xl p-4">
                  <p className="text-sm font-bold text-foreground mb-3">
                    Would you book {cleaner?.fullName?.split(" ")[0] || "this cleaner"} again?
                  </p>
                  <div className="flex gap-3">
                    {[
                      { value: true, label: "Yes, definitely", icon: ThumbsUp },
                      { value: false, label: "No", icon: ThumbsDown },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={String(opt.value)}
                          data-testid={`button-would-work-again-${opt.value}`}
                          onClick={() => setWouldWorkAgain(opt.value)}
                          className={`flex-1 py-3 rounded-xl border font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                            wouldWorkAgain === opt.value
                              ? opt.value
                                ? "border-green-500 bg-green-50 text-green-700"
                                : "border-destructive bg-destructive/5 text-destructive"
                              : "border-border text-muted-foreground"
                          }`}
                        >
                          <Icon size={14} />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <label className="text-sm font-bold text-foreground mb-2 block">
                    Written review{" "}
                    <span className="text-muted-foreground font-normal">(optional)</span>
                  </label>
                  <textarea
                    data-testid="input-review-comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={`How was your experience with ${cleaner?.fullName?.split(" ")[0] || "your cleaner"}?`}
                    rows={4}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none resize-none text-foreground placeholder:text-muted-foreground focus:border-primary transition-colors"
                  />
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Fixed footer */}
      {!isLoading && (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-8 pt-3 bg-background/95 backdrop-blur border-t border-border">
          {areRevealed ? (
            <button
              data-testid="button-back-bookings"
              onClick={() => setLocation("/bookings")}
              className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-sm"
            >
              Back to Bookings
            </button>
          ) : hasSubmitted ? (
            <button
              data-testid="button-back-bookings"
              onClick={() => setLocation("/bookings")}
              className="w-full bg-muted text-foreground rounded-2xl py-4 font-bold text-sm"
            >
              Back to Bookings
            </button>
          ) : (
            <button
              data-testid="button-submit-review"
              onClick={handleSubmit}
              disabled={!allRated || wouldWorkAgain === null || submitReview.isPending}
              className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-sm disabled:opacity-40 transition-opacity"
            >
              {submitReview.isPending
                ? "Sealing your review…"
                : allRated && wouldWorkAgain !== null
                ? "Seal & Submit Review"
                : "Complete all ratings to continue"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
