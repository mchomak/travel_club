import Link from "next/link";
import { Compass, Map } from "lucide-react";
import { requireAdmin } from "@/lib/server-auth";
import { LogoutButton } from "@/components/logout-button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return <div className="min-h-dvh lg:grid lg:grid-cols-[220px_1fr]">
    <aside className="border-b border-line bg-paper p-5 lg:border-r lg:border-b-0 lg:p-7">
      <Link href="/admin/trips" className="flex items-center gap-2 text-lg font-semibold"><Compass className="text-accent" aria-hidden />Travel Club</Link>
      <nav aria-label="Основная навигация" className="mt-6"><Link href="/admin/trips" className="flex min-h-11 items-center gap-3 rounded-lg bg-green-50 px-3 font-medium text-accent"><Map size={18} aria-hidden />Поездки</Link></nav>
    </aside>
    <div className="min-w-0"><header className="flex items-center justify-between gap-4 border-b border-line px-6 py-3 lg:px-10">
      <span className="text-sm text-muted">Кабинет команды</span><div className="flex items-center gap-4"><span className="max-w-40 truncate text-sm">{user.login}</span><LogoutButton /></div>
    </header><main className="p-6 lg:p-10">{children}</main></div>
  </div>;
}
