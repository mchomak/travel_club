import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { UserInfo } from "./contracts";

export async function requireAdmin(): Promise<UserInfo> {
  const token = (await cookies()).get("travel_session");
  if (!token) redirect("/admin/login");
  const response = await fetch(`${process.env.BACKEND_URL ?? "http://127.0.0.1:8000"}/api/auth/me`, {
    cache: "no-store", headers: { Cookie: `travel_session=${encodeURIComponent(token.value)}` },
  });
  if (response.status === 401) redirect("/admin/login");
  if (!response.ok) throw new Error("Не удалось проверить вход. Попробуйте ещё раз.");
  return response.json();
}
