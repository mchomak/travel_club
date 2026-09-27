import type { TripDocument, TripInput, TripUpdate } from "./contracts";
import { tripInput } from "./trips";

export type SaveTrip = (id: string, trip: TripUpdate, confirm: boolean) => Promise<TripDocument>;
export interface DraftState { draft: TripInput; document: TripDocument; dirty: boolean; status: "saved" | "dirty" | "saving" | "error"; error: Error | null }
export class DraftSession {
  private state: DraftState;
  private revision = 0;
  private inFlight: Promise<TripDocument> | null = null;
  private listeners = new Set<() => void>();
  constructor(document: TripDocument, private persist: SaveTrip) { this.state = { draft: tripInput(document), document, dirty: false, status: "saved", error: null }; }
  get draft() { return this.state.draft; }
  get document() { return this.state.document; }
  getSnapshot = () => this.state;
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  private emit(next: Partial<DraftState>) { this.state = { ...this.state, ...next }; this.listeners.forEach(fn => fn()); }
  change(draft: TripInput) { this.revision += 1; this.emit({ draft, dirty: true, status: this.inFlight ? "saving" : "dirty", error: null }); }
  save(confirm = false): Promise<TripDocument> {
    if (this.inFlight) return this.inFlight;
    if (!this.state.dirty) return Promise.resolve(this.document);
    this.inFlight = this.flush(confirm).finally(() => { this.inFlight = null; });
    return this.inFlight;
  }
  private async flush(confirm: boolean) {
    this.emit({ status: "saving", error: null });
    try {
      while (this.state.dirty) {
        const revision = this.revision;
        const document = await this.persist(this.document.id, { ...this.draft, version: this.document.version }, confirm);
        confirm = false;
        const latest = revision === this.revision;
        this.emit({ document, ...(latest ? { draft: tripInput(document), dirty: false, status: "saved" } : { status: "saving" }) });
      }
      return this.document;
    } catch (error) {
      this.emit({ status: "error", error: error instanceof Error ? error : new Error("Не удалось сохранить. Повторите попытку.") });
      throw error;
    }
  }
}
