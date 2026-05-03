import { Link } from "wouter";
import { useGetDashboardSummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LayoutDashboard, NotebookPen, CalendarDays, Library, Folder, GraduationCap } from "lucide-react";

export default function DashboardPage() {
  const { data, isLoading } = useGetDashboardSummary();

  if (isLoading) return <div className="text-muted-foreground">Loading dashboard…</div>;
  const totals = data?.totals;
  const recent = data?.recentLessons ?? [];
  const upcoming = data?.upcoming ?? [];
  const term = data?.termBreakdown ?? [];

  const tiles = [
    { label: "Classes", value: totals?.classes ?? 0, href: "/classes", icon: GraduationCap },
    { label: "Lessons", value: totals?.lessons ?? 0, href: "/lesson-builder", icon: NotebookPen },
    { label: "Activities", value: totals?.activities ?? 0, href: "/activities", icon: Library },
    { label: "Calendar entries", value: totals?.calendarEntries ?? 0, href: "/calendar", icon: CalendarDays },
    { label: "Resources", value: totals?.resources ?? 0, href: "/resources", icon: Folder },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-primary" />
            Welcome back{data?.teacher?.name ? `, ${data.teacher.name}` : ""}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Your Kodály planning at a glance.</p>
        </div>
        <Link href="/lesson-builder">
          <Button data-testid="button-build-lesson">Build a lesson</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href}>
            <a className="block">
              <Card className="hover-elevate cursor-pointer" data-testid={`tile-${t.label.toLowerCase().replace(" ","-")}`}>
                <CardContent className="p-4 flex flex-col gap-1">
                  <t.icon className="w-5 h-5 text-primary mb-1" />
                  <div className="text-2xl font-semibold">{t.value}</div>
                  <div className="text-xs text-muted-foreground">{t.label}</div>
                </CardContent>
              </Card>
            </a>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>Recent lessons</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {recent.length === 0 && <p className="text-sm text-muted-foreground">No lessons yet — build your first one.</p>}
            {recent.map((l) => (
              <Link key={l.id} href={`/lessons/${l.id}`}>
                <a className="block p-3 rounded-md border bg-card hover-elevate">
                  <div className="font-medium">{l.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {l.keyStage} · {l.yearGroup} · {l.term || "Unscheduled"} · {l.lengthMinutes} min
                  </div>
                </a>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Upcoming on your calendar</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 && <p className="text-sm text-muted-foreground">No calendar entries yet.</p>}
            {upcoming.map((e) => (
              <div key={e.id} className="p-3 rounded-md border bg-card">
                <div className="font-medium">{e.title || "Untitled"}</div>
                <div className="text-xs text-muted-foreground">
                  {e.term} · Week {e.weekNumber}{e.dayLabel ? ` · ${e.dayLabel}` : ""}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {term.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Lessons by term</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              {term.map((t) => (
                <div key={t.term} className="px-3 py-2 rounded-md border bg-secondary text-secondary-foreground">
                  <div className="text-xs uppercase tracking-wide opacity-70">{t.term}</div>
                  <div className="text-lg font-semibold">{t.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
