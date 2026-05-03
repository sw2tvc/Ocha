import { useLocation } from "wouter";
import { Building2, LayoutDashboard, Shield } from "lucide-react";
import { useWorkspace, Workspace, WORKSPACE_HOME } from "@/lib/workspace-context";
import { MOCK_USER } from "@/lib/mock-data";

const OPTIONS: { workspace: Workspace; icon: typeof Building2; title: string; description: string; accent: string }[] = [
  {
    workspace: "customer",
    icon: Building2,
    title: "Book cleaning / Manage properties",
    description: "Find cleaners, manage your properties and bookings",
    accent: "bg-primary/10 text-primary",
  },
  {
    workspace: "cleaner",
    icon: LayoutDashboard,
    title: "Work as cleaner",
    description: "Manage your jobs, availability and earnings",
    accent: "bg-amber-100 text-amber-700",
  },
  {
    workspace: "admin",
    icon: Shield,
    title: "Admin dashboard",
    description: "Platform overview, users, disputes and trust metrics",
    accent: "bg-violet-100 text-violet-700",
  },
];

export default function WorkspaceChooser() {
  const [, setLocation] = useLocation();
  const { setWorkspace, availableWorkspaces } = useWorkspace();

  function choose(w: Workspace) {
    setWorkspace(w);
    setLocation(WORKSPACE_HOME[w]);
  }

  const visibleOptions = OPTIONS.filter((o) => availableWorkspaces.includes(o.workspace));

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Ocha</p>
          <h1 className="text-2xl font-bold text-foreground">Continue as</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome back, {MOCK_USER.fullName.split(" ")[0]}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {visibleOptions.map(({ workspace, icon: Icon, title, description, accent }) => (
            <button
              key={workspace}
              data-testid={`workspace-option-${workspace}`}
              onClick={() => choose(workspace)}
              className="w-full flex items-center gap-4 bg-card border border-border rounded-2xl px-5 py-4 text-left hover:border-primary/40 hover:shadow-sm transition-all"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${accent}`}>
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
