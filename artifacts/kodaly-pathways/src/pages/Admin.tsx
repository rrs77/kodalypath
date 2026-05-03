import { useEffect, useState } from "react";
import { Link, Redirect, Route, Switch, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Settings as SettingsIcon,
  FileText,
  Image as ImageIcon,
  Navigation as NavigationIcon,
  Users,
  ArrowLeft,
} from "lucide-react";
import {
  useGetCurrentUser,
  useGetSiteSettings,
  useUpdateSiteSettings,
  getGetSiteSettingsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { PagesPanel } from "@/components/admin/PagesPanel";
import { MicrocopyPanel } from "@/components/admin/MicrocopyPanel";
import { NavigationPanel } from "@/components/admin/NavigationPanel";
import { MediaPanel } from "@/components/admin/MediaPanel";
import { Type as TypeIcon } from "lucide-react";

const ADMIN_NAV = [
  { href: "/admin", label: "Branding", icon: SettingsIcon, exact: true },
  { href: "/admin/pages", label: "Pages", icon: FileText },
  { href: "/admin/navigation", label: "Navigation", icon: NavigationIcon },
  { href: "/admin/microcopy", label: "Microcopy", icon: TypeIcon },
  { href: "/admin/media", label: "Media", icon: ImageIcon },
  { href: "/admin/users", label: "Users", icon: Users, soon: true },
];

export default function AdminPage() {
  const { data, isLoading } = useGetCurrentUser();
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  }
  if (!data?.user) return <Redirect to="/login" />;
  if (data.user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Admins only</CardTitle>
            <CardDescription>You're signed in but don't have access to the admin area.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to dashboard
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return <AdminShell />;
}

function AdminShell() {
  const [loc] = useLocation();
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="hidden md:flex w-60 shrink-0 bg-sidebar text-sidebar-foreground flex-col border-r border-sidebar-border">
        <div className="px-5 py-5 border-b border-sidebar-border">
          <div className="text-xs uppercase tracking-wide opacity-60">CMS</div>
          <div className="font-semibold leading-tight mt-1">Site admin</div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto" aria-label="Admin">
          {ADMIN_NAV.map((item) => {
            const active = item.exact ? loc === item.href : loc === item.href || loc.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.soon ? loc : item.href}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover-elevate",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  active && "kp-nav-active font-medium",
                  item.soon && "opacity-60 cursor-not-allowed",
                )}
                aria-disabled={item.soon}
                onClick={(e) => item.soon && e.preventDefault()}
                data-testid={`admin-nav-${item.label.toLowerCase()}`}
              >
                <Icon className={cn("w-4 h-4", active ? "text-sidebar-primary" : "opacity-80")} />
                <span className="flex-1">{item.label}</span>
                {item.soon && <span className="text-[10px] uppercase tracking-wide opacity-60">soon</span>}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border">
          <Button asChild variant="ghost" size="sm" className="w-full justify-start text-sidebar-foreground/80">
            <Link href="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to app
            </Link>
          </Button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-auto kp-scroll">
        <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-10">
          <Switch>
            <Route path="/admin" component={BrandingPanel} />
            <Route path="/admin/pages" component={PagesPanel} />
            <Route path="/admin/navigation" component={NavigationPanel} />
            <Route path="/admin/microcopy" component={MicrocopyPanel} />
            <Route path="/admin/media" component={MediaPanel} />
            <Route path="/admin/users" component={ComingSoon} />
            <Route component={ComingSoon} />
          </Switch>
        </div>
      </main>
    </div>
  );
}

function ComingSoon() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Coming soon</CardTitle>
        <CardDescription>This admin area lands in Phase 2 / 3 of the CMS rollout.</CardDescription>
      </CardHeader>
    </Card>
  );
}

