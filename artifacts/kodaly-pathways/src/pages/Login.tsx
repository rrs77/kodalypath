import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useLogin, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Music, BookOpen, ShieldCheck, PlayCircle } from "lucide-react";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [remember, setRemember] = useState(true);
  const login = useLogin();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }
    login.mutate(
      { data: { email: email.trim(), name: name.trim() } },
      {
        onSuccess: async () => {
          await qc.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          navigate("/dashboard");
        },
        onError: (err) => toast.error(err instanceof Error ? err.message : "Login failed"),
      },
    );
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      {/* Left brand panel */}
      <div className="relative hidden md:flex flex-col justify-center items-center overflow-hidden text-white p-12"
           style={{
             background:
               "radial-gradient(circle at 20% 20%, hsl(174 50% 30%) 0%, transparent 50%), radial-gradient(circle at 80% 80%, hsl(160 45% 22%) 0%, transparent 55%), linear-gradient(135deg, hsl(180 35% 18%) 0%, hsl(170 40% 14%) 100%)",
           }}>
        <div className="absolute inset-0 opacity-[0.08]" style={{
          backgroundImage: "radial-gradient(white 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }} />
        <div className="relative text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            <span className="text-white">Kodály</span>
            <span className="bg-gradient-to-r from-emerald-200 to-teal-100 bg-clip-text text-transparent italic"> Pathways</span>
          </h1>
          <p className="mt-4 text-base text-white/75">Plan, sequence, teach — the Kodály way.</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative flex flex-col px-6 py-10 md:px-16 md:py-14">
        <div className="absolute top-6 right-6 text-sm">
          <Link href="/walkthrough" className="inline-flex items-center gap-1.5 text-primary hover:underline" data-testid="link-walkthrough">
            <BookOpen className="w-4 h-4" />
            Feature walkthrough
          </Link>
        </div>

        <div className="m-auto w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-9 h-9 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
              <Music className="w-5 h-5" />
            </div>
            <span className="text-lg font-semibold">
              Kodály<span className="italic text-primary"> Pathways</span>
            </span>
          </div>

          <h2 className="text-3xl font-bold tracking-tight">Welcome back</h2>
          <p className="text-muted-foreground mt-1.5">Please sign in to your account.</p>

          <form onSubmit={submit} className="space-y-4 mt-8">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.uk" data-testid="input-email" />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="name">Your name</Label>
                <span className="text-xs text-muted-foreground">Optional</span>
              </div>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ms Smith" data-testid="input-name" />
            </div>

            <label className="flex items-center gap-2 text-sm select-none cursor-pointer">
              <Checkbox checked={remember} onCheckedChange={(v) => setRemember(!!v)} data-testid="checkbox-remember" />
              Remember me
            </label>

            <Button
              type="submit"
              className="w-full h-11 text-white border-0 hover:opacity-95 transition-opacity"
              style={{ background: "linear-gradient(90deg, hsl(174 55% 35%), hsl(160 50% 40%))" }}
              disabled={login.isPending}
              data-testid="button-login"
            >
              {login.isPending ? "Signing in…" : "Sign in"}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={() => {
                setEmail("demo@school.uk");
                setName("Demo Teacher");
              }}
              data-testid="button-preview"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              Try a demo
            </Button>

            <p className="text-sm text-center text-muted-foreground pt-1">
              No password needed — your account is created on first sign in.
            </p>
            <p className="text-xs text-center text-muted-foreground inline-flex items-center gap-1.5 justify-center w-full">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              Secure cookie session, GDPR-friendly
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
