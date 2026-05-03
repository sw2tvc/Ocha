import { useLocation } from "wouter";
import { Shield, ShieldCheck, Phone, Mail, CreditCard, User, LogOut, ChevronRight, Building2, LayoutDashboard } from "lucide-react";
import { useGetMe, useGetMyTrustScore, getGetMeQueryKey, getGetMyTrustScoreQueryKey } from "@workspace/api-client-react";
import { TrustBadge, TrustScoreRing } from "@/components/trust-badge";
import { Skeleton } from "@/components/skeleton-loader";
import { MOCK_USER, MOCK_TRUST_PROFILE } from "@/lib/mock-data";
import { useWorkspace, Workspace, WORKSPACE_LABELS, WORKSPACE_HOME } from "@/lib/workspace-context";

const VERIFICATION_STEPS = [
  { key: "emailVerified", label: "Email verified", icon: Mail, description: "Required for all users" },
  { key: "phoneVerified", label: "Phone verified", icon: Phone, description: "Adds trust credibility" },
  { key: "paymentVerified", label: "Payment verified", icon: CreditCard, description: "Secure payment card" },
  { key: "idVerified", label: "ID verified", icon: Shield, description: "Government ID check" },
  { key: "selfieVerified", label: "Selfie verified", icon: User, description: "Face match" },
  { key: "addressVerified", label: "Address verified", icon: ShieldCheck, description: "Proof of address" },
];

const WORKSPACE_SWITCH_OPTIONS: { workspace: Workspace; icon: typeof Building2; label: string }[] = [
  { workspace: "customer", icon: Building2, label: "Book / Property Manager" },
  { workspace: "cleaner", icon: LayoutDashboard, label: "Work as Cleaner" },
  { workspace: "admin", icon: Shield, label: "Admin Dashboard" },
];

export default function Profile() {
  const [, setLocation] = useLocation();
  const { workspace, availableWorkspaces, setWorkspace } = useWorkspace();

  function switchWorkspace(w: Workspace) {
    setWorkspace(w);
    setLocation(WORKSPACE_HOME[w]);
  }

  const { data: user, isLoading: loadingUser } = useGetMe({
    query: { queryKey: getGetMeQueryKey() },
  });

  const { data: trustData } = useGetMyTrustScore({
    query: { queryKey: getGetMyTrustScoreQueryKey() },
  });

  const u = user || MOCK_USER;
  const trust = trustData || MOCK_TRUST_PROFILE;
  const verificationStatus = trust.verificationStatus || MOCK_TRUST_PROFILE.verificationStatus;

  const verifiedCount = Object.values(verificationStatus).filter(Boolean).length;
  const totalSteps = Object.keys(verificationStatus).length;

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-background">
      <div className="bg-primary text-primary-foreground px-4 pt-14 pb-8">
        <div className="max-w-md mx-auto">
          {loadingUser ? (
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-full bg-primary-foreground/20" />
              <div>
                <Skeleton className="h-5 w-32 bg-primary-foreground/20 mb-1" />
                <Skeleton className="h-3 w-24 bg-primary-foreground/20" />
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={u.avatarUrl || `https://i.pravatar.cc/64?u=${u.id}`}
                  alt={u.fullName || u.email}
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary-foreground/30"
                  data-testid="img-profile-avatar"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold truncate" data-testid="text-profile-name">{u.fullName || "Your Profile"}</h1>
                <p className="text-sm text-primary-foreground/70 truncate">{u.email}</p>
                <div className="mt-1">
                  <TrustBadge badge={u.verificationBadge || "none"} className="bg-primary-foreground/10 text-primary-foreground border-0" />
                </div>
              </div>
              <TrustScoreRing score={u.trustScore || 0} size={52} strokeWidth={4} className="text-primary-foreground/30" />
            </div>
          )}
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 -mt-3 flex flex-col gap-4">
        {/* Trust score card */}
        <div className="bg-card border border-border rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Trust Score</p>
            <span className="text-xs text-muted-foreground">{verifiedCount}/{totalSteps} verified</span>
          </div>

          {/* Progress bar */}
          <div className="mb-3">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-muted-foreground">Verification progress</span>
              <span className="font-semibold text-primary">{trust.overallScore}/100</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${trust.overallScore}%` }}
              />
            </div>
          </div>

          {/* Verification checklist */}
          <div className="flex flex-col gap-2">
            {VERIFICATION_STEPS.map((step) => {
              const verified = verificationStatus[step.key as keyof typeof verificationStatus];
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${verified ? "bg-primary/10" : "bg-muted"}`}>
                    <Icon size={13} className={verified ? "text-primary" : "text-muted-foreground"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium ${verified ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
                  </div>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${verified ? "bg-primary" : "border border-muted"}`}>
                    {verified && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Behavioural metrics */}
        {trust.behavioralMetrics && (
          <div className="bg-card border border-border rounded-2xl p-4">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">Your Metrics</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Completion", value: `${trust.behavioralMetrics.completionRate}%` },
                { label: "Cancellation", value: `${trust.behavioralMetrics.cancellationRate}%` },
                { label: "Would rebook", value: `${trust.behavioralMetrics.wouldWorkAgainPct}%` },
              ].map((metric) => (
                <div key={metric.label} className="text-center">
                  <p className="text-base font-bold text-foreground" data-testid={`metric-${metric.label}`}>{metric.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Account actions */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          {[
            { label: "Account & Settings", href: "/profile/settings", icon: User },
            { label: "Notifications", href: "/notifications", icon: Mail },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                data-testid={`button-${item.label.toLowerCase().replace(" ", "-")}`}
                onClick={() => setLocation(item.href)}
                className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
              >
                <Icon size={16} className="text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{item.label}</span>
                <ChevronRight size={14} className="text-muted-foreground ml-auto" />
              </button>
            );
          })}
        </div>

        {/* Workspace switcher (mobile) */}
        {availableWorkspaces.length > 1 && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-xs font-bold text-foreground uppercase tracking-wide">Workspace</p>
              <p className="text-xs text-muted-foreground mt-0.5">Currently: {WORKSPACE_LABELS[workspace]}</p>
            </div>
            {WORKSPACE_SWITCH_OPTIONS
              .filter((o) => availableWorkspaces.includes(o.workspace) && o.workspace !== workspace)
              .map(({ workspace: w, icon: Icon, label }) => (
                <button
                  key={w}
                  data-testid={`button-switch-workspace-${w}`}
                  onClick={() => switchWorkspace(w)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                >
                  <Icon size={16} className="text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">{label}</span>
                  <ChevronRight size={14} className="text-muted-foreground ml-auto" />
                </button>
              ))}
          </div>
        )}

        <button
          data-testid="button-sign-out"
          onClick={() => setLocation("/login")}
          className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3.5 text-destructive"
        >
          <LogOut size={16} />
          <span className="text-sm font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}
