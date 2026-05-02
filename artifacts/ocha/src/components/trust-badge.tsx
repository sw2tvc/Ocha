import { ShieldCheck, ShieldAlert, Shield, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type Badge = "none" | "basic" | "verified" | "trusted";

interface TrustBadgeProps {
  badge: Badge;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const badgeConfig: Record<Badge, { label: string; icon: typeof Shield; color: string; bg: string }> = {
  none: { label: "Unverified", icon: ShieldAlert, color: "text-muted-foreground", bg: "bg-muted" },
  basic: { label: "Basic", icon: Shield, color: "text-blue-600", bg: "bg-blue-50" },
  verified: { label: "Verified", icon: ShieldCheck, color: "text-primary", bg: "bg-primary/10" },
  trusted: { label: "Trusted", icon: Star, color: "text-amber-600", bg: "bg-amber-50" },
};

const sizeConfig = {
  sm: { icon: 12, text: "text-[10px]", padding: "px-1.5 py-0.5 gap-1" },
  md: { icon: 14, text: "text-xs", padding: "px-2 py-1 gap-1.5" },
  lg: { icon: 16, text: "text-sm", padding: "px-3 py-1.5 gap-2" },
};

export function TrustBadge({ badge, size = "md", showLabel = true, className }: TrustBadgeProps) {
  const config = badgeConfig[badge];
  const sizes = sizeConfig[size];
  const Icon = config.icon;

  return (
    <span
      data-testid="trust-badge"
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        config.color,
        config.bg,
        sizes.padding,
        className
      )}
    >
      <Icon size={sizes.icon} strokeWidth={2} />
      {showLabel && <span className={sizes.text}>{config.label}</span>}
    </span>
  );
}

interface TrustScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function TrustScoreRing({ score, size = 56, strokeWidth = 4, className }: TrustScoreRingProps) {
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  const color = score >= 90 ? "#d97706" : score >= 75 ? "#0d9488" : score >= 50 ? "#3b82f6" : "#9ca3af";

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)} data-testid="trust-score-ring">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <span className="absolute text-xs font-bold" style={{ color }}>
        {score}
      </span>
    </div>
  );
}
