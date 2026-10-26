import Image from "next/image";

export function BrandLogo({ className, preload = false, tone = "navy" }: { className?: string; preload?: boolean; tone?: "navy" | "cream" }) {
  const src = tone === "cream" ? "/test_9/TC_Logo_Editorial_Signature_Cream.svg" : "/test_20/travel-club-navy.svg";
  return <Image className={className} src={src} width={460} height={219} alt="Travel Club" preload={preload} />;
}
