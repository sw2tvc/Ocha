import { createContext, useContext, useState, ReactNode } from "react";

export type Workspace = "customer" | "cleaner" | "admin";

interface WorkspaceContextType {
  workspace: Workspace;
  availableWorkspaces: Workspace[];
  setWorkspace: (w: Workspace) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

const STORAGE_KEY = "ocha_workspace";

// Demo: this user has access to all three workspaces
const DEMO_AVAILABLE: Workspace[] = ["customer", "cleaner", "admin"];

function readStored(): Workspace {
  const v = localStorage.getItem(STORAGE_KEY);
  if (v === "customer" || v === "cleaner" || v === "admin") return v;
  return "customer";
}

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspaceState] = useState<Workspace>(readStored);

  function setWorkspace(w: Workspace) {
    setWorkspaceState(w);
    localStorage.setItem(STORAGE_KEY, w);
  }

  return (
    <WorkspaceContext.Provider value={{ workspace, availableWorkspaces: DEMO_AVAILABLE, setWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return ctx;
}

export const WORKSPACE_LABELS: Record<Workspace, string> = {
  customer: "Property Manager",
  cleaner: "Cleaner",
  admin: "Admin",
};

export const WORKSPACE_HOME: Record<Workspace, string> = {
  customer: "/",
  cleaner: "/cleaner-dashboard",
  admin: "/admin",
};
