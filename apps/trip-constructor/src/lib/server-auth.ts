import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import type { UserInfo } from "./contracts";
import { AUTH_RETURN_TO_HEADER, safeAuthReturnTarget } from "./return-target";

export async function requireAdmin(): Promise<UserInfo> {
  const requestHeaders = await headers();
  const returnTarget = safeAuthReturnTarget(requestHeaders.get(AUTH_RETURN_TO_HEADER));
  const loginUrl = `/admin/login?next=${encodeURIComponent(returnTarget)}`;
  const token = (await cookies()).get("travel_session");
  if (!token) redirect(loginUrl);
  const response = await fetch(`${process.env.BACKEND_URL ?? "http://127.0.0.1:8000"}/api/auth/me`, {
    cache: "no-store", headers: { Cookie: `travel_session=${encodeURIComponent(token.value)}` },
  });
  if (response.status === 401) redirect(loginUrl);
  if (!response.ok) throw new Error("Не удалось проверить вход. Попробуйте ещё раз.");
  return response.json();
}
