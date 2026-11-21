import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Программа поездки · Travel Club",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

export default function TripLayout({ children }: { children: ReactNode }) {
  return children;
}
