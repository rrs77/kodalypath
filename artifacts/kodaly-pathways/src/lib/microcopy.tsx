import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useGetMicrocopy } from "@workspace/api-client-react";

type MicrocopyMap = Record<string, string>;

const Ctx = createContext<MicrocopyMap>({});

export function MicrocopyProvider({ children }: { children: ReactNode }) {
  const { data } = useGetMicrocopy();
  const map = useMemo<MicrocopyMap>(() => ({ ...(data ?? {}) }), [data]);
  return <Ctx.Provider value={map}>{children}</Ctx.Provider>;
}

/** Lookup a microcopy string by key with a default fallback. */
export function useText(key: string, fallback = ""): string {
  const map = useContext(Ctx);
  const v = map[key];
  return typeof v === "string" && v.length > 0 ? v : fallback;
}

export function useMicrocopy(): MicrocopyMap {
  return useContext(Ctx);
}
