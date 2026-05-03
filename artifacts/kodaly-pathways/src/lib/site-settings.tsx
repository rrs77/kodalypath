import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useGetSiteSettings } from "@workspace/api-client-react";
import type { SiteSettings } from "@workspace/api-client-react";

const DEFAULTS: SiteSettings = {
  siteName: "Kodály Pathways",
  tagline: "Music lesson planner",
  logoUrl: "",
  primaryColorHsl: "174 55% 35%",
  footerText: "",
  social: {},
};

const Ctx = createContext<SiteSettings>(DEFAULTS);

/**
 * Fetches site-wide CMS branding once and:
 *   1) exposes it via context for any consumer (header/footer/login pages),
 *   2) writes the primary colour onto :root as `--primary` so every Tailwind
 *      utility built on `hsl(var(--primary))` updates live.
 */
export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const { data } = useGetSiteSettings();
  const settings = useMemo<SiteSettings>(() => ({ ...DEFAULTS, ...(data ?? {}) }), [data]);

  useEffect(() => {
    const root = document.documentElement;
    const prev = root.style.getPropertyValue("--primary");
    if (settings.primaryColorHsl) {
      root.style.setProperty("--primary", settings.primaryColorHsl);
    }
    return () => {
      if (prev) root.style.setProperty("--primary", prev);
      else root.style.removeProperty("--primary");
    };
  }, [settings.primaryColorHsl]);

  return <Ctx.Provider value={settings}>{children}</Ctx.Provider>;
}

export function useSiteSettings(): SiteSettings {
  return useContext(Ctx);
}
