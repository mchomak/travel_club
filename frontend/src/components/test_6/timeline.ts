export type Timing = { flipDuration: number; delay: number };
export const DEFAULT_TIMING: Timing = { flipDuration: .64, delay: .18 };
export type TimelineFrame = { phase: string; spread: number; turning: boolean; cover: boolean; progress: number; total: number; elapsed: number };
export function timelineDuration(timing: Timing): number { return .22 + .64 + timing.delay + 3 * (timing.flipDuration + timing.delay); }
export function sampleTimeline(elapsed: number, timing: Timing): TimelineFrame {
  const total = timelineDuration(timing);
  const time = Math.max(0, Math.min(total, elapsed));
  const frame = { phase: "CLOSED", spread: 0, turning: true, cover: true, progress: 0, total, elapsed: time };
  if (time < .22) return frame;
  if (time < .86) return { ...frame, phase: "OPENING", progress: (time - .22) / .64 };
  let start = .86 + timing.delay;
  for (let spread = 0; spread < 3; spread++) {
    if (time < start) return { ...frame, phase: `SPREAD_${spread + 1}`, cover: false, turning: false, spread };
    if (time < start + timing.flipDuration) return { ...frame, phase: `FLIP_${spread + 1}`, cover: false, progress: (time - start) / timing.flipDuration, spread };
    start += timing.flipDuration + timing.delay;
  }
  return { ...frame, phase: "TARGET", cover: false, turning: false, progress: 1, spread: 3 };
}
