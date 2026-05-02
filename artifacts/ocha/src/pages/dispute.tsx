import { useState } from "react";
import { useParams, useLocation } from "wouter";
import {
  ArrowLeft,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Clock,
  MessageSquare,
  ChevronRight,
  Loader2,
  Shield,
  FileText,
  HelpCircle,
  XCircle,
  Star,
} from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ── Types ─────────────────────────────────────── */
type DisputeStatus =
  | "open"
  | "evidence_submitted"
  | "under_review"
  | "resolved"
  | "dismissed";

type DisputeReason =
  | "incomplete_clean"
  | "damage"
  | "no_show"
  | "late_arrival"
  | "safety_concern"
  | "payment_issue"
  | "other";

interface DisputeData {
  id: string;
  bookingId: string;
  raisedBy: string;
  againstUserId: string;
  raisedByName: string;
  againstUserName: string;
  raisedByAvatar?: string;
  againstUserAvatar?: string;
  status: DisputeStatus;
  reason: DisputeReason;
  description: string;
  raisedByEvidence?: string | null;
  againstUserEvidence?: string | null;
  resolution?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

/* ── Constants ──────────────────────────────────── */
const REASONS: { id: DisputeReason; label: string; desc: string; icon: React.ElementType }[] = [
  { id: "incomplete_clean", label: "Incomplete clean", desc: "Areas were missed or not cleaned properly", icon: AlertTriangle },
  { id: "damage", label: "Property damage", desc: "Something was damaged during the service", icon: ShieldAlert },
  { id: "no_show", label: "Cleaner didn't show", desc: "The cleaner never arrived for the booking", icon: XCircle },
  { id: "late_arrival", label: "Significantly late", desc: "Arrived more than 30 minutes late", icon: Clock },
  { id: "safety_concern", label: "Safety concern", desc: "A serious safety issue occurred", icon: Shield },
  { id: "payment_issue", label: "Payment issue", desc: "Incorrect charge or billing problem", icon: FileText },
  { id: "other", label: "Something else", desc: "An issue not listed above", icon: HelpCircle },
];

const REASON_LABELS: Record<DisputeReason, string> = {
  incomplete_clean: "Incomplete clean",
  damage: "Property damage",
  no_show: "Cleaner didn't show",
  late_arrival: "Significantly late",
  safety_concern: "Safety concern",
  payment_issue: "Payment issue",
  other: "Other issue",
};

const STATUS_CONFIG: Record<DisputeStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  open: { label: "Under review", color: "text-amber-700", bg: "bg-amber-50 border-amber-200", icon: Clock },
  evidence_submitted: { label: "Evidence received", color: "text-blue-700", bg: "bg-blue-50 border-blue-200", icon: FileText },
  under_review: { label: "Ocha reviewing", color: "text-purple-700", bg: "bg-purple-50 border-purple-200", icon: Shield },
  resolved: { label: "Resolved", color: "text-green-700", bg: "bg-green-50 border-green-200", icon: CheckCircle2 },
  dismissed: { label: "Dismissed", color: "text-muted-foreground", bg: "bg-muted border-border", icon: XCircle },
};

/* ── Fetch helpers ──────────────────────────────── */
async function fetchDispute(bookingId: string): Promise<DisputeData> {
  const res = await fetch(`${import.meta.env.BASE_URL}api/bookings/${bookingId}/dispute`, {
    headers: { "x-user-id": "user-demo-1" },
  });
  if (!res.ok) throw new Error("no_dispute");
  return res.json();
}

