import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useLogin, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Music } from "lucide-react";

export default function LoginPage() {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
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
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-md bg-primary text-primary-foreground flex items-center justify-center mb-2">
            <Music className="w-6 h-6" />
          </div>
          <CardTitle>Kodály Pathways</CardTitle>
          <CardDescription>Sign in to plan your music lessons</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.uk" data-testid="input-email" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Your name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ms Smith" data-testid="input-name" />
            </div>
            <Button type="submit" className="w-full" disabled={login.isPending} data-testid="button-login">
              {login.isPending ? "Signing in…" : "Sign in"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              No password needed. Your account is created automatically the first time you sign in.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
