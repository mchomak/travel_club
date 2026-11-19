"use client";

import { useEffect } from "react";

type Event = "lead_form_open" | "lead_submit_success" | "lead_submit_error";
type Counter = ((...args: unknown[]) => void) & { a?: unknown[][]; l?: number };

// Form events stay private, even if analytics is enabled elsewhere.
export function trackLeadEvent(event: Event) { void event; }

export function WebsiteAnalytics({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled || location.search || location.hash) return;
    if (document.referrer) {
      try {
        const referrer = new URL(document.referrer);
        if (referrer.origin !== location.origin || referrer.search || referrer.hash || /^\/(start|thanks)(\/|$)/.test(referrer.pathname)) return;
      } catch { return; }
    }
    if (document.querySelector("script[data-website-metrika]")) return;
    const target = window as Window & { ym?: Counter };
    const counter: Counter = (...args) => { (counter.a ??= []).push(args); };
    counter.l = Date.now();
    target.ym = counter;
    const script = document.createElement("script");
    script.dataset.websiteMetrika = "";
    script.async = true;
    script.src = "https://mc.yandex.ru/metrika/tag.js";
    document.head.appendChild(script);
    counter(114346486, "init", { defer: true, webvisor: true, clickmap: false, trackLinks: false, trackHash: false, sendTitle: false });
    counter(114346486, "hit", location.origin + location.pathname, { referer: "", title: "" });
  }, [enabled]);
  return null;
}
