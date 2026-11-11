import type { ReactNode } from "react";

/** The shared public shell is applied once by the Website root layout. */
export default function PublicationLayout({ children }: { children: ReactNode }) {
  return children;
}
