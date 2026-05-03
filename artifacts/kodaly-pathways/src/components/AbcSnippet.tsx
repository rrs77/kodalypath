import { useEffect, useRef } from "react";
import abcjs from "abcjs";

export function AbcSnippet({ abc }: { abc: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      try {
        abcjs.renderAbc(ref.current, abc, { responsive: "resize" });
      } catch {
        ref.current.innerHTML = "";
      }
    }
  }, [abc]);
  return <div ref={ref} className="overflow-x-auto" />;
}
