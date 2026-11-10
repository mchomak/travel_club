import type { Metadata } from "next";
import { TestTwentyOneExperience, testTwentyOneMetadata } from "@/components/test_21/test-twenty-one-experience";

export const metadata: Metadata = {
  ...testTwentyOneMetadata,
  robots: { index: false, follow: false },
};

export default function TestTwentyOnePage() {
  return <TestTwentyOneExperience />;
}
