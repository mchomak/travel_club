import { apiRequest } from "./api";
import type { TripDocument } from "./contracts";

export type ImportDraftSummary = { id: string; version: number; created_at: string; updated_at: string; trip_id?: string | null };
export type ImportDraftIssue = { severity?: string; code?: string; path?: string; message?: string; title?: string };
export type ImportDraft = { id: string; version: number; source: string; original_source?: string; trip_id?: string | null; trip_version?: number | null; unapplied?: {path: string; code: string}[]; normalized?: {path: string; code: string}[]; validation: { issues: ImportDraftIssue[]; document_checks_passed?: boolean; skipped_stages?: string[]; unchecked_checks?: string[] } };

export const importDraftApi = {
  list: () => apiRequest<ImportDraftSummary[]>("/import-drafts"),
  get: (id: string) => apiRequest<ImportDraft>(`/import-drafts/${encodeURIComponent(id)}`),
  create: (source: string) => apiRequest<ImportDraft>("/import-drafts", { method: "POST", body: source }),
  save: (id: string, version: number, source: string) => apiRequest<ImportDraft>(`/import-drafts/${encodeURIComponent(id)}?version=${version}`, { method: "PUT", body: source }),
  apply: (id: string, version: number) => apiRequest<TripDocument>(`/import-drafts/${encodeURIComponent(id)}/apply?version=${version}`, { method: "POST" }),
  resolve: (id: string, trip_version: number, entry: {path: string; code: string}) => apiRequest<ImportDraft>(`/import-drafts/${encodeURIComponent(id)}/resolve`, { method: "POST", body: JSON.stringify({ trip_version, ...entry }) }),
};
