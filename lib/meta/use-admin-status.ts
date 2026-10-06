"use client";
import { useEffect, useState } from "react";

export function useMetaAdminStatus<T>(endpoint: string, initial: T): { summary: T; error: boolean } {
  const [summary, setSummary] = useState(initial);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true, busy = false;
    const controller = new AbortController();
    async function refresh() {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      try {
        const response = await fetch(endpoint, { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(10000)]) });
        if (!response.ok) throw new Error("status");
        const result: T = await response.json();
        if (active) { setSummary(result); setError(false); }
      } catch { if (active) setError(true); }
      finally { busy = false; }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 30000);
    const focus = () => void refresh();
    window.addEventListener("focus", focus);
    return () => { active = false; controller.abort(); window.clearInterval(timer); window.removeEventListener("focus", focus); };
  }, [endpoint]);
  return { summary, error };
}
