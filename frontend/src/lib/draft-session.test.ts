import { expect, test, vi } from "vitest";
import { vectors } from "../test-fixtures";
import type { TripDocument, TripInput } from "./contracts";
import { calculateTrip } from "./pricing";
import { DraftSession } from "./draft-session";

test("save serializes changes made in flight and waits for the latest draft", async () => {
  const input = vectors.cases[0].input as TripInput;
  const doc = { ...input, id: "trip", version: 1, created_by: "user", created_at: "", updated_at: "", calculation: calculateTrip(input), items: [] } as TripDocument;
  let release!: (doc: TripDocument) => void;
  const persist = vi.fn().mockImplementationOnce(() => new Promise<TripDocument>(resolve => { release = resolve; })).mockImplementationOnce(async (_id, data) => ({ ...doc, ...data, version: 3 }));
  const session = new DraftSession(doc, persist);
  session.change({ ...session.draft, internal_title: "Первое изменение" });
  const pending = session.save();
  session.change({ ...session.draft, internal_title: "Свежий ввод" });
  expect(persist).toHaveBeenCalledTimes(1);
  release({ ...doc, internal_title: "Первое изменение", version: 2 });
  await pending;
  expect(persist.mock.calls[1][1]).toMatchObject({ internal_title: "Свежий ввод", version: 2 });
  expect(session.draft.internal_title).toBe("Свежий ввод");
});

test("an edit queued by the final acknowledgement cannot leave the session saving forever", async () => {
  const input = vectors.cases[0].input as TripInput;
  const doc = { ...input, id: "trip", version: 1, created_by: "user", created_at: "", updated_at: "", calculation: calculateTrip(input), items: [] } as TripDocument;
  const persist = vi.fn(async (_id, update) => ({ ...doc, ...update, version: update.version + 1 }));
  const session = new DraftSession(doc, persist);
  let queued = false;
  session.subscribe(() => {
    if (session.getSnapshot().status === "saved" && !queued) {
      queued = true;
      queueMicrotask(() => session.change({ ...session.draft, internal_title: "После ответа" }));
    }
  });
  session.change({ ...session.draft, internal_title: "До ответа" });
  await session.save();
  expect(session.getSnapshot().status).not.toBe("saving");
  await session.save();
  expect(session.getSnapshot()).toMatchObject({ dirty: false, status: "saved", draft: { internal_title: "После ответа" } });
  expect(persist).toHaveBeenCalledTimes(2);
});
