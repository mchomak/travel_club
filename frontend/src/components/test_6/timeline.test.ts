import { describe, expect, it } from "vitest";
import { ANIMATION_TIMINGS, artworkIndex, buildTimeline, DEFAULT_TIMING, presetCurve, sampleTimeline, speedAt, timelineDuration } from "./timeline";
describe("replayable magazine sequence", () => {
  it("recycles template spreads for 1, 2 and 120 leaves without revealing China early", () => {
    for (const count of [1, 2, 120]) {
      const timing = { ...ANIMATION_TIMINGS.fast, pageCount: count };
      const timeline = buildTimeline(timing);
      expect(timeline.turns).toHaveLength(count);
      const artwork = Array.from({ length: count }, (_, spread) => artworkIndex(spread, timing));
      expect(artwork.every(index => index >= 0 && index < 7 && index !== 3)).toBe(true);
      expect(artworkIndex(count, timing)).toBe(3);
      const last = timeline.turns[count - 1];
      expect(sampleTimeline(last.start + last.duration / 2, timeline)).toMatchObject({ phase: `FLIP_${count}`, spread: count - 1 });
      expect(sampleTimeline(timeline.total, timeline)).toMatchObject({ phase: "TARGET", spread: count });
    }
  });
  it("a curve can accelerate and decelerate without negative or overshooting speeds", () => {
    const curve = presetCurve("accelerating");
    expect(speedAt(curve, 0)).toBe(.7);
    expect(speedAt(curve, .5)).toBe(3);
    expect(speedAt(curve, 1)).toBe(.45);
    for (let position = 0; position <= 1; position += .01) {
      expect(speedAt(curve, position)).toBeGreaterThanOrEqual(.45);
      expect(speedAt(curve, position)).toBeLessThanOrEqual(3);
    }
    const timeline = buildTimeline({ ...ANIMATION_TIMINGS.fast, speedCurve: curve });
    expect(timeline.turns[12].duration).toBeLessThan(timeline.turns[0].duration);
    expect(timeline.turns[23].duration).toBeGreaterThan(timeline.turns[12].duration);
  });
  it("the original three-page timing ignores settings for the second variant", () => {
    const edited = { ...DEFAULT_TIMING, pageCount: 120, speedCurve: presetCurve("slowing") };
    expect(timelineDuration(edited)).toBeCloseTo(3.46, 10);
    expect(sampleTimeline(100, edited)).toMatchObject({ phase: "TARGET", spread: 3 });
  });
  it("accepts a long second animation and reaches the target only after its last leaf", () => {
    const many = { ...DEFAULT_TIMING, variant: "fast" as const, flipDuration: .2, delay: 0, pageCount: 24,
      speedCurve: [{ position: 0, speed: 1 }, { position: 1, speed: 1 }] };
    expect(timelineDuration(many)).toBeCloseTo(5.66, 10);
    expect(sampleTimeline(5.56, many)).toMatchObject({ phase: "FLIP_24", spread: 23, turning: true });
    expect(sampleTimeline(5.66, many)).toMatchObject({ phase: "TARGET", spread: 24, turning: false });
  });
  it("turns the early leaves faster and the final leaf slower according to the speed curve", () => {
    const slowing = { ...DEFAULT_TIMING, variant: "fast" as const, flipDuration: .4, delay: 0, pageCount: 3,
      speedCurve: [{ position: 0, speed: 2 }, { position: 1, speed: .5 }] };
    // Independently calculated durations: .4/2, .4/1.25, .4/.5.
    expect(timelineDuration(slowing)).toBeCloseTo(2.18, 10);
    for (const [elapsed, phase] of [[.96, "FLIP_1"], [1.22, "FLIP_2"], [1.78, "FLIP_3"]] as const) {
      expect(sampleTimeline(elapsed, slowing).phase).toBe(phase);
      expect(sampleTimeline(elapsed, slowing).progress).toBeCloseTo(.5, 10);
    }
  });
  it("the fast variant turns six leaves at twice the speed before holding the target", () => {
    const fast = { ...DEFAULT_TIMING, variant: "fast" as const, flipDuration: .34, delay: .07, pageCount: 6 };
    for (let leaf = 0; leaf < 6; leaf++) {
      const midpoint = .93 + leaf * .41 + .17;
      expect(sampleTimeline(midpoint, fast)).toMatchObject({
        phase: `FLIP_${leaf + 1}`, spread: leaf, cover: false, turning: true,
      });
      expect(sampleTimeline(midpoint, fast).progress).toBeCloseTo(.5, 10);
    }
    expect(timelineDuration(fast)).toBeCloseTo(3.39, 10);
    expect(sampleTimeline(100, fast)).toMatchObject({ phase: "TARGET", spread: 6, turning: false });
  });
  it("opens the cover, completes exactly three leaves, then holds China", () => {
    expect(sampleTimeline(0, DEFAULT_TIMING).phase).toBe("CLOSED");
    expect(sampleTimeline(.54, DEFAULT_TIMING)).toMatchObject({ cover: true, phase: "OPENING" });
    expect(sampleTimeline(.54, DEFAULT_TIMING).progress).toBeCloseTo(.5, 10);
    expect(sampleTimeline(1.1, DEFAULT_TIMING)).toMatchObject({ cover: false, spread: 0, turning: true });
    expect(sampleTimeline(1.9, DEFAULT_TIMING).spread).toBe(1);
    expect(sampleTimeline(2.7, DEFAULT_TIMING).spread).toBe(2);
    expect(sampleTimeline(100, DEFAULT_TIMING)).toMatchObject({ phase: "TARGET", spread: 3, turning: false, progress: 1 });
    expect(timelineDuration(DEFAULT_TIMING)).toBeGreaterThanOrEqual(2.5);
    expect(timelineDuration(DEFAULT_TIMING)).toBeLessThanOrEqual(4);
  });
  it("is deterministic at boundaries and remains valid with edited durations", () => {
    for (const timing of [DEFAULT_TIMING, { ...DEFAULT_TIMING, flipDuration: .2, delay: 0 }, { ...DEFAULT_TIMING, flipDuration: 2, delay: .8 }]) {
      expect(sampleTimeline(-1, timing).elapsed).toBe(0);
      expect(sampleTimeline(timelineDuration(timing), timing).phase).toBe("TARGET");
      for (let elapsed = 0; elapsed <= timelineDuration(timing); elapsed += .031) {
        const frame = sampleTimeline(elapsed, timing);
        expect(frame).toEqual(sampleTimeline(elapsed, timing));
        expect(frame.progress).toBeGreaterThanOrEqual(0);
        expect(frame.progress).toBeLessThanOrEqual(1);
        expect(frame.spread).toBeLessThanOrEqual(3);
      }
    }
  });
});
