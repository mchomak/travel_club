import { describe, expect, it } from "vitest";
import { DEFAULT_TIMING, sampleTimeline, timelineDuration } from "./timeline";
describe("replayable magazine sequence", () => {
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
    for (const timing of [DEFAULT_TIMING, { flipDuration: .2, delay: 0 }, { flipDuration: 2, delay: .8 }]) {
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
