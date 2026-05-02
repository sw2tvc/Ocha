import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft,
  Star,
  CheckCircle2,
  Clock,
  Repeat2,
  ThumbsUp,
  MapPin,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  useGetCleaner,
  useGetCleanerReviews,
  getGetCleanerQueryKey,
  getGetCleanerReviewsQueryKey,
} from "@workspace/api-client-react";
import { TrustBadge, TrustScoreRing } from "@/components/trust-badge";
import { Skeleton } from "@/components/skeleton-loader";
import { MOCK_CLEANERS } from "@/lib/mock-data";

const SERVICE_LABELS: Record<string, string> = {
  standard: "Standard",
  deep_clean: "Deep Clean",
  end_of_tenancy: "End of Tenancy",
  airbnb_turnover: "Airbnb Turnover",
  office: "Office",
  recurring: "Recurring",
};

const DIMENSIONS = [
  { key: "qualityRating", label: "Quality" },
  { key: "punctualityRating", label: "Punctuality" },
  { key: "communicationRating", label: "Communication" },
  { key: "professionalismRating", label: "Professionalism" },
  { key: "reliabilityRating", label: "Reliability" },
] as const;

/* ── Compact star row ── */
function StarsRow({ rating, size = 13 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={
            s <= Math.round(rating)
              ? "text-amber-500 fill-amber-500"
              : "text-muted-foreground/30 fill-muted-foreground/10"
          }
        />
      ))}
    </div>
  );
}

/* ── Horizontal bar ── */
function DimBar({
  label,
  value,
  avg,
  showAvg = false,
}: {
  label: string;
  value: number;
  avg?: number;
  showAvg?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <p className="text-[11px] text-muted-foreground w-24 shrink-0">{label}</p>
      <div className="flex-1 relative h-1.5 bg-muted rounded-full overflow-hidden">
        {showAvg && avg != null && (
          <div
            className="absolute top-0 h-full w-0.5 bg-foreground/25 z-10"
            style={{ left: `${(avg / 5) * 100}%` }}
          />
        )}
        <div
          className="h-full bg-amber-400 rounded-full"
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="text-[11px] font-bold text-foreground w-5 text-right">
        {value.toFixed(1)}
      </span>
    </div>
  );
}

