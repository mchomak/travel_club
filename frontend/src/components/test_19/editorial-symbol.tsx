import type { ReactNode } from "react";

type SymbolName = "route" | "ready" | "companions" | "direction" | "waypoint" | "note" | "onward";

// A shared 24-unit print grid: open routes, fine rules and small registration points.
const artwork: Record<SymbolName, ReactNode> = {
  route: <><path d="M5 18 9 7h10M9 7l7 11" /><circle cx="5" cy="18" r="2" /><circle cx="19" cy="7" r="2" /><circle cx="16" cy="18" r="1" fill="currentColor" stroke="none" /></>,
  ready: <><path d="M4 8h8V4h8v12h-8v4H4V8Zm8 0v8M7 12h2m6 0h2" /><circle cx="7" cy="16" r="1" fill="currentColor" stroke="none" /></>,
  companions: <><path d="m6 8 6 10 6-10M8 6h8" /><circle cx="6" cy="6" r="2" /><circle cx="18" cy="6" r="2" /><circle cx="12" cy="19" r="2" /></>,
  direction: <><path d="M4 20 18 6m-9 0h9v9M4 10V4h6" /><circle cx="5" cy="19" r="2" /><circle cx="20" cy="20" r="1" fill="currentColor" stroke="none" /></>,
  waypoint: <><path d="m12 3 7 9-7 9-7-9 7-9ZM1 12h4m14 0h4" /><circle cx="12" cy="12" r="2" /></>,
  note: <><path d="M8 4H4v16h16v-4M8 9h8m-8 4h5m3-9h4v4" /><circle cx="17" cy="13" r="1" fill="currentColor" stroke="none" /></>,
  onward: <><path d="M5 19 20 4M10 4h10v10" /><circle cx="5" cy="19" r="2" /></>,
};

export function EditorialSymbol({ name, className }: { name: SymbolName; className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{artwork[name]}</svg>;
}
