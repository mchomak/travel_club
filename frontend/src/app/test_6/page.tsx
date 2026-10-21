import type { Metadata } from "next";
import { LivingIssueLaboratory } from "@/components/test_6/laboratory";

export const metadata: Metadata = { title: "Living Issue — Scene laboratory", robots: { index: false, follow: false } };
export default function SceneLaboratoryPage() { return <LivingIssueLaboratory />; }
