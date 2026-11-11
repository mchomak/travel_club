import type { Metadata } from "next";
import { WebsiteExperience, websiteHomeMetadata } from "@/components/website-home/website-experience";

export const metadata: Metadata = {
  ...websiteHomeMetadata,
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <WebsiteExperience />;
}
