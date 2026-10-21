"use client";

import Link from "next/link";
import { Map, UserRound } from "lucide-react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin/trips", label: "Поездки", Icon: Map },
  { href: "/admin/account", label: "Аккаунт", Icon: UserRound },
];

export function AdminNavigation() {
  const pathname = usePathname() ?? "";

  return <nav aria-label="Основная навигация" className="mt-6 flex gap-2 lg:flex-col">
    {links.map(({ href, label, Icon }) => {
      const active = pathname === href || pathname.startsWith(`${href}/`);
      return <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`flex min-h-11 items-center gap-3 rounded-lg px-3 font-medium transition-colors ${active ? "bg-green-50 text-accent" : "text-muted hover:bg-green-50 hover:text-accent"}`}
      >
        <Icon size={18} aria-hidden />{label}
      </Link>;
    })}
  </nav>;
}
