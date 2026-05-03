import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as SonnerToaster } from "sonner";
import { useGetCurrentUser } from "@workspace/api-client-react";
import { AppLayout } from "@/components/AppLayout";
import LoginPage from "@/pages/Login";
import WalkthroughPage from "@/pages/Walkthrough";
import DashboardPage from "@/pages/Dashboard";
import ClassesPage from "@/pages/Classes";
import PathwayPage from "@/pages/Pathway";
import ActivitiesPage from "@/pages/Activities";
import LessonBuilderPage from "@/pages/LessonBuilder";
import LessonEditPage from "@/pages/LessonEdit";
import CalendarPage from "@/pages/Calendar";
import ResourcesPage from "@/pages/Resources";
import IWBPage from "@/pages/IWB";
import SettingsPage from "@/pages/Settings";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: false, refetchOnWindowFocus: false } },
});

function ProtectedRoutes() {
  const { data, isLoading } = useGetCurrentUser();
  if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading…</div>;
  if (!data?.user) return <Redirect to="/login" />;
  return (
    <AppLayout teacher={data.user}>
      <Switch>
        <Route path="/" component={() => <Redirect to="/dashboard" />} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/classes" component={ClassesPage} />
        <Route path="/pathway" component={PathwayPage} />
        <Route path="/activities" component={ActivitiesPage} />
        <Route path="/lesson-builder" component={LessonBuilderPage} />
        <Route path="/lessons/:id" component={LessonEditPage} />
        <Route path="/calendar" component={CalendarPage} />
        <Route path="/resources" component={ResourcesPage} />
        <Route path="/iwb" component={IWBPage} />
        <Route path="/settings" component={SettingsPage} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Switch>
            <Route path="/login" component={LoginPage} />
            <Route path="/walkthrough" component={WalkthroughPage} />
            <Route component={ProtectedRoutes} />
          </Switch>
        </WouterRouter>
        <SonnerToaster position="top-right" richColors />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
