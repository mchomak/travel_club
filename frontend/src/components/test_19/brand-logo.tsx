import Image from "next/image";

export function BrandLogo({ className, preload = false }: { className?: string; preload?: boolean }) {
  return <Image className={className} src="/test_19/travel-club-navy.svg" width={460} height={219} alt="Travel Club" preload={preload} />;
}
