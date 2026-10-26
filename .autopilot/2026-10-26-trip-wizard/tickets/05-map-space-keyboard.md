# 05 — Space key activation for map markers

**Requirement:** R58 — «При адаптации сохраняй доступность всех операций редактирования.»
**Blocked by:** 04
**Zone:** `frontend/e2e/trip-map.spec.ts`; only if the behavior fails, `frontend/src/components/trips/map-canvas.tsx`.

## Acceptance

- A keyboard-focused Leaflet item marker can be activated with Space.
- The owning item becomes selected, its popup remains open, and DOM focus stays on the marker after React updates.
- Space does not scroll the document while activating the marker.
- The test exercises the public marker behavior; avoid coupling it to an internal Leaflet handler name.
- If the current implementation fails, add the smallest scoped regression fix while preserving pointer and Enter behavior.
- No API, schema, dependency, or unrelated UI changes.

## Checks

- Focused Playwright marker-key test passes on the real app with only map-provider responses stubbed.
- Full `trip-map.spec.ts` and combined constructor + map + builder suites pass.
