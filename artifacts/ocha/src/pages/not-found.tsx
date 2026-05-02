import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <span className="text-3xl font-bold text-primary">?</span>
      </div>
      <h1 className="text-xl font-bold text-foreground mb-1">Page not found</h1>
      <p className="text-sm text-muted-foreground mb-8">This page doesn't exist.</p>
      <button
        onClick={() => setLocation("/")}
        className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-semibold text-sm"
      >
        Go Home
      </button>
    </div>
  );
}
