import { describe, expect, it } from "vitest";
import { DEFAULT_SHAPE, deformPage, PAGE_WIDTH } from "./deformation";

describe("the physical turning leaf", () => {
  it("relaxes its curl before touchdown instead of flattening abruptly on the last frame", () => {
    const points = deformPage(.99, DEFAULT_SHAPE, 56, 16);
    const heights = [...points].filter((_, index) => index % 3 === 2);
    expect(Math.max(...heights)).toBeLessThan(.004);
  });
  it("forms a broad paper curl at midflip rather than a nearly straight rising card", () => {
    const points = deformPage(.5, DEFAULT_SHAPE, 56, 16);
    const base = 8 * 57 * 3;
    const tangent = (column: number) => {
      const i = base + column * 3;
      return Math.atan2(points[i + 5] - points[i + 2], points[i + 3] - points[i]);
    };
    // More than 120 degrees of tangent change reads as a curled sheet in silhouette.
    expect(tangent(55) - tangent(0)).toBeGreaterThan(2.1);
  });
  it("anchors every spine vertex while the free edge rises into a curved cross-section", () => {
    const points = deformPage(.48, DEFAULT_SHAPE, 56, 12);
    for (let row = 0; row <= 12; row++) {
      const offset = row * 57 * 3;
      expect(points[offset]).toBe(0);
      expect(points[offset + 2]).toBe(0);
    }
    expect(points[56 * 3 + 2]).toBeGreaterThan(.8);
    // A rigid card has the same slope on both halves. A bent leaf must not.
    const a = Math.atan2(points[14 * 3 + 2], points[14 * 3]);
    const b = Math.atan2(points[56 * 3 + 2] - points[42 * 3 + 2], points[56 * 3] - points[42 * 3]);
    expect(Math.abs(b - a)).toBeGreaterThan(.4);
    expect(Math.hypot(points[3], points[5])).toBeLessThan(PAGE_WIDTH / 56 + .00001);
  });
  it("preserves the paper's arc length and settles flat at either endpoint", () => {
    for (const progress of [0, .08, .25, .5, .78, .95, 1]) {
      const points = deformPage(progress, DEFAULT_SHAPE, 56, 12);
      expect([...points].every(Number.isFinite)).toBe(true);
      for (let row = 0; row <= 12; row++) {
        let length = 0;
        for (let column = 1; column <= 56; column++) {
          const index = (row * 57 + column) * 3;
          length += Math.hypot(points[index] - points[index - 3], points[index + 2] - points[index - 1]);
        }
        expect(length).toBeCloseTo(PAGE_WIDTH, 5);
      }
      if (progress === 0 || progress === 1) {
        expect(points[56 * 3]).toBeCloseTo(progress === 0 ? PAGE_WIDTH : -PAGE_WIDTH, 5);
        expect(Math.max(...points.filter((_, index) => index % 3 === 2))).toBeLessThan(.00001);
      }
    }
  });
  it("uses a small controlled twist and keeps a stiff cover less curved", () => {
    const paper = deformPage(.45, DEFAULT_SHAPE, 56, 12);
    const cover = deformPage(.45, { ...DEFAULT_SHAPE, stiffness: 1 }, 56, 12);
    const bendMeasure = (points: Float32Array) => Math.abs(Math.atan2(points[42 * 3 + 2] - points[28 * 3 + 2], points[42 * 3] - points[28 * 3]) - Math.atan2(points[14 * 3 + 2], points[14 * 3]));
    expect(bendMeasure(paper)).toBeGreaterThan(bendMeasure(cover) * 2);
    const last = (12 * 57 + 56) * 3;
    expect(Math.abs(paper[last] - paper[56 * 3])).toBeGreaterThan(.001);
    for (let column = 0; column <= 56; column++) {
      const a = column * 3, b = (57 + column) * 3;
      expect(Math.hypot(paper[b] - paper[a], paper[b + 1] - paper[a + 1], paper[b + 2] - paper[a + 2])).toBeLessThan(2.9 / 12 * 1.005);
    }
  });
  it("independently restrains the near-spine tangent without stretching or unanchoring it", () => {
    const loose = deformPage(.46, { ...DEFAULT_SHAPE, spineConstraint: 0 }, 56, 12);
    const constrained = deformPage(.46, { ...DEFAULT_SHAPE, spineConstraint: .6 }, 56, 12);
    expect(constrained[4 * 3 + 2]).toBeLessThan(loose[4 * 3 + 2] * .5);
    expect(constrained[0]).toBe(0); expect(constrained[2]).toBe(0);
    let length = 0;
    for (let column = 1; column <= 56; column++) {
      const index = column * 3;
      length += Math.hypot(constrained[index] - constrained[index - 3], constrained[index + 2] - constrained[index - 1]);
    }
    expect(length).toBeCloseTo(PAGE_WIDTH, 5);
    const untwisted = deformPage(.46, { ...DEFAULT_SHAPE, outerEdgeInfluence: 0 }, 56, 12);
    expect(untwisted[56 * 3]).toBe(untwisted[(12 * 57 + 56) * 3]);
    expect(constrained[56 * 3]).not.toBe(constrained[(12 * 57 + 56) * 3]);
  });
});