/* ── Rating summary header ── */
function RatingSummary({
  reviews,
  averageRating,
  wouldWorkAgainPct,
}: {
  reviews: any[];
  averageRating: number;
  wouldWorkAgainPct: number;
}) {
  /* star breakdown */
  const breakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.overallRating) === star).length,
  }));

  /* per-dimension averages */
  const dimAvgs = DIMENSIONS.map(({ key, label }) => {
    const vals = reviews.map((r) => r[key]).filter(Boolean);
    return { label, avg: vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0 };
  });

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden mb-4">
      <div className="px-4 pt-4 pb-3 flex items-start gap-5 border-b border-border">
        {/* Big average */}
        <div className="flex flex-col items-center shrink-0">
          <p className="text-4xl font-black text-foreground leading-none">
            {averageRating.toFixed(1)}
          </p>
          <StarsRow rating={averageRating} size={14} />
          <p className="text-[10px] text-muted-foreground mt-1">
            {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Star breakdown bars */}
        <div className="flex-1 flex flex-col gap-1 justify-center">
          {breakdown.map(({ star, count }) => {
            const pct = reviews.length ? (count / reviews.length) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <p className="text-[10px] text-muted-foreground w-3 text-right shrink-0">{star}</p>
                <Star size={9} className="text-amber-400 fill-amber-400 shrink-0" />
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground w-3 shrink-0">{count}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dimension averages */}
      <div className="px-4 py-3 flex flex-col gap-2 border-b border-border">
        {dimAvgs.filter((d) => d.avg > 0).map((d) => (
          <DimBar key={d.label} label={d.label} value={d.avg} />
        ))}
      </div>

      {/* Would rebook pill */}
      <div className="px-4 py-3 flex items-center gap-2">
        <ThumbsUp size={13} className="text-green-600" />
        <p className="text-xs font-semibold text-foreground">
          {wouldWorkAgainPct}% of customers would rebook
        </p>
        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full"
            style={{ width: `${wouldWorkAgainPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Single review card ── */
function ReviewCard({
  review,
  cleanerAvgRating,
}: {
  review: any;
  cleanerAvgRating: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const overall: number = review.overallRating ?? 0;
  const date = new Date(review.createdAt);
  const dateStr = date.toLocaleDateString("en-GB", { month: "long", year: "numeric" });

  const hasDims = DIMENSIONS.some(({ key }) => review[key] != null);

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          {/* Anonymous avatar */}
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <ShieldCheck size={14} className="text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold text-foreground">Verified customer</p>
            <p className="text-[10px] text-muted-foreground">{dateStr}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <StarsRow rating={overall} size={13} />
          <p className="text-xs font-bold text-foreground">{overall.toFixed(1)}</p>
        </div>
      </div>

      {/* Comment */}
      {review.comment && (
        <p className="text-sm text-muted-foreground leading-relaxed">"{review.comment}"</p>
      )}

      {/* Dimension breakdown — expandable */}
      {hasDims && (
        <>
          {expanded && (
            <div className="flex flex-col gap-1.5 pt-1 border-t border-border">
              {DIMENSIONS.map(({ key, label }) =>
                review[key] != null ? (
                  <DimBar
                    key={key}
                    label={label}
                    value={review[key]}
                    avg={cleanerAvgRating}
                    showAvg
                  />
                ) : null
              )}
            </div>
          )}

          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-[11px] text-primary font-medium self-start"
          >
            {expanded ? (
              <>
                <ChevronUp size={12} />
                Hide breakdown
              </>
            ) : (
              <>
                <ChevronDown size={12} />
                View dimension breakdown
              </>
            )}
          </button>
        </>
      )}

      {/* Would rebook */}
      <div className="flex items-center gap-1.5 pt-0.5">
        <ThumbsUp
          size={11}
          className={review.wouldWorkAgain ? "text-green-500" : "text-muted-foreground"}
        />
        <p
          className={`text-[11px] font-medium ${
            review.wouldWorkAgain ? "text-green-600" : "text-muted-foreground"
          }`}
        >
          {review.wouldWorkAgain ? "Would book again" : "Would not book again"}
        </p>
      </div>
    </div>
  );
}

/* ════════════════════════════════════ PAGE ════════════════════════════════════ */
export default function CleanerProfile() {
  const { cleanerId } = useParams();
  const [, setLocation] = useLocation();
  const [showAllReviews, setShowAllReviews] = useState(false);

  const { data: cleaner, isLoading } = useGetCleaner(cleanerId!, {
    query: { enabled: !!cleanerId, queryKey: getGetCleanerQueryKey(cleanerId!) },
  });

  const { data: reviewsData } = useGetCleanerReviews(cleanerId!, undefined, {
    query: {
      enabled: !!cleanerId,
      queryKey: getGetCleanerReviewsQueryKey(cleanerId!, undefined),
    },
  });

  const data = cleaner || MOCK_CLEANERS.find((c) => c.id === cleanerId) || MOCK_CLEANERS[0];
  const reviews = reviewsData?.reviews || [];
  const avgRating: number = (reviewsData as any)?.averageRating ?? (data as any).averageRating ?? 0;
  const wouldWorkAgainPct: number =
    (reviewsData as any)?.wouldWorkAgainPct ?? (data as any).wouldWorkAgainPct ?? 0;

  const PREVIEW_COUNT = 3;
  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, PREVIEW_COUNT);

  return (
    <div className="flex flex-col min-h-screen pb-28 bg-background">
      {/* Header */}
      <div className="bg-background px-4 pt-14 pb-2 sticky top-0 z-10 flex items-center gap-3">
        <button
          data-testid="button-back"
          onClick={() => setLocation("/cleaners")}
          className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft size={18} className="text-foreground" />
        </button>
        <span className="text-sm font-semibold text-foreground">Cleaner Profile</span>
      </div>

      {isLoading ? (
        <div className="px-4 pt-2 flex flex-col gap-4 max-w-md mx-auto w-full">
          <Skeleton className="h-24 w-24 rounded-full mx-auto" />
          <Skeleton className="h-6 w-40 mx-auto" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      ) : (
        <div className="max-w-md mx-auto w-full">
          {/* Profile header */}
          <div className="px-4 pt-2 pb-6 text-center">
            <div className="relative inline-block mb-3">
              <img
                src={(data as any).avatarUrl || `https://i.pravatar.cc/120?u=${cleanerId}`}
                alt={(data as any).fullName}
                className="w-24 h-24 rounded-full object-cover mx-auto"
                data-testid="img-cleaner-avatar"
              />
              {(data as any).isAvailable && (
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background" />
              )}
            </div>
            <h1
              className="text-xl font-bold text-foreground mb-1"
              data-testid="text-cleaner-name"
            >
              {(data as any).fullName}
            </h1>
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrustBadge badge={((data as any).verificationBadge as any) || "none"} />
              {(data as any).isAvailable ? (
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                  Available · {(data as any).eta || "Now"}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Offline
                </span>
              )}
            </div>
            {(data as any).bio && (
              <p className="text-sm text-muted-foreground leading-relaxed px-2">
                {(data as any).bio}
              </p>
            )}
          </div>

          {/* Trust score + metrics */}
          <div className="px-4 mb-4">
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-4 mb-4">
                <TrustScoreRing score={(data as any).trustScore || 0} size={64} strokeWidth={5} />
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Trust Score
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {(data as any).trustScore || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Based on {(data as any).totalBookings || 0} bookings
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    icon: Star,
                    label: "Rating",
                    value: `${((data as any).averageRating || 0).toFixed(1)} ★`,
                    sub: `${(data as any).reviewCount || 0} reviews`,
                  },
                  {
                    icon: CheckCircle2,
                    label: "Completion",
                    value: `${(data as any).completionRate || 0}%`,
                    sub: "All jobs",
                  },
                  {
                    icon: ThumbsUp,
                    label: "Work again",
                    value: `${(data as any).wouldWorkAgainPct || 0}%`,
                    sub: "Would rebook",
                  },
                ].map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div key={metric.label} className="text-center">
                      <div className="flex justify-center mb-1">
                        <Icon size={14} className="text-primary" />
                      </div>
                      <p className="text-sm font-bold text-foreground">{metric.value}</p>
                      <p className="text-[10px] text-muted-foreground">{metric.sub}</p>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5">
                  <Repeat2 size={13} className="text-primary" />
                  <div>
                    <p className="text-xs font-semibold">
                      {(data as any).repeatBookingRate || 0}%
                    </p>
                    <p className="text-[10px] text-muted-foreground">Repeat clients</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-primary" />
                  <div>
                    <p className="text-xs font-semibold">
                      {(data as any).responseTime || "< 1 hr"}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Avg response</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Services */}
          {(data as any).serviceTypes?.length > 0 && (
            <div className="px-4 mb-4">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wide mb-2">
                Services
              </h2>
              <div className="flex flex-wrap gap-2">
                {(data as any).serviceTypes.map((type: string) => (
                  <span
                    key={type}
                    className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium"
                  >
                    {SERVICE_LABELS[type] || type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Service area */}
          <div className="px-4 mb-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-xl px-3 py-2">
              <MapPin size={13} />
              <span>
                Covers up to {(data as any).serviceRadius || 10}km radius · £
                {(data as any).hourlyRate || 0}/hr
              </span>
            </div>
          </div>

          {/* ── Reviews section ── */}
          <div className="px-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wide">
                Reviews
              </h2>
              {reviews.length > 0 && (
                <div className="flex items-center gap-1">
                  <Star size={11} className="text-amber-500 fill-amber-500" />
                  <span className="text-xs font-bold text-foreground">
                    {avgRating.toFixed(1)}
                  </span>
                  <span className="text-xs text-muted-foreground">· {reviews.length} verified</span>
                </div>
              )}
            </div>

            {reviews.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                  <Star size={16} className="text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No reviews yet</p>
                <p className="text-xs text-muted-foreground">
                  Be the first to leave a verified review after your booking.
                </p>
              </div>
            ) : (
              <>
                {/* Rating summary */}
                <RatingSummary
                  reviews={reviews}
                  averageRating={avgRating}
                  wouldWorkAgainPct={wouldWorkAgainPct}
                />

                {/* Review cards */}
                <div className="flex flex-col gap-3">
                  {visibleReviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      cleanerAvgRating={avgRating}
                    />
                  ))}
                </div>

                {/* Show more / less */}
                {reviews.length > PREVIEW_COUNT && (
                  <button
                    onClick={() => setShowAllReviews((v) => !v)}
                    className="w-full mt-3 py-3 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    {showAllReviews ? (
                      <>
                        <ChevronUp size={15} />
                        Show fewer reviews
                      </>
                    ) : (
                      <>
                        <ChevronDown size={15} />
                        Show all {reviews.length} reviews
                      </>
                    )}
                  </button>
                )}

                {/* Double-blind badge */}
                <div className="flex items-center justify-center gap-1.5 mt-3">
                  <ShieldCheck size={11} className="text-primary" />
                  <p className="text-[10px] text-muted-foreground">
                    All reviews verified · double-blind system
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Book CTA */}
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-md px-4">
        <button
          data-testid="button-book-cleaner"
          onClick={() => setLocation(`/book?cleanerId=${cleanerId}`)}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-sm shadow-lg hover:opacity-90 transition-all active:scale-98"
        >
          Book {(data as any).fullName?.split(" ")[0] || "Cleaner"}
        </button>
      </div>
    </div>
  );
}
