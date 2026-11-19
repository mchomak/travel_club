import "server-only";
import { requireAdmin } from "@/lib/server-auth";

export type LeadStatus = "new" | "in_progress" | "closed";
export type Lead = { id: string; number: string; created_at: string; product_id: string; source: string; status: LeadStatus; notification_status: string | null; name?: string | null; contact_method?: string; contact_value?: string; message?: string | null; notification_attempts?: number | null; notification_error?: string | null };
export type LeadList = { items: Lead[]; counts: Record<LeadStatus, number> };

export async function leadsRequest<T>(path: string, init?: RequestInit): Promise<T> {
  await requireAdmin();
  const key = process.env.WEBSITE_ADMIN_SECRET ?? "";
  if (key.length < 32) throw new Error("Сервис заявок не настроен");
  const response = await fetch(`${process.env.WEBSITE_LEADS_API_URL ?? "http://127.0.0.1:8001"}/internal/leads${path}`, {
    ...init, cache: "no-store", headers: { "X-Website-Admin-Key": key, ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw new Error("Сервис заявок недоступен");
  return response.json() as Promise<T>;
}
