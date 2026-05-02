import { Link } from "wouter";
import { Star, Clock, CheckCircle2, MapPin, Repeat2 } from "lucide-react";
import { TrustBadge } from "./trust-badge";
import { cn } from "@/lib/utils";

interface CleanerProfile {
  id: string;
  fullName: string;
  avatarUrl?: string;
  bio?: string;
  serviceTypes?: string[];
  hourlyRate?: number;
  isAvailable?: boolean;
  verificationBadge?: "none" | "basic" | "verified" | "trusted";
  trustScore?: number;
  averageRating?: number;
  reviewCount?: number;
  completionRate?: number;
  repeatBookingRate?: number;
  wouldWorkAgainPct?: number;
  distanceKm?: number;
  eta?: string;
}

const SERVICE_LABELS: Record<string, string> = {
  standard: "Standard",
  deep_clean: "Deep Clean",
  end_of_tenancy: "End of Tenancy",
  airbnb_turnover: "Airbnb Turnover",
  office: "Office",
  recurring: "Recurring",
};

interface CleanerCardProps {
  cleaner: CleanerProfile;
  className?: string;
  compact?: boolean;
}

export function CleanerCard({ cleaner, className, compact = false }: CleanerCardProps) {
  return (
    <Link href={`/cleaners/${cleaner.id}`}>
      <div
        data-testid={`card-cleaner-${cleaner.id}`}
        className={cn(
          "bg-card border border-border rounded-2xl p-4 cursor-pointer hover-elevate active-elevate transition-shadow hover:shadow-md",
          className
        )}
      >
        <div className="flex gap-3">
          <div className="relative shrink-0">
            <img
              src={cleaner.avatarUrl || `https://i.pravatar.cc/80?u=${cleaner.id}`}
              alt={cleaner.fullName}
              className="w-14 h-14 rounded-full object-cover"
              data-testid={`img-avatar-${cleaner.id}`}
            />
            {cleaner.isAvailable && (
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 rounded-full border-2 border-card" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-sm truncate">{cleaner.fullName}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <TrustBadge badge={(cleaner.verificationBadge as any) || "none"} size="sm" />
                  {cleaner.isAvailable && (
                    <span className="text-[10px] text-green-600 font-medium">
                      {cleaner.eta ? `~ ${cleaner.eta}` : "Available"}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-foreground">£{cleaner.hourlyRate}/hr</div>
                <div className="flex items-center gap-0.5 justify-end mt-0.5">
                  <Star size={11} className="text-amber-500 fill-amber-500" />
                  <span className="text-xs font-medium">{cleaner.averageRating?.toFixed(1)}</span>
                  <span className="text-[10px] text-muted-foreground">({cleaner.reviewCount})</span>
                </div>
              </div>
            </div>

            {!compact && cleaner.bio && (
              <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{cleaner.bio}</p>
            )}

            <div className="flex items-center gap-3 mt-2">
              {cleaner.completionRate !== undefined && (
                <div className="flex items-center gap-1" data-testid={`text-completion-${cleaner.id}`}>
                  <CheckCircle2 size={11} className="text-primary" />
                  <span className="text-[10px] text-muted-foreground">{cleaner.completionRate}% completion</span>
                </div>
              )}
              {cleaner.repeatBookingRate !== undefined && (
                <div className="flex items-center gap-1">
                  <Repeat2 size={11} className="text-primary" />
                  <span className="text-[10px] text-muted-foreground">{cleaner.repeatBookingRate}% repeat</span>
                </div>
              )}
              {cleaner.distanceKm !== undefined && (
                <div className="flex items-center gap-1">
                  <MapPin size={11} className="text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{cleaner.distanceKm.toFixed(1)}km</span>
                </div>
              )}
            </div>

            {!compact && cleaner.serviceTypes && cleaner.serviceTypes.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {cleaner.serviceTypes.slice(0, 3).map((type) => (
                  <span key={type} className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">
                    {SERVICE_LABELS[type] || type}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
