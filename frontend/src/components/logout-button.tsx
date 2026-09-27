"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { authApi } from "@/lib/api";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setPending(true); setError("");
    try { await authApi.logout(); router.replace("/admin/login"); router.refresh(); }
    catch { setError("Не удалось выйти. Попробуйте ещё раз."); }
    finally { setPending(false); }
  }
  return <div><button onClick={logout} disabled={pending} className="flex min-h-11 items-center gap-2 rounded px-3 text-sm">
    <LogOut size={16} aria-hidden />{pending ? "Выходим…" : "Выйти"}
  </button>{error && <p role="alert" className="max-w-60 text-sm text-red-800">{error}</p>}</div>;
}
