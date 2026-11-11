import Image from "next/image";

export function BrandLogo({ className, preload = false, tone = "navy" }: { className?: string; preload?: boolean; tone?: "navy" | "cream" }) {
  const src = tone === "cream" ? "/website/assets/brand/TC_Logo_Editorial_Signature_Cream.svg" : "/website/assets/brand/travel-club-navy.svg";
  return <Image className={className} src={src} width={460} height={219} alt="Travel Club" preload={preload} />;
}