function BrandingPanel() {
  const { data } = useGetSiteSettings();
  const qc = useQueryClient();
  const update = useUpdateSiteSettings({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetSiteSettingsQueryKey() });
        toast.success("Branding saved");
      },
      onError: (err: unknown) => {
        const msg = err instanceof Error ? err.message : "Failed to save";
        toast.error(msg);
      },
    },
  });

  const [siteName, setSiteName] = useState("");
  const [tagline, setTagline] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primary, setPrimary] = useState("");
  const [footerText, setFooterText] = useState("");

  // Hydrate form when data first loads (and not while saving).
  useEffect(() => {
    if (!data || update.isPending) return;
    setSiteName(data.siteName);
    setTagline(data.tagline);
    setLogoUrl(data.logoUrl);
    setPrimary(data.primaryColorHsl);
    setFooterText(data.footerText);
  }, [data, update.isPending]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    update.mutate({
      data: {
        siteName: siteName.trim(),
        tagline: tagline.trim(),
        logoUrl: logoUrl.trim(),
        primaryColorHsl: primary.trim(),
        footerText: footerText.trim(),
      },
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" data-testid="admin-branding-form">
      <div>
        <h1 className="text-2xl font-semibold">Branding</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Site name, tagline, logo and primary colour. Changes apply across the app instantly.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="siteName">Site name</Label>
            <Input id="siteName" value={siteName} onChange={(e) => setSiteName(e.target.value)} required maxLength={120} data-testid="input-site-name" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tagline">Tagline</Label>
            <Input id="tagline" value={tagline} onChange={(e) => setTagline(e.target.value)} maxLength={240} data-testid="input-tagline" />
            <p className="text-xs text-muted-foreground">Short line shown under the site name in the sidebar.</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input id="logoUrl" type="url" inputMode="url" placeholder="https://…/logo.svg" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} data-testid="input-logo-url" />
            <p className="text-xs text-muted-foreground">Leave blank to use the default music icon. Drag-and-drop upload arrives in Phase 3.</p>
            {logoUrl && (
              <div className="mt-2 inline-flex items-center gap-3 rounded-md border bg-muted/40 p-3">
                <img src={logoUrl} alt="Logo preview" className="h-10 w-10 object-contain rounded bg-white" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                <span className="text-xs text-muted-foreground">Preview</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theme</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="primary">Primary colour (HSL)</Label>
            <div className="flex items-center gap-3">
              <Input id="primary" value={primary} onChange={(e) => setPrimary(e.target.value)} placeholder="174 55% 35%" maxLength={64} className="font-mono" data-testid="input-primary-color" />
              <div
                aria-label="Primary colour preview"
                className="w-10 h-10 rounded-md border shadow-sm shrink-0"
                style={{ background: `hsl(${primary || "174 55% 35%"})` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              HSL triple, e.g. <code className="font-mono">174 55% 35%</code>. Try{" "}
              {[
                ["174 55% 35%", "Kodály teal"],
                ["217 70% 45%", "Royal blue"],
                ["340 70% 45%", "Crimson"],
                ["28 85% 52%", "Amber"],
              ].map(([hsl, name]) => (
                <button
                  key={hsl}
                  type="button"
                  onClick={() => setPrimary(hsl)}
                  className="ml-1.5 inline-flex items-center gap-1 rounded border px-1.5 py-0.5 hover-elevate"
                >
                  <span className="w-3 h-3 rounded-full" style={{ background: `hsl(${hsl})` }} />
                  {name}
                </button>
              ))}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Footer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label htmlFor="footerText">Footer text</Label>
            <Textarea id="footerText" rows={3} value={footerText} onChange={(e) => setFooterText(e.target.value)} maxLength={1000} placeholder="© 2026 Your School Trust — built with Kodály Pathways" data-testid="input-footer-text" />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-3 sticky bottom-0 bg-background/80 backdrop-blur py-3 -mx-4 px-4 border-t">
        <Button type="submit" disabled={update.isPending} data-testid="button-save-branding">
          {update.isPending ? "Saving…" : "Save branding"}
        </Button>
      </div>
    </form>
  );
}
