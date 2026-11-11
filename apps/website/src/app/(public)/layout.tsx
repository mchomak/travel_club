import Link from "next/link";
import { Compass } from "lucide-react";
import s from "./public-layout.module.css";
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <div className={s.layout} data-public-layout><header className={s.header}>
    <Link href="/" className={s.brand}><Compass className={s.brandIcon} aria-hidden />Travel Club</Link>
    <nav aria-label="Разделы сайта" className={s.navigation}><Link href="/tours">Групповые туры</Link><Link href="/services/route">Маршрут</Link><Link href="/services/turnkey">Под ключ</Link><Link href="/payment">Оплата</Link></nav>
  </header><main className={s.main}>{children}</main><footer className={s.footer}><span>Travel Club</span><Link href="/admin/login">Вход для команды</Link></footer></div>;
}
