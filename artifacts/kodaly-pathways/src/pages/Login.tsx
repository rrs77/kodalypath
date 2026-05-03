import { useEffect, useState } from "react";
import { useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/react";
import { getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { API_BASE } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Music, BookOpen, ShieldCheck, PlayCircle, LogIn, UserPlus } from "lucide-react";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function LoginPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { isSignedIn, isLoaded } = useAuth();
  const [demoLoading, setDemoLoading] = useState(false);

  // If a Clerk session is already present, just go to the app.
  useEffect(() => {
    if (isLoaded && isSignedIn) navigate("/dashboard");
  }, [isLoaded, isSignedIn, navigate]);

  async function tryDemo() {
    setDemoLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/demo`, { method: "POST", credentials: "include" });
      if (!res.ok) throw new Error(`Demo failed (${res.status})`);
      await qc.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
      navigate("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Demo failed");
    } finally {
      setDemoLoading(false);
    }
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
        <div className="relative text-center max-w-md">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            <span className="text-white">Kodály</span>
            <span className="bg-gradient-to-r from-emerald-200 to-teal-100 bg-clip-text text-transparent italic"> Pathways</span>
          </h1>
          <p className="mt-4 text-base text-white/75">Plan, sequence, teach — the Kodály way.</p>
          <ul className="mt-10 space-y-3 text-left text-white/85 text-sm">
            <li className="flex gap-3"><span className="text-emerald-300">✓</span> Year-long pathways aligned to the National Curriculum</li>
            <li className="flex gap-3"><span className="text-emerald-300">✓</span> 80+ ready-to-teach Kodály activities</li>
            <li className="flex gap-3"><span className="text-emerald-300">✓</span> Full IWB lesson player with rhythm & solfa tools</li>
          </ul>
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

          <h2 className="text-3xl font-bold tracking-tight">Welcome</h2>
          <p className="text-muted-foreground mt-1.5">Sign in or create your account to get started.</p>

          <div className="space-y-3 mt-8">
            <Button
              asChild
              className="w-full h-11 text-white border-0 hover:opacity-95 transition-opacity"
              style={{ background: "linear-gradient(90deg, hsl(174 55% 35%), hsl(160 50% 40%))" }}
              data-testid="button-signin"
            >
              <a href={`${basePath}/sign-in`}>
                <LogIn className="w-4 h-4 mr-2" />
                Sign in
              </a>
            </Button>

            <Button
              asChild
              variant="outline"
              className="w-full h-11"
              data-testid="button-signup"
            >
              <a href={`${basePath}/sign-up`}>
                <UserPlus className="w-4 h-4 mr-2" />
                Create an account
              </a>
            </Button>

            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full h-11"
              onClick={tryDemo}
              disabled={demoLoading}
              data-testid="button-preview"
            >
              <PlayCircle className="w-4 h-4 mr-2" />
              {demoLoading ? "Loading preview…" : "Preview full app"}
            </Button>

            <p className="text-xs text-muted-foreground text-center pt-3">
              Sign up with email & password or with Google. We use Clerk for secure authentication.
            </p>
            <p className="text-xs text-center text-muted-foreground inline-flex items-center gap-1.5 justify-center w-full">
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              GDPR-friendly · PII encrypted at rest
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