async function raiseDispute(data: {
  bookingId: string;
  reason: DisputeReason;
  description: string;
}): Promise<{ disputeId: string; status: string }> {
  const res = await fetch(`${import.meta.env.BASE_URL}api/disputes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-id": "user-demo-1" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to raise dispute");
  }
  return res.json();
}

async function submitEvidence(data: { disputeId: string; evidence: string }) {
  const res = await fetch(`${import.meta.env.BASE_URL}api/disputes/${data.disputeId}/evidence`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-user-id": "user-demo-1" },
    body: JSON.stringify({ evidence: data.evidence }),
  });
  if (!res.ok) throw new Error("Failed to submit evidence");
  return res.json();
}

/* ── RaiseForm ──────────────────────────────────── */
function RaiseForm({ bookingId, onSuccess }: { bookingId: string; onSuccess: (d: DisputeData) => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState<"reason" | "describe">("reason");
  const [reason, setReason] = useState<DisputeReason | null>(null);
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: raiseDispute,
    onSuccess: async () => {
      /* Re-fetch dispute data to show the pending state */
      try {
        const dispute = await fetchDispute(bookingId);
        onSuccess(dispute);
      } catch {
        onSuccess({
          id: "pending",
          bookingId,
          raisedBy: "user-demo-1",
          againstUserId: "",
          raisedByName: "You",
          againstUserName: "Cleaner",
          status: "open",
          reason: reason!,
          description,
          createdAt: new Date().toISOString(),
        });
      }
    },
    onError: (err: Error) => {
      if (err.message.includes("already exists")) {
        toast({ title: "Dispute already raised", description: "A dispute is already open for this booking." });
      } else {
        toast({ title: "Something went wrong", description: err.message, variant: "destructive" });
      }
    },
  });

  if (step === "reason") {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-foreground mb-1">What went wrong?</h2>
          <p className="text-xs text-muted-foreground">Choose the category that best describes the issue.</p>
        </div>
        <div className="flex flex-col gap-2.5">
          {REASONS.map((r) => {
            const Icon = r.icon;
            const active = reason === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setReason(r.id)}
                className={cn(
                  "flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all",
                  active ? "border-destructive/40 bg-destructive/5" : "border-border bg-card hover:border-destructive/20"
                )}
              >
                <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                  active ? "bg-destructive/10" : "bg-muted"
                )}>
                  <Icon size={16} className={active ? "text-destructive" : "text-muted-foreground"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-semibold", active ? "text-destructive" : "text-foreground")}>{r.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{r.desc}</p>
                </div>
                {active && <CheckCircle2 size={16} className="text-destructive shrink-0" />}
              </button>
            );
          })}
        </div>

        <div className="bg-muted/50 rounded-2xl p-3.5">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">How disputes work:</span> Raising a dispute
            pauses the review reveal and notifies both parties. Ocha's Trust Team investigates
            within 24 hours using booking data, communication history, and evidence you provide.
            Frivolous disputes may affect your own trust score.
          </p>
        </div>

        <button
          onClick={() => { if (reason) setStep("describe"); }}
          disabled={!reason}
          className={cn(
            "w-full rounded-2xl py-4 font-bold text-sm transition-all",
            reason
              ? "bg-destructive text-destructive-foreground"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          Continue
        </button>
      </div>
    );
  }

  /* step === "describe" */
  const minLen = 40;
  const ok = description.trim().length >= minLen;

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={() => setStep("reason")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft size={14} /> Back
      </button>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="px-2.5 py-1 bg-destructive/10 rounded-full">
            <p className="text-[10px] font-bold text-destructive uppercase tracking-wide">
              {REASON_LABELS[reason!]}
            </p>
          </div>
        </div>
        <h2 className="text-base font-bold text-foreground mb-1">Describe what happened</h2>
        <p className="text-xs text-muted-foreground">Be specific. Include times, locations in the property, and what was promised vs delivered.</p>
      </div>

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="e.g. The cleaner left without completing the bathroom and kitchen. The oven was not touched despite being listed in the service. I have messages confirming the scope of work."
        rows={6}
        className="w-full px-3.5 py-3 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-destructive/30 resize-none placeholder:text-muted-foreground"
      />
      <div className="flex justify-between">
        {!ok ? (
          <p className="text-[10px] text-muted-foreground">{minLen - description.trim().length} more characters needed</p>
        ) : (
          <p className="text-[10px] text-green-600 font-medium flex items-center gap-1">
            <CheckCircle2 size={10} /> Ready to submit
          </p>
        )}
        <p className="text-[10px] text-muted-foreground">{description.length} chars</p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5">
        <p className="text-[10px] text-amber-800 leading-relaxed">
          <span className="font-semibold">Important:</span> Submitting a dispute is a formal action.
          The other party will be notified and asked to provide their account of events.
          Both sides will see the outcome, and it will be reflected in trust scores.
        </p>
      </div>

      <button
        onClick={() => {
          if (ok && reason) {
            mutation.mutate({ bookingId, reason, description });
          }
        }}
        disabled={!ok || mutation.isPending}
        className={cn(
          "w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-sm",
          ok ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        {mutation.isPending ? (
          <><Loader2 size={16} className="animate-spin" /> Raising dispute…</>
        ) : (
          <><ShieldAlert size={16} /> Raise dispute</>
        )}
      </button>
    </div>
  );
}

/* ── PendingView ────────────────────────────────── */
function PendingView({
  dispute,
  onEvidenceSubmit,
}: {
  dispute: DisputeData;
  onEvidenceSubmit: (d: DisputeData) => void;
}) {
  const { toast } = useToast();
  const [evidenceText, setEvidenceText] = useState("");
  const [showEvidence, setShowEvidence] = useState(false);
  const isMine = dispute.raisedBy === "user-demo-1";
  const myEvidenceSubmitted = isMine ? !!dispute.raisedByEvidence : !!dispute.againstUserEvidence;

  const cfg = STATUS_CONFIG[dispute.status];
  const StatusIcon = cfg.icon;

  const evidenceMutation = useMutation({
    mutationFn: submitEvidence,
    onSuccess: () => {
      toast({ title: "Evidence submitted", description: "Ocha's Trust Team will review all accounts." });
      onEvidenceSubmit({ ...dispute, raisedByEvidence: evidenceText, status: "evidence_submitted" });
    },
    onError: () => {
      toast({ title: "Could not submit evidence", variant: "destructive" });
    },
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Status banner */}
      <div className={cn("flex items-center gap-3 rounded-2xl border p-4", cfg.bg)}>
        <StatusIcon size={20} className={cfg.color} />
        <div>
          <p className={cn("text-sm font-bold", cfg.color)}>{cfg.label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ocha's Trust Team reviews within 24 hours
          </p>
        </div>
      </div>

      {/* Dispute summary */}
      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Dispute #{dispute.id.slice(-6)}</p>
          <p className="text-[10px] text-muted-foreground">
            {new Date(dispute.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold mb-0.5">Reason</p>
          <p className="text-sm font-semibold text-foreground">{REASON_LABELS[dispute.reason]}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold mb-0.5">Description</p>
          <p className="text-sm text-foreground leading-relaxed">{dispute.description}</p>
        </div>
      </div>

      {/* Both parties evidence status */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Evidence status</p>
        {[
          {
            name: dispute.raisedByName,
            avatar: dispute.raisedByAvatar,
            role: "Raised by",
            submitted: !!dispute.raisedByEvidence,
          },
          {
            name: dispute.againstUserName,
            avatar: dispute.againstUserAvatar,
            role: "Responding party",
            submitted: !!dispute.againstUserEvidence,
          },
        ].map((party) => (
          <div key={party.role} className="flex items-center gap-3 py-2 first:pt-0 last:pb-0 border-b border-border last:border-0">
            <div className="w-8 h-8 rounded-full bg-muted overflow-hidden shrink-0">
              {party.avatar ? (
                <img src={party.avatar} alt={party.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-muted-foreground">
                  {party.name[0]}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{party.name}</p>
              <p className="text-[10px] text-muted-foreground">{party.role}</p>
            </div>
            {party.submitted ? (
              <div className="flex items-center gap-1 bg-green-50 text-green-700 px-2 py-1 rounded-full">
                <CheckCircle2 size={10} />
                <span className="text-[10px] font-bold">Submitted</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-muted text-muted-foreground px-2 py-1 rounded-full">
                <Clock size={10} />
                <span className="text-[10px] font-bold">Pending</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Submit your evidence */}
      {!myEvidenceSubmitted && !showEvidence && (
        <button
          onClick={() => setShowEvidence(true)}
          className="w-full flex items-center justify-center gap-2 border border-primary/30 text-primary rounded-2xl py-3.5 font-semibold text-sm hover:bg-primary/5 transition-colors"
        >
          <MessageSquare size={15} />
          Add your evidence
        </button>
      )}

      {!myEvidenceSubmitted && showEvidence && (
        <div className="flex flex-col gap-3">
          <div>
            <p className="text-sm font-bold text-foreground mb-1">Your account of events</p>
            <p className="text-xs text-muted-foreground">Provide specific details. The Trust Team will compare both accounts.</p>
          </div>
          <textarea
            value={evidenceText}
            onChange={(e) => setEvidenceText(e.target.value)}
            placeholder="Describe what happened from your perspective…"
            rows={5}
            className="w-full px-3.5 py-3 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setShowEvidence(false)}
              className="flex-1 border border-border rounded-2xl py-3 text-sm font-medium text-muted-foreground"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (evidenceText.trim().length >= 20) {
                  evidenceMutation.mutate({ disputeId: dispute.id, evidence: evidenceText });
                }
              }}
              disabled={evidenceText.trim().length < 20 || evidenceMutation.isPending}
              className="flex-1 bg-primary text-primary-foreground rounded-2xl py-3 text-sm font-bold disabled:opacity-50"
            >
              {evidenceMutation.isPending ? "Submitting…" : "Submit"}
            </button>
          </div>
        </div>
      )}

      {myEvidenceSubmitted && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-3.5">
          <p className="text-xs text-green-800 font-semibold flex items-center gap-1.5">
            <CheckCircle2 size={13} /> Your evidence has been received
          </p>
          <p className="text-[10px] text-green-700 mt-1">
            The Trust Team will notify you of the outcome within 24 hours.
          </p>
        </div>
      )}

      {/* Trust note */}
      <div className="bg-muted/50 rounded-2xl p-3.5">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Review reveal paused.</span> Double-blind
          reviews for this booking will not be revealed until the dispute is resolved. This protects
          both parties from retaliatory reviews.
        </p>
      </div>
    </div>
  );
}

/* ── ResolvedView ───────────────────────────────── */
function ResolvedView({ dispute }: { dispute: DisputeData }) {
  const isDismissed = dispute.status === "dismissed";

  return (
    <div className="flex flex-col gap-4">
      <div className={cn(
        "flex flex-col items-center text-center py-6 rounded-2xl border",
        isDismissed ? "bg-muted border-border" : "bg-green-50 border-green-200"
      )}>
        {isDismissed
          ? <XCircle size={36} className="text-muted-foreground mb-2" />
          : <CheckCircle2 size={36} className="text-green-600 mb-2" />
        }
        <p className={cn("text-base font-bold", isDismissed ? "text-muted-foreground" : "text-green-700")}>
          Dispute {isDismissed ? "dismissed" : "resolved"}
        </p>
        <p className="text-xs text-muted-foreground mt-1 max-w-xs">
          {isDismissed
            ? "This dispute was reviewed and dismissed. No changes have been made."
            : "Ocha's Trust Team has reviewed all evidence and reached a decision."
          }
        </p>
      </div>

      {dispute.resolution && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2">Resolution</p>
          <p className="text-sm text-foreground leading-relaxed">{dispute.resolution}</p>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Trust impact</p>
        <div className="flex items-center gap-3">
          <Star size={14} className="text-amber-500" />
          <p className="text-xs text-foreground">
            Review reveal has been {isDismissed ? "re-enabled. Both reviews will go live shortly." : "processed per the resolution."}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ──────────────────────────────────── */
export default function DisputePage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [, setLocation] = useLocation();
  const [localDispute, setLocalDispute] = useState<DisputeData | null>(null);

  const {
    data: fetchedDispute,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["dispute", bookingId],
    queryFn: () => fetchDispute(bookingId!),
    retry: false,
    enabled: !!bookingId && !localDispute,
  });

  const dispute = localDispute || fetchedDispute;
  const hasDispute = !!dispute;
  const isResolved = dispute?.status === "resolved" || dispute?.status === "dismissed";

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-14 pb-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <button
            onClick={() => setLocation(`/bookings/${bookingId}`)}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-xs text-muted-foreground">Booking dispute</p>
            <h1 className="text-base font-bold text-foreground">
              {isResolved ? "Dispute closed" : hasDispute ? "Dispute in progress" : "Raise a dispute"}
            </h1>
          </div>
          <ShieldAlert size={20} className="ml-auto text-destructive/60" />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto w-full px-4 pt-5 pb-32">
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && (
          <>
            {/* How disputes work — shown before raising */}
            {!hasDispute && !error && (
              <div className="mb-5 bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-800 mb-1">Before you raise a dispute</p>
                    <p className="text-[11px] text-amber-700 leading-relaxed">
                      We encourage you to message the cleaner directly first. Many issues are resolved
                      quickly through direct communication. If that hasn't worked, continue below.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Raise form */}
            {!hasDispute && (
              <RaiseForm
                bookingId={bookingId!}
                onSuccess={(d) => setLocalDispute(d)}
              />
            )}

            {/* Pending / active dispute */}
            {hasDispute && !isResolved && (
              <PendingView
                dispute={dispute}
                onEvidenceSubmit={(d) => setLocalDispute(d)}
              />
            )}

            {/* Resolved */}
            {hasDispute && isResolved && (
              <ResolvedView dispute={dispute} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
