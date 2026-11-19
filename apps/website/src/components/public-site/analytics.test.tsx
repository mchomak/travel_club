import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { WebsiteAnalytics, trackLeadEvent } from "./analytics";

afterEach(() => { cleanup(); document.querySelectorAll("script[data-website-metrika]").forEach(s => s.remove()); delete (window as Window & { ym?: unknown }).ym; window.history.replaceState({}, "", "/"); vi.restoreAllMocks(); });

describe("website analytics", () => {
  it("loads the provider only when explicitly enabled on a clean public entry", () => {
    render(<WebsiteAnalytics enabled />);
    expect(document.querySelector('script[src="https://mc.yandex.ru/metrika/tag.js"]')).not.toBeNull();
  });
  it.each(["/?token=synthetic", "/#synthetic"]) ("does not load for sensitive entry %s", url => {
    window.history.replaceState({}, "", url);
    render(<WebsiteAnalytics enabled />);
    expect(document.querySelector('script[src*="yandex"]')).toBeNull();
  });
  it("does not load for an external referrer", () => {
    vi.spyOn(document, "referrer", "get").mockReturnValue("https://example.test/?token=synthetic");
    render(<WebsiteAnalytics enabled />);
    expect(document.querySelector('script[src*="yandex"]')).toBeNull();
  });
  it("stays disabled by default", () => {
    render(<WebsiteAnalytics enabled={false} />);
    trackLeadEvent("lead_submit_success");
    expect(document.querySelector('script[src*="yandex"]')).toBeNull();
  });
});
