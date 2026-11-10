import type { Metadata } from "next";
import { TestTwentyOneExperience, testTwentyOneMetadata } from "@/components/test_21/test-twenty-one-experience";

export const metadata: Metadata = {
  ...testTwentyOneMetadata,
  robots: { index: true, follow: true },
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <TestTwentyOneExperience />;
}
