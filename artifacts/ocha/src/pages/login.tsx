import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormData = z.infer<typeof schema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
    setLocation("/workspace");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Brand header */}
      <div className="bg-primary flex-1 flex flex-col items-center justify-center px-6 pb-16 pt-20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary-foreground/15 flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 rounded-full bg-primary-foreground/80" />
          </div>
          <h1 className="text-3xl font-bold text-primary-foreground mb-1">Ocha</h1>
          <p className="text-primary-foreground/60 text-sm">Trusted cleaning, delivered with care</p>
        </div>
      </div>

      {/* Form card */}
      <div className="bg-card rounded-t-3xl -mt-8 px-6 pt-8 pb-10 shadow-xl">
        <h2 className="text-xl font-bold text-foreground mb-6">Welcome back</h2>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground font-medium">Email address</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    data-testid="input-email"
                    type="email"
                    placeholder="you@example.com"
                    className="rounded-xl h-12"
                    autoComplete="email"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground font-medium">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      {...field}
                      data-testid="input-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="rounded-xl h-12 pr-12"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      data-testid="button-toggle-password"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <button
              type="button"
              data-testid="link-forgot-password"
              className="text-xs text-primary font-medium text-right -mt-2"
            >
              Forgot password?
            </button>

            <button
              type="submit"
              data-testid="button-login"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-sm mt-2 disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>

            <div className="relative flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <button
              type="button"
              data-testid="button-google-login"
              className="w-full flex items-center justify-center gap-3 border border-border rounded-2xl py-3.5 font-medium text-sm text-foreground hover:bg-muted/50 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 6.294C4.672 4.167 6.656 3.58 9 3.58z"/>
              </svg>
              Continue with Google
            </button>
          </form>
        </Form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Don't have an account?{" "}
          <button
            data-testid="link-register"
            onClick={() => setLocation("/register")}
            className="text-primary font-semibold"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
