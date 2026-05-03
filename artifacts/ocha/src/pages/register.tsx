import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Sparkles, Building2 } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const schema = z.object({
  fullName: z.string().min(2, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
  role: z.enum(["customer", "cleaner", "property_manager"]),
});

type FormData = z.infer<typeof schema>;

const ROLES = [
  { id: "customer", label: "Customer", desc: "Book cleaning services", icon: User },
  { id: "cleaner", label: "Cleaner", desc: "Offer cleaning services", icon: Sparkles },
  { id: "property_manager", label: "Property Manager", desc: "Manage multiple properties", icon: Building2 },
];

export default function Register() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "customer" },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
    setLocation("/workspace");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-primary px-6 pt-16 pb-12 text-center">
        <h1 className="text-2xl font-bold text-primary-foreground mb-1">Join Ocha</h1>
        <p className="text-primary-foreground/60 text-sm">Your trusted cleaning ecosystem</p>
      </div>

      <div className="bg-card rounded-t-3xl -mt-6 px-6 pt-8 pb-10 shadow-xl flex-1">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
            {/* Role selection */}
            <div>
              <p className="text-xs font-bold text-foreground uppercase tracking-wide mb-2">I am a...</p>
              <div className="flex flex-col gap-2">
                <FormField control={form.control} name="role" render={({ field }) => (
                  <>
                    {ROLES.map((role) => {
                      const Icon = role.icon;
                      const isSelected = field.value === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          data-testid={`button-role-${role.id}`}
                          onClick={() => field.onChange(role.id)}
                          className={`flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all ${
                            isSelected ? "border-primary bg-primary/5" : "border-border bg-background"
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${isSelected ? "bg-primary/10" : "bg-muted"}`}>
                            <Icon size={16} className={isSelected ? "text-primary" : "text-muted-foreground"} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-foreground">{role.label}</p>
                            <p className="text-[10px] text-muted-foreground">{role.desc}</p>
                          </div>
                          {isSelected && (
                            <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-primary-foreground" />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </>
                )} />
              </div>
            </div>

            <FormField control={form.control} name="fullName" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">Full name</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-full-name" placeholder="Sarah Mitchell" className="rounded-xl h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">Email address</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-email" type="email" placeholder="you@example.com" className="rounded-xl h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs text-muted-foreground">Password</FormLabel>
                <FormControl>
                  <Input {...field} data-testid="input-password" type="password" placeholder="At least 8 characters" className="rounded-xl h-11" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <button
              type="submit"
              data-testid="button-register"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground rounded-2xl py-4 font-bold text-sm mt-2 disabled:opacity-60"
            >
              {isLoading ? "Creating account..." : "Create Account"}
            </button>
          </form>
        </Form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Already have an account?{" "}
          <button
            data-testid="link-login"
            onClick={() => setLocation("/login")}
            className="text-primary font-semibold"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
