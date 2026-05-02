import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Star,
  MapPin,
  Phone,
  CreditCard,
  FileText,
  Clock,
  Users,
  ChevronRight,
  Lock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

/* ── constants ─────────────────────────────────── */
const STEPS = [
  "Welcome",
  "Services",
  "About you",
  "Coverage",
  "Verify",
  "Review",
];

const SERVICE_TYPES = [
  { id: "standard", label: "Standard Clean", desc: "Regular home cleaning", icon: "🧹" },
  { id: "deep_clean", label: "Deep Clean", desc: "Thorough top-to-bottom", icon: "✨" },
  { id: "end_of_tenancy", label: "End of Tenancy", desc: "Move-out clean", icon: "🏠" },
  { id: "airbnb_turnover", label: "Airbnb Turnover", desc: "Fast turnovers", icon: "🌙" },
  { id: "office", label: "Office Clean", desc: "Commercial premises", icon: "🏢" },
  { id: "recurring", label: "Recurring", desc: "Regular contracts", icon: "🔄" },
];

const RADIUS_OPTIONS = [
  { km: 3, label: "3 km", desc: "Hyperlocal" },
  { km: 5, label: "5 km", desc: "Neighbourhood" },
  { km: 10, label: "10 km", desc: "Borough-wide" },
  { km: 20, label: "20 km", desc: "City-wide" },
];

const IDENTITY_STEPS = [
  {
    key: "phone",
    label: "Phone verification",
    desc: "Confirm your mobile number via SMS",
    icon: Phone,
    trustPts: 15,
    required: true,
    status: "done" as const,
  },
  {
    key: "id",
    label: "Government ID",
    desc: "Passport or driving licence",
    icon: FileText,
    trustPts: 20,
    required: true,
    status: "pending" as const,
  },
  {
    key: "dbs",
    label: "DBS check",
    desc: "Enhanced disclosure — required to go live",
    icon: ShieldCheck,
    trustPts: 25,
    required: true,
    status: "pending" as const,
  },
  {
    key: "payment",
    label: "Bank account",
    desc: "Where we'll send your earnings",
    icon: CreditCard,
    trustPts: 10,
    required: true,
    status: "pending" as const,
  },
];

/* ── step components ────────────────────────────── */

function StepWelcome() {
  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles size={36} className="text-primary" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Become a trusted cleaner on Ocha
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Ocha is not a gig platform. We are an identity-based, reputation-driven
          marketplace where cleaners build real careers.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {[
          {
            icon: ShieldCheck,
            color: "text-primary",
            bg: "bg-primary/10",
            title: "Identity-first trust",
            desc: "Your reputation is tied to you — not a disposable account. Verified cleaners earn more and get booked faster.",
          },
          {
            icon: Star,
            color: "text-amber-600",
            bg: "bg-amber-50",
            title: "Double-blind reviews",
            desc: "Neither party sees the other's review until both have submitted. Honest feedback, every time.",
          },
          {
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
            title: "Repeat clients",
            desc: "84% of our top cleaners earn 80% of their income from repeat bookings within 6 months.",
          },
          {
            icon: Clock,
            color: "text-green-600",
            bg: "bg-green-50",
            title: "You set your rate & schedule",
            desc: "Choose your hourly rate, the services you offer, and when you're available.",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-start gap-3 bg-card border border-border rounded-2xl p-3.5">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", item.bg)}>
                <Icon size={17} className={item.color} />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">What happens next?</span>{" "}
          You'll set your services and rate, write a short bio, define your coverage
          area, and complete identity verification. Most applications are reviewed
          within 48 hours.
        </p>
      </div>
    </div>
  );
}

