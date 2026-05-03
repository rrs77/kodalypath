import { Link, useLocation } from "wouter";
import { ReactNode } from "react";
import {
  LayoutDashboard, GraduationCap, Map, Library, NotebookPen, CalendarDays,
  Folder, Monitor, Settings, Music,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Teacher } from "@workspace/api-client-react";

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
  return (
    <div className="min-h-screen flex bg-background text-foreground">
      <aside className="w-60 shrink-0 bg-sidebar text-sidebar-foreground flex flex-col border-r border-sidebar-border">
        <div className="px-5 py-5 border-b border-sidebar-border flex items-center gap-2">
          <div className="w-9 h-9 rounded-md bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center">
            <Music className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold leading-tight">Kodály Pathways</div>
            <div className="text-xs opacity-70">Music lesson planner</div>
          </div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV.map((item) => {
            const active = loc === item.href || loc.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm hover-elevate",
                  active && "bg-sidebar-accent text-sidebar-accent-foreground",
                )}
                data-testid={`nav-${item.href.replace("/", "")}`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border text-xs">
          <div className="opacity-70">Signed in as</div>
          <div className="font-medium truncate" data-testid="text-current-teacher">{teacher?.name || teacher?.email || "—"}</div>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-auto">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
