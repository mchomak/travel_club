import Link from "next/link";
import { Compass } from "lucide-react";
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex min-h-dvh max-w-6xl flex-col px-6 sm:px-10"><header className="flex flex-wrap items-center justify-between gap-6 border-b border-line py-7">
    <Link href="/" className="flex items-center gap-2 text-xl font-semibold"><Compass className="text-accent" aria-hidden />Travel Club</Link>
    <nav aria-label="Разделы сайта" className="flex flex-wrap gap-5 text-sm"><Link href="/tours">Групповые туры</Link><Link href="/services/route">Маршрут</Link><Link href="/services/turnkey">Под ключ</Link><Link href="/payment">Оплата</Link></nav>
  </header><main className="flex-1 py-20">{children}</main><footer className="flex justify-between gap-5 border-t border-line py-7 text-sm text-muted"><span>Travel Club</span><Link href="/admin/login" className="text-link">Вход для команды</Link></footer></div>;
}
