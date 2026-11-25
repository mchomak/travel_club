import { apiRequest } from "./api";
import type { TripDocument } from "./contracts";

export type ReimportIssue = { id: string; message: string; path?: string; severity?: string };
export type ReimportChange = { path: string; operation: string; base: unknown; current: unknown; proposed: unknown; base_present: boolean; current_present: boolean; proposed_present: boolean; conflict: boolean };
type Estimate = {cost_total: string; client_price: string; profit: string; incomplete: boolean; currency: string};
export type ReimportPreview = { version: number; changes: ReimportChange[]; validation_before: ReimportIssue[] | null; validation_after: ReimportIssue[] | null; estimate_before?: Estimate | null; estimate_after?: Estimate | null };
export type ReimportResult = { trip: TripDocument; backup_snapshot_id: string };
type Proposal = { snapshot_id: string; proposed: Record<string, unknown> };
const endpoint = (tripId: string, action: string) => `/trips/${encodeURIComponent(tripId)}/reimport/${action}`;
export const reimportApi = {
  backups: (tripId: string) => apiRequest<{ id: string; trip_version: number; created_at: string }[]>(endpoint(tripId, "backups")),
  preview: (tripId: string, data: Proposal) => apiRequest<ReimportPreview>(endpoint(tripId, "preview"), { method: "POST", body: JSON.stringify(data) }),
  apply: (tripId: string, data: Proposal & { expected_version: number; selected_paths: string[]; confirm_date_removal: boolean }) => apiRequest<ReimportResult>(endpoint(tripId, "apply"), { method: "POST", body: JSON.stringify(data) }),
  restore: (tripId: string, data: { snapshot_id: string; expected_version: number; confirm_date_removal: boolean }) => apiRequest<ReimportResult>(endpoint(tripId, "restore"), { method: "POST", body: JSON.stringify(data) }),
  exportSnapshot: (tripId: string) => apiRequest<{ snapshot_id: string; version: number; trip: unknown }>(endpoint(tripId, "export"), { method: "POST" }),
};
