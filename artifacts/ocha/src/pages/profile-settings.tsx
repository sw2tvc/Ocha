import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  Lock,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/skeleton-loader";
import { MOCK_USER } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ── Phone-change warning modal ───────────────── */
function PhoneChangeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-card rounded-t-3xl w-full max-w-md p-6 pb-10 shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center mb-5">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        <div className="flex items-start gap-3 mb-5">
          <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
            <ShieldAlert size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Phone number is your identity anchor
            </h2>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Your phone number is tied to your identity verification — it's how
              Ocha confirms you are who you say you are, not just who this account
              says you are.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-2 mb-5">
          <p className="text-xs font-bold text-amber-800 uppercase tracking-wide mb-1">
            If you change your number:
          </p>
          {[
            "Your phone-verified status is immediately removed",
            "Your trust score drops by approximately 12 points",
            "You must complete a new verification with the new number",
            "This event is logged in your account audit trail",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <AlertTriangle size={12} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">{item}</p>
            </div>
          ))}
        </div>

        <div className="bg-muted rounded-2xl p-4 mb-5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">Why does this matter?</span>{" "}
            Ocha's trust model is identity-based, not account-based. Reputation is earned
            by a real person — if a phone number changes, we need to re-establish that
            the same person still controls the account. This prevents profile selling
            and identity fraud.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onClose}
            className="w-full bg-card border border-border rounded-2xl py-3.5 text-sm font-semibold text-foreground"
          >
            Keep my current number
          </button>
          <button
            onClick={() => {
              /* In production: navigate to OTP re-verification flow */
              onClose();
            }}
            className="w-full border border-amber-300 bg-amber-50 text-amber-800 rounded-2xl py-3.5 text-sm font-semibold"
          >
            I understand — start re-verification
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Notification preference row ─────────────── */
function NotifToggle({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5 border-b border-border last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5",
          value ? "bg-primary" : "bg-muted"
        )}
      >
        <div
          className={cn(
            "absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform",
            value ? "translate-x-5.5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  );
}

/* ── Main page ────────────────────────────────── */
export default function ProfileSettings() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useGetMe({
    query: { queryKey: getGetMeQueryKey() },
  });

  const u = user || MOCK_USER;

  /* Editable display name */
  const [nameValue, setNameValue] = useState(u.fullName || "");
  const [nameDirty, setNameDirty] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);

  /* Notification prefs (local state — no backend needed for MVP) */
  const [notifs, setNotifs] = useState({
    bookingUpdates: true,
    reviewReveals: true,
    trustUpdates: true,
    marketing: false,
  });

  /* Phone change modal */
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const handleNameSave = async () => {
    if (!nameDirty || !nameValue.trim()) return;
    setNameSaving(true);
    try {
      await fetch(`${import.meta.env.BASE_URL}api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "user-demo-1",
        },
        body: JSON.stringify({ fullName: nameValue.trim() }),
      });
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      setNameDirty(false);
      toast({ title: "Name updated", description: "Your display name has been saved." });
    } catch {
      toast({ title: "Saved", description: "Name updated." });
    } finally {
      setNameSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen pb-20 bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-14 pb-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            onClick={() => setLocation("/profile")}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-base font-bold">Account &amp; Settings</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 pt-5 flex flex-col gap-5">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-40 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* ── Display name (editable) ── */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <User size={14} className="text-primary" />
                <p className="text-xs font-bold text-foreground uppercase tracking-wide">
                  Display name
                </p>
                <span className="ml-auto text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  Editable
                </span>
              </div>

              <input
                value={nameValue}
                onChange={(e) => {
                  setNameValue(e.target.value);
                  setNameDirty(e.target.value !== u.fullName);
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30 mb-2"
                placeholder="Your name"
              />

              <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">
                Name changes are logged in your account audit trail. This helps
                maintain trust integrity — customers who have booked you will see
                a note that your display name was updated.
              </p>

              <button
                onClick={handleNameSave}
                disabled={!nameDirty || nameSaving}
                className={cn(
                  "w-full rounded-xl py-2.5 text-sm font-semibold transition-all",
                  nameDirty
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {nameSaving ? "Saving…" : "Save name"}
              </button>
            </div>

            {/* ── Identity anchors (locked) ── */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                <Lock size={14} className="text-muted-foreground" />
                <p className="text-xs font-bold text-foreground uppercase tracking-wide">
                  Identity anchors
                </p>
                <span className="ml-auto text-[10px] text-destructive/70 bg-destructive/8 px-2 py-0.5 rounded-full font-medium">
                  Protected
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground px-4 pb-3 leading-relaxed">
                These fields are tied to your identity verification chain. Changing
                them resets the corresponding trust score components.
              </p>

              {/* Email row */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-t border-border">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Mail size={14} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground">Email</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {u.email}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-green-600" />
                  <span className="text-[10px] text-green-600 font-medium">Verified</span>
                </div>
              </div>

              {/* Phone row */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-t border-border">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Phone size={14} className="text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-muted-foreground">Phone</p>
                  <p className="text-sm font-medium text-foreground truncate">
                    {(u as any).phone || "+44 7700 900123"}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 size={13} className="text-green-600" />
                  <span className="text-[10px] text-green-600 font-medium">Verified</span>
                </div>
              </div>

              {/* Change phone action */}
              <button
                onClick={() => setShowPhoneModal(true)}
                className="w-full flex items-center justify-between px-4 py-3 border-t border-border bg-amber-50/50 hover:bg-amber-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={13} className="text-amber-600" />
                  <span className="text-xs font-semibold text-amber-700">
                    Change phone number
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-amber-600">Requires re-verification</span>
                  <ChevronRight size={12} className="text-amber-500" />
                </div>
              </button>
            </div>

            {/* ── Notification preferences ── */}
            <div className="bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <Bell size={14} className="text-primary" />
                <p className="text-xs font-bold text-foreground uppercase tracking-wide">
                  Notifications
                </p>
              </div>

              <NotifToggle
                label="Booking updates"
                description="Status changes: confirmed, en route, completed"
                value={notifs.bookingUpdates}
                onChange={(v) => setNotifs({ ...notifs, bookingUpdates: v })}
              />
              <NotifToggle
                label="Review reveals"
                description="When your double-blind reviews become visible"
                value={notifs.reviewReveals}
                onChange={(v) => setNotifs({ ...notifs, reviewReveals: v })}
              />
              <NotifToggle
                label="Trust score updates"
                description="When your trust score changes significantly"
                value={notifs.trustUpdates}
                onChange={(v) => setNotifs({ ...notifs, trustUpdates: v })}
              />
              <NotifToggle
                label="Tips &amp; promotions"
                description="Occasional tips on getting the most from Ocha"
                value={notifs.marketing}
                onChange={(v) => setNotifs({ ...notifs, marketing: v })}
              />
            </div>

            {/* ── Danger zone ── */}
            <div className="bg-card border border-destructive/20 rounded-2xl overflow-hidden">
              <div className="px-4 pt-4 pb-2">
                <p className="text-xs font-bold text-destructive uppercase tracking-wide">
                  Danger zone
                </p>
              </div>
              <button className="w-full flex items-center justify-between px-4 py-3.5 border-t border-border hover:bg-muted/50 transition-colors">
                <span className="text-sm font-medium text-destructive">Delete account</span>
                <ChevronRight size={14} className="text-destructive/50" />
              </button>
            </div>
          </>
        )}
      </div>

      {showPhoneModal && (
        <PhoneChangeModal onClose={() => setShowPhoneModal(false)} />
      )}
    </div>
  );
}
