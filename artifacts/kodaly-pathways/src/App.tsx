import { useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, Redirect, useLocation } from "wouter";
import { QueryClient, QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, useClerk } from "@clerk/react";
import { publishableKeyFromHost } from "@clerk/react/internal";
import { shadcn } from "@clerk/themes";
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

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
const clerkPubKey = publishableKeyFromHost(
  window.location.hostname,
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY,
);
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;

if (!clerkPubKey) {
  // Surface a clear error rather than a confusing blank screen.
  // eslint-disable-next-line no-console
  console.error("Missing VITE_CLERK_PUBLISHABLE_KEY");
}

function stripBase(p: string): string {
  return basePath && p.startsWith(basePath) ? p.slice(basePath.length) || "/" : p;
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${window.location.origin}${basePath}/logo.svg`,
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "hsl(174 55% 35%)",
    colorForeground: "hsl(180 25% 12%)",
    colorMutedForeground: "hsl(180 8% 45%)",
    colorDanger: "hsl(0 70% 50%)",
    colorBackground: "hsl(0 0% 100%)",
    colorInput: "hsl(0 0% 100%)",
    colorInputForeground: "hsl(180 25% 12%)",
    colorNeutral: "hsl(180 15% 88%)",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    borderRadius: "0.625rem",
  },
  elements: {
    rootBox: "w-full flex justify-center",
    cardBox: "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl ring-1 ring-slate-200",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-slate-900 text-2xl font-semibold",
    headerSubtitle: "text-slate-500",
    socialButtonsBlockButtonText: "text-slate-700 font-medium",
    socialButtonsBlockButton: "bg-white border-slate-200 hover:bg-slate-50",
    formFieldLabel: "text-slate-700",
    formFieldInput: "bg-white border-slate-200",
    formButtonPrimary: "bg-[hsl(174_55%_35%)] hover:bg-[hsl(174_55%_30%)] text-white",
    footerActionLink: "text-[hsl(174_55%_35%)] hover:text-[hsl(174_55%_30%)] font-medium",
    footerActionText: "text-slate-500",
    dividerText: "text-slate-400",
    dividerLine: "bg-slate-200",
    logoBox: "h-10",
    logoImage: "h-10 w-auto",
  },
};

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

function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 px-4 py-10">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/dashboard`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-emerald-50 px-4 py-10">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        fallbackRedirectUrl={`${basePath}/dashboard`}
      />
    </div>
  );
}

function ClerkQueryCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (prevUserIdRef.current !== undefined && prevUserIdRef.current !== userId) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);
  return null;
}

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey ?? ""}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: { title: "Welcome back", subtitle: "Sign in to Kodály Pathways" },
        },
        signUp: {
          start: { title: "Create your account", subtitle: "Plan, sequence, teach — the Kodály way." },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/login" component={LoginPage} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            <Route path="/walkthrough" component={WalkthroughPage} />
            <Route component={ProtectedRoutes} />
          </Switch>
          <SonnerToaster position="top-right" richColors />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;
