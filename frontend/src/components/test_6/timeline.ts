export type AnimationVariant = "original" | "fast";
export type SpeedPoint = { position: number; speed: number };
export const MAX_LEAVES = 120;
export const SPEED_PRESETS = {
  flat: [1, 1, 1, 1, 1],
  slowing: [2.4, 2.2, 1.7, 1, .45],
  accelerating: [.7, 1.8, 3, 1.5, .45],
} as const;
export function presetCurve(preset: keyof typeof SPEED_PRESETS): SpeedPoint[] {
  return SPEED_PRESETS[preset].map((speed, index) => ({ position: index / 4, speed }));
}
export type Timing = { variant: AnimationVariant; flipDuration: number; delay: number; pageCount: number; speedCurve: readonly SpeedPoint[] };
export const DEFAULT_TIMING: Timing = { variant: "original", flipDuration: .68, delay: .14, pageCount: 3, speedCurve: presetCurve("flat") };
export const ANIMATION_TIMINGS: Record<AnimationVariant, Timing> = {
  original: DEFAULT_TIMING,
  fast: { variant: "fast", flipDuration: .34, delay: .07, pageCount: 24, speedCurve: presetCurve("slowing") },
};
export function leafCount(timing: Timing): number {
  return timing.variant === "original" ? 3 : Math.max(1, Math.min(MAX_LEAVES, Math.round(timing.pageCount)));
}
export function speedAt(curve: readonly SpeedPoint[], position: number): number {
  const clamp = (speed: number) => Math.max(.25, Math.min(4, speed));
  if (!curve.length) return 1;
  if (position <= curve[0].position) return clamp(curve[0].speed);
  for (let i = 1; i < curve.length; i++) {
    const a = curve[i - 1], b = curve[i];
    if (position <= b.position) {
      const t = Math.max(0, Math.min(1, (position - a.position) / Math.max(.001, b.position - a.position)));
      const smooth = t * t * (3 - 2 * t);
      return clamp(a.speed * (1 - smooth) + b.speed * smooth);
    }
  }
  return clamp(curve[curve.length - 1].speed);
}
// Reuse a fixed set of textures, regardless of how many leaves are requested.
export function artworkIndex(spread: number, timing: Timing): number {
  if (spread >= leafCount(timing)) return 3;
  if (timing.variant === "original") return [0, 1, 2][spread];
  if (spread === 0) return 0;
  return [4, 1, 5, 2, 6, 0][(spread - 1) % 6];
}
type Turn = { start: number; end: number; duration: number };
export type Timeline = { total: number; count: number; turns: readonly Turn[] };
/** Build only when timing changes. Animation frames just sample this schedule. */
export function buildTimeline(timing: Timing): Timeline {
  const count = leafCount(timing), turns: Turn[] = [];
  let start = .86 + timing.delay;
  for (let leaf = 0; leaf < count; leaf++) {
    const speed = timing.variant === "original" ? 1 : speedAt(timing.speedCurve, count === 1 ? 1 : leaf / (count - 1));
    const duration = timing.flipDuration / speed;
    turns.push({ start, end: start + duration, duration });
    start += duration + timing.delay / speed;
  }
  return { total: start, count, turns };
}
export type TimelineFrame = { phase: string; spread: number; turning: boolean; cover: boolean; progress: number; total: number; elapsed: number };
export function timelineDuration(timing: Timing): number { return buildTimeline(timing).total; }
export function sampleTimeline(elapsed: number, input: Timing | Timeline): TimelineFrame {
  const schedule = "turns" in input ? input : buildTimeline(input);
  const total = schedule.total;
  const time = Math.max(0, Math.min(total, elapsed));
  const frame = { phase: "CLOSED", spread: 0, turning: true, cover: true, progress: 0, total, elapsed: time };
  if (time < .22) return frame;
  if (time < .86) return { ...frame, phase: "OPENING", progress: (time - .22) / .64 };
  for (let spread = 0; spread < schedule.count; spread++) {
    const turn = schedule.turns[spread];
    if (time + 1e-9 < turn.start) return { ...frame, phase: `SPREAD_${spread + 1}`, cover: false, turning: false, spread };
    if (time + 1e-9 < turn.end) return { ...frame, phase: `FLIP_${spread + 1}`, cover: false,
      progress: Math.max(0, (time - turn.start) / turn.duration), spread };
  }
  return { ...frame, phase: "TARGET", cover: false, turning: false, progress: 1, spread: schedule.count };
}
