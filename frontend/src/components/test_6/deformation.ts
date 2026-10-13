export type PageShape = { bend: number; curl: number; stiffness: number; lift: number; spineConstraint: number; outerEdgeInfluence: number };
export const PAGE_WIDTH = 2.32;
export const PAGE_HEIGHT = 2.9;
export const DEFAULT_SHAPE: PageShape = { bend: 1.65, curl: .65, stiffness: .24, lift: .35, spineConstraint: .12, outerEdgeInfluence: .065 };

/** Arc-length sampled midsurface, row-major from the lower spine corner. */
export function deformPage(progress: number, shape: PageShape, columns = 56, rows = 12): Float32Array {
  const p = Math.max(0, Math.min(1, progress));
  const eased = p * p * (3 - 2 * p);
  const envelope = Math.sin(Math.PI * p) ** 1.1;
  const compliance = 1 - shape.stiffness * .88;
  const step = PAGE_WIDTH / columns;
  const points = new Float32Array((columns + 1) * (rows + 1) * 3);
  for (let row = 0; row <= rows; row++) {
    const across = row / rows - .5;
    let x = 0, z = 0;
    for (let column = 0; column <= columns; column++) {
      if (column > 0) {
        const u = (column - .5) / columns;
        // Independent root tangent restraint and a restrained outer corner lead.
        const traveling = .22 + .56 * eased;
        const wave = Math.tanh((u - traveling) * 4.5);
        const spineLag = shape.spineConstraint * 3 * (1 - u) ** 4;
        const angle = Math.max(0, Math.min(Math.PI, Math.PI * eased + envelope * compliance *
          (shape.bend * (u - .48) + shape.curl * .45 * wave + shape.lift * .22 * u - spineLag + across * shape.outerEdgeInfluence * u * u)));
        x += Math.cos(angle) * step;
        z += Math.sin(angle) * step;
      }
      const offset = (row * (columns + 1) + column) * 3;
      points[offset] = x;
      points[offset + 1] = across * PAGE_HEIGHT;
      points[offset + 2] = z;
    }
  }
  return points;
}
