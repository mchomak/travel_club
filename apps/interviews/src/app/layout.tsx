import type { Metadata } from "next";
import "../styles/globals.css";

export const metadata: Metadata = { title: "TC Research", description: "Платформа Travel Club для интервью и исследований" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ru"><body>{children}</body></html>;
}
