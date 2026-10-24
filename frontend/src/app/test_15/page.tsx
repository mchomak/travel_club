import type { Metadata } from "next";
import { ContinuousIssue } from "@/components/test_15/continuous-issue";

export const metadata: Metadata = {
  title: "Travel Club — Continuous issue reading",
  description: "Seven chapters in one continuous reading column with a sticky chapter index.",
  robots: { index: false, follow: false },
};

export default function TestFifteenPage() {
  return <ContinuousIssue />;
}
