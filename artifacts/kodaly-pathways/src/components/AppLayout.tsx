import { Link, useLocation } from "wouter";
import { ReactNode, useEffect, useState } from "react";
import {
  LayoutDashboard, GraduationCap, Map, Library, NotebookPen, CalendarDays,
  Folder, Monitor, Settings, Music, Menu, X, Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Teacher } from "@workspace/api-client-react";
import { useSiteSettings } from "@/lib/site-settings";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/classes", label: "Classes", icon: GraduationCap },
  { href: "/pathway", label: "Pathway", icon: Map },
  { href: "/activities", label: "Activities", icon: Library },
  { href: "/lesson-builder", label: "Lessons", icon: NotebookPen },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/resources", label: "Resources", icon: Folder },
  { href: "/iwb", label: "IWB Mode", icon: Monitor },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout({ children, teacher }: { children: ReactNode; teacher: Teacher | null }) {
  const [loc] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const settings = useSiteSettings();
  const isAdmin = teacher?.role === "admin";
  const brandName = settings.siteName || "Kodály Pathways";
  const brandTagline = settings.tagline || "Music lesson planner";

  // Close mobile drawer on route change
  useEffect(() => { setMobileOpen(false); }, [loc]);

  // Lock body scroll + Escape-to-close while drawer is open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  const sidebar = (
    <>
      <div className="px-5 py-5 border-b border-sidebar-border flex items-center gap-2">
        {settings.logoUrl ? (
          <img
            src={settings.logoUrl}
            alt=""
            className="w-9 h-9 rounded-md object-contain bg-white shrink-0"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <div className="w-9 h-9 rounded-md bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center shrink-0">
            <Music className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <div className="font-semibold leading-tight truncate" data-testid="brand-name">{brandName}</div>
          <div className="text-xs opacity-70 truncate">{brandTagline}</div>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto" aria-label="Primary">
        {NAV.map((item) => {
          const active = loc === item.href || loc.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover-elevate",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:ring-offset-0",
                active && "kp-nav-active font-medium",
              )}
              aria-current={active ? "page" : undefined}
              data-testid={`nav-${item.href.replace("/", "")}`}
            >
              <Icon className={cn("w-4 h-4 transition-colors", active ? "text-sidebar-primary" : "opacity-80")} />
              {item.label}
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/admin"
            className={cn(
              "relative flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover-elevate",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
              loc.startsWith("/admin") && "kp-nav-active font-medium",
            )}
            data-testid="nav-admin"
          >
            <Shield className={cn("w-4 h-4", loc.startsWith("/admin") ? "text-sidebar-primary" : "opacity-80")} />
            Site admin
          </Link>
        )}
      </nav>
      <div className="p-3 border-t border-sidebar-border text-xs space-y-1">
        <div>
          <div className="opacity-70">Signed in as</div>
          <div className="font-medium truncate" data-testid="text-current-teacher">{teacher?.name || teacher?.email || "—"}</div>
        </div>
        {settings.footerText && (
          <div className="opacity-60 pt-2 border-t border-sidebar-border/60 mt-2 whitespace-pre-line">{settings.footerText}</div>
        )}
      </div>
    </>
  );

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 bg-sidebar text-sidebar-foreground flex-col border-r border-sidebar-border">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-in fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside
            id="mobile-sidebar"
            className="md:hidden fixed top-0 left-0 bottom-0 z-50 w-64 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border shadow-xl animate-in slide-in-from-left duration-200"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
          >
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-3 p-1.5 rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebar}
          </aside>
        </>
      )}

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 h-14 border-b bg-background sticky top-0 z-30">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2 rounded-md hover-elevate"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            aria-controls="mobile-sidebar"
            data-testid="button-mobile-menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="" className="w-7 h-7 rounded-md object-contain bg-white shrink-0" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
            ) : (
              <div className="w-7 h-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                <Music className="w-4 h-4" />
              </div>
            )}
            <span className="font-semibold truncate">{brandName}</span>
          </div>
        </header>

        <div className="flex-1 overflow-auto kp-scroll">
          <div key={loc} className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 page-enter">{children}</div>
        </div>
      </main>
    </div>
  );
}
