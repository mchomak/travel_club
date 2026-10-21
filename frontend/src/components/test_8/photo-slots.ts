import { photoSlots as existing } from "../test_5/photo-slots";
import type { PhotoSlot } from "../test_5/photo-slots";

// Stable frame identities; each occurrence can be edited independently.
export const photoSlots: Record<string, PhotoSlot> = {
  "hero-table": { ...existing["hero-table"] },
  "hero-ferry": { ...existing["hero-ferry"] },
  "formats-table": { ...existing["club-table"] },
  "next-table": { ...existing["club-table"], aspectRatio: .82 },
  "thailand-islands": { ...existing["thailand-26-islands"] },
  "thailand-company": { ...existing["thailand-26-company"] },
  "thailand-boat": { ...existing["thailand-26-boat"] },
  "china-street": { ...existing["china-26-street"] },
  "china-beijing": { ...existing["china-26-beijing"] },
  "china-company": { ...existing["thailand-26-company"] },
  "archive-china": { ...existing["archive-china-street"] },
  "archive-madagascar": { ...existing["archive-madagascar-baobabs"], aspectRatio: 1.4 },
  "archive-thailand": { ...existing["archive-thailand-islands"] },
  "approach-table": { ...existing["pov-cafe-print"], aspectRatio: .82 },
};