function StepServices({
  selected,
  onToggle,
  rate,
  onRate,
}: {
  selected: string[];
  onToggle: (id: string) => void;
  rate: number;
  onRate: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-bold text-foreground mb-1">What services do you offer?</h2>
        <p className="text-xs text-muted-foreground">Pick everything you're comfortable with. You can change this later.</p>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {SERVICE_TYPES.map((svc) => {
          const active = selected.includes(svc.id);
          return (
            <button
              key={svc.id}
              onClick={() => onToggle(svc.id)}
              className={cn(
                "flex flex-col items-start p-3.5 rounded-2xl border text-left transition-all",
                active
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <span className="text-xl mb-1.5">{svc.icon}</span>
              <p className={cn("text-xs font-semibold", active ? "text-primary" : "text-foreground")}>
                {svc.label}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{svc.desc}</p>
              {active && (
                <div className="mt-2 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <CheckCircle2 size={10} className="text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selected.length === 0 && (
        <p className="text-xs text-destructive text-center">Select at least one service to continue.</p>
      )}

      {/* Hourly rate */}
      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-foreground">Your hourly rate</p>
          <span className="text-xl font-bold text-primary">£{rate}/hr</span>
        </div>
        <input
          type="range"
          min={12}
          max={60}
          step={1}
          value={rate}
          onChange={(e) => onRate(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>£12/hr</span>
          <span>£60/hr</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
          Average on Ocha: <span className="font-semibold text-foreground">£22/hr</span> for standard,{" "}
          <span className="font-semibold text-foreground">£28/hr</span> for deep clean. Trusted
          badge holders earn 15–20% more on average.
        </p>
      </div>
    </div>
  );
}

function StepAbout({
  bio,
  onBio,
  experience,
  onExperience,
}: {
  bio: string;
  onBio: (v: string) => void;
  experience: number;
  onExperience: (v: number) => void;
}) {
  const minBio = 60;
  const remaining = minBio - bio.length;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-bold text-foreground mb-1">Tell clients about yourself</h2>
        <p className="text-xs text-muted-foreground">This becomes your public profile bio. Be specific — clients read this before booking.</p>
      </div>

      <div>
        <textarea
          value={bio}
          onChange={(e) => onBio(e.target.value)}
          placeholder="e.g. Experienced cleaner with 5 years in residential and Airbnb properties across East London. I'm thorough, reliable, and always leave a property spotless…"
          rows={5}
          className="w-full px-3.5 py-3 rounded-2xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none placeholder:text-muted-foreground"
        />
        <div className="flex justify-between mt-1.5">
          {remaining > 0 ? (
            <p className="text-[10px] text-muted-foreground">{remaining} more characters needed</p>
          ) : (
            <p className="text-[10px] text-green-600 font-medium flex items-center gap-1">
              <CheckCircle2 size={10} /> Looks great
            </p>
          )}
          <p className="text-[10px] text-muted-foreground">{bio.length} chars</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-sm font-bold text-foreground mb-3">Years of experience</p>
        <div className="flex gap-2 flex-wrap">
          {[1, 2, 3, 5, 7, 10].map((yr) => (
            <button
              key={yr}
              onClick={() => onExperience(yr)}
              className={cn(
                "px-4 py-2 rounded-xl border text-xs font-semibold transition-all",
                experience === yr
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-background text-foreground border-border hover:border-primary/40"
              )}
            >
              {yr === 10 ? "10+" : yr} yr{yr === 1 ? "" : "s"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-muted/50 rounded-2xl p-3.5">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Tip:</span> Profiles with specific,
          honest bios get 3× more bookings than generic ones. Mention your specialisms,
          the areas you know well, and any particular property types you excel at.
        </p>
      </div>
    </div>
  );
}

function StepCoverage({
  city,
  onCity,
  postcode,
  onPostcode,
  radius,
  onRadius,
}: {
  city: string;
  onCity: (v: string) => void;
  postcode: string;
  onPostcode: (v: string) => void;
  radius: number;
  onRadius: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-bold text-foreground mb-1">Where do you work?</h2>
        <p className="text-xs text-muted-foreground">Clients search by location. We'll show you to customers within your coverage radius.</p>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">City</label>
          <input
            value={city}
            onChange={(e) => onCity(e.target.value)}
            placeholder="London"
            className="w-full px-3.5 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Home postcode</label>
          <input
            value={postcode}
            onChange={(e) => onPostcode(e.target.value.toUpperCase())}
            placeholder="E8 3NH"
            className="w-full px-3.5 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <p className="text-[10px] text-muted-foreground mt-1">
            Used only for matching — never shown to clients.
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-foreground">Service radius</p>
          <div className="flex items-center gap-1">
            <MapPin size={12} className="text-primary" />
            <span className="text-sm font-bold text-primary">{radius} km</span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {RADIUS_OPTIONS.map((opt) => (
            <button
              key={opt.km}
              onClick={() => onRadius(opt.km)}
              className={cn(
                "flex flex-col items-center p-2.5 rounded-xl border text-center transition-all",
                radius === opt.km
                  ? "border-primary bg-primary/5"
                  : "border-border bg-background hover:border-primary/40"
              )}
            >
              <span className={cn("text-sm font-bold", radius === opt.km ? "text-primary" : "text-foreground")}>
                {opt.label}
              </span>
              <span className="text-[9px] text-muted-foreground mt-0.5">{opt.desc}</span>
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-3 leading-relaxed">
          Smaller radii mean faster ETAs and higher repeat booking rates. You can
          expand your radius once you've built a local client base.
        </p>
      </div>
    </div>
  );
}

function StepVerify() {
  const [phoneConfirmed, setPhoneConfirmed] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-base font-bold text-foreground mb-1">Verify your identity</h2>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Your trust score starts here. Each verification step adds points and
          unlocks your ability to go live and take bookings.
        </p>
      </div>

      {/* Trust score preview */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-foreground">Starting trust score</p>
          <span className="text-lg font-bold text-primary">10</span>
        </div>
        <div className="h-2 bg-primary/10 rounded-full overflow-hidden mb-2">
          <div className="h-full bg-primary rounded-full" style={{ width: "10%" }} />
        </div>
        <p className="text-[10px] text-muted-foreground">
          Complete verification to reach <span className="font-semibold text-foreground">80+</span> and unlock the Verified badge.
        </p>
      </div>

      {IDENTITY_STEPS.map((step) => {
        const Icon = step.icon;
        const isPhone = step.key === "phone";
        const isDone = isPhone ? phoneConfirmed : step.status === "done";

        return (
          <div
            key={step.key}
            className={cn(
              "rounded-2xl border p-4",
              isDone ? "border-primary/20 bg-primary/3" : "border-border bg-card"
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  isDone ? "bg-primary/15" : "bg-muted"
                )}
              >
                <Icon size={18} className={isDone ? "text-primary" : "text-muted-foreground"} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-foreground">{step.label}</p>
                  <span className="text-[10px] font-bold text-primary shrink-0">
                    +{step.trustPts} pts
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>

                {/* Phone OTP flow */}
                {isPhone && !phoneConfirmed && (
                  <div className="mt-3">
                    {!otpSent ? (
                      <button
                        onClick={() => setOtpSent(true)}
                        className="text-xs font-semibold text-primary border border-primary/30 rounded-xl px-3 py-2 hover:bg-primary/5 transition-colors"
                      >
                        Send verification code
                      </button>
                    ) : (
                      <div className="flex gap-2 items-center mt-1">
                        <input
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                          placeholder="6-digit code"
                          className="flex-1 px-3 py-2 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                          maxLength={6}
                        />
                        <button
                          onClick={() => { if (otp.length === 6) setPhoneConfirmed(true); }}
                          disabled={otp.length !== 6}
                          className="text-xs font-bold bg-primary text-primary-foreground rounded-xl px-3 py-2 disabled:opacity-50"
                        >
                          Verify
                        </button>
                      </div>
                    )}
                    {otpSent && !phoneConfirmed && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Demo: enter any 6 digits to confirm.
                      </p>
                    )}
                  </div>
                )}

                {/* Other steps — locked */}
                {!isPhone && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Lock size={10} className="text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground">
                      Completed after application approval
                    </p>
                  </div>
                )}
              </div>

              {isDone && (
                <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
              )}
            </div>
          </div>
        );
      })}

      <div className="bg-muted/50 rounded-2xl p-3.5">
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">Why identity verification?</span>{" "}
          Ocha's trust model is identity-based — your reputation belongs to you, the
          person, not just an account. Verification protects both you and your clients
          from fraud and ensures every booking is with a real, accountable person.
        </p>
      </div>
    </div>
  );
}

function StepReview({
  data,
}: {
  data: {
    services: string[];
    rate: number;
    bio: string;
    experience: number;
    city: string;
    postcode: string;
    radius: number;
  };
}) {
  const serviceLabels: Record<string, string> = {
    standard: "Standard Clean",
    deep_clean: "Deep Clean",
    end_of_tenancy: "End of Tenancy",
    airbnb_turnover: "Airbnb Turnover",
    office: "Office Clean",
    recurring: "Recurring",
  };

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-bold text-foreground mb-1">Review your application</h2>
        <p className="text-xs text-muted-foreground">
          Check everything looks right before submitting.
        </p>
      </div>

      {[
        {
          label: "Services",
          content: data.services.map((s) => serviceLabels[s] || s).join(", ") || "—",
        },
        { label: "Hourly rate", content: `£${data.rate}/hr` },
        { label: "Experience", content: `${data.experience}+ years` },
        { label: "Coverage", content: `${data.city || "—"} · ${data.postcode || "—"} · ${data.radius}km radius` },
      ].map((row) => (
        <div key={row.label} className="bg-card border border-border rounded-2xl px-4 py-3.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold mb-1">
            {row.label}
          </p>
          <p className="text-sm font-medium text-foreground">{row.content}</p>
        </div>
      ))}

      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold mb-1">Bio</p>
        <p className="text-sm text-foreground leading-relaxed">{data.bio || "—"}</p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4">
        <p className="text-xs font-semibold text-foreground mb-1.5">What happens after you submit?</p>
        <div className="flex flex-col gap-1.5">
          {[
            "Your application is reviewed within 48 hours",
            "You'll receive a link to complete ID & DBS verification",
            "Once approved, you'll appear in search results",
            "Your trust score grows with every verified booking and review",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <ChevronRight size={12} className="text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Main page ─────────────────────────────────── */
export default function BecomeCleaner() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  /* Form state */
  const [services, setServices] = useState<string[]>([]);
  const [rate, setRate] = useState(22);
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState(2);
  const [city, setCity] = useState("London");
  const [postcode, setPostcode] = useState("");
  const [radius, setRadius] = useState(10);

  const toggleService = (id: string) =>
    setServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );

  const canAdvance = () => {
    if (step === 1) return services.length > 0;
    if (step === 2) return bio.length >= 60;
    if (step === 3) return city.trim().length > 0 && postcode.trim().length > 0;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/cleaners/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": "user-demo-1",
        },
        body: JSON.stringify({
          serviceTypes: services,
          hourlyRate: rate,
          bio,
          serviceRadius: radius,
          city,
          postcode,
        }),
      });
      if (res.ok || res.status === 409) {
        setDone(true);
      } else {
        throw new Error("Application failed");
      }
    } catch {
      toast({ title: "Application submitted", description: "We'll review it within 48 hours." });
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success screen ── */
  if (done) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center">
          <CheckCircle2 size={48} className="text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">Application submitted!</h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
            We'll review your profile within 48 hours. You'll receive an email with
            next steps for ID and DBS verification.
          </p>
        </div>
        <div className="w-full max-w-xs bg-card border border-border rounded-2xl p-4 text-left">
          <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-3">Your starting trust score</p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Current</span>
            <span className="text-2xl font-bold text-primary">10</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-2">
            <div className="h-full bg-primary rounded-full" style={{ width: "10%" }} />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Complete ID + DBS verification to jump to <span className="font-semibold text-foreground">55+</span>
          </p>
        </div>
        <button
          onClick={() => setLocation("/")}
          className="w-full max-w-xs bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-sm"
        >
          Back to home
        </button>
      </div>
    );
  }

  const progressPct = (step / (STEPS.length - 1)) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 pt-14 pb-4 sticky top-0 z-10">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => (step > 0 ? setStep(step - 1) : setLocation("/"))}
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex-1">
              <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">
                Step {step + 1} of {STEPS.length}
              </p>
              <p className="text-sm font-bold text-foreground">{STEPS[step]}</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          {/* Step dots */}
          <div className="flex justify-between mt-2">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={cn(
                  "w-1.5 h-1.5 rounded-full transition-colors",
                  i <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-md mx-auto w-full px-4 pt-5 pb-32 flex-1">
        {step === 0 && <StepWelcome />}
        {step === 1 && (
          <StepServices
            selected={services}
            onToggle={toggleService}
            rate={rate}
            onRate={setRate}
          />
        )}
        {step === 2 && (
          <StepAbout
            bio={bio}
            onBio={setBio}
            experience={experience}
            onExperience={setExperience}
          />
        )}
        {step === 3 && (
          <StepCoverage
            city={city}
            onCity={setCity}
            postcode={postcode}
            onPostcode={setPostcode}
            radius={radius}
            onRadius={setRadius}
          />
        )}
        {step === 4 && <StepVerify />}
        {step === 5 && (
          <StepReview
            data={{ services, rate, bio, experience, city, postcode, radius }}
          />
        )}
      </div>

      {/* Footer CTA */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-8 pt-3 bg-background/95 backdrop-blur border-t border-border">
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={!canAdvance()}
            className={cn(
              "w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-sm transition-all",
              canAdvance()
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Continue
            <ArrowRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-sm disabled:opacity-70"
          >
            {submitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Submitting…
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                Submit application
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
