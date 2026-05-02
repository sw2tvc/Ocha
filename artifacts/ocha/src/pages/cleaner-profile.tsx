import { useParams, useLocation } from "wouter";
import { ArrowLeft, Star, CheckCircle2, Clock, Repeat2, ThumbsUp, MapPin, Calendar } from "lucide-react";
import { useGetCleaner, useGetCleanerReviews, getGetCleanerQueryKey, getGetCleanerReviewsQueryKey } from "@workspace/api-client-react";
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

export default function CleanerProfile() {
  const { cleanerId } = useParams();
  const [, setLocation] = useLocation();

  const { data: cleaner, isLoading } = useGetCleaner(cleanerId!, {
    query: { enabled: !!cleanerId, queryKey: getGetCleanerQueryKey(cleanerId!) },
  });

  const { data: reviewsData } = useGetCleanerReviews(cleanerId!, undefined, {
    query: { enabled: !!cleanerId, queryKey: getGetCleanerReviewsQueryKey(cleanerId!, undefined) },
  });

  const data = cleaner || MOCK_CLEANERS.find((c) => c.id === cleanerId) || MOCK_CLEANERS[0];
  const reviews = reviewsData?.reviews || [];

  return (
    <div className="flex flex-col min-h-screen pb-24 bg-background">
      {/* Back button */}
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
          <Skeleton className="h-4 w-3/4" />
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
            <h1 className="text-xl font-bold text-foreground mb-1" data-testid="text-cleaner-name">
              {(data as any).fullName}
            </h1>
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrustBadge badge={(data as any).verificationBadge as any || "none"} />
              {(data as any).isAvailable ? (
                <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full">
                  Available · {(data as any).eta || "Now"}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Offline</span>
              )}
            </div>
            {(data as any).bio && (
              <p className="text-sm text-muted-foreground leading-relaxed px-2">{(data as any).bio}</p>
            )}
          </div>

          {/* Trust score + metrics */}
          <div className="px-4 mb-4">
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-4 mb-4">
                <TrustScoreRing score={(data as any).trustScore || 0} size={64} strokeWidth={5} />
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Trust Score</p>
                  <p className="text-2xl font-bold text-foreground">{(data as any).trustScore || 0}</p>
                  <p className="text-xs text-muted-foreground">Based on {(data as any).totalBookings || 0} bookings</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Star, label: "Rating", value: `${((data as any).averageRating || 0).toFixed(1)} ★`, sub: `${(data as any).reviewCount || 0} reviews` },
                  { icon: CheckCircle2, label: "Completion", value: `${(data as any).completionRate || 0}%`, sub: "All jobs" },
                  { icon: ThumbsUp, label: "Work again", value: `${(data as any).wouldWorkAgainPct || 0}%`, sub: "Would rebook" },
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
                    <p className="text-xs font-semibold">{(data as any).repeatBookingRate || 0}%</p>
                    <p className="text-[10px] text-muted-foreground">Repeat clients</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-primary" />
                  <div>
                    <p className="text-xs font-semibold">{(data as any).responseTime || "< 1 hr"}</p>
                    <p className="text-[10px] text-muted-foreground">Avg response</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Services */}
          {(data as any).serviceTypes?.length > 0 && (
            <div className="px-4 mb-4">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wide mb-2">Services</h2>
              <div className="flex flex-wrap gap-2">
                {(data as any).serviceTypes.map((type: string) => (
                  <span key={type} className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
                    {SERVICE_LABELS[type] || type}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Service area */}
          <div className="px-4 mb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted rounded-xl px-3 py-2">
              <MapPin size={13} />
              <span>Covers up to {(data as any).serviceRadius || 10}km radius · £{(data as any).hourlyRate || 0}/hr</span>
            </div>
          </div>

          {/* Reviews */}
          <div className="px-4 mb-4">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">Recent Reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">No reviews yet</p>
            ) : (
              <div className="flex flex-col gap-3">
                {reviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="bg-card border border-border rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i < Math.round(review.overallRating) ? "text-amber-500 fill-amber-500" : "text-muted"}
                          />
                        ))}
                      </div>
                      {review.wouldWorkAgain && (
                        <span className="text-[10px] text-green-600 font-medium">Would rebook</span>
                      )}
                    </div>
                    {review.comment && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
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
