export type Point = { x: number; y: number };

/** Project a CSS pixel rectangle onto the perspective camera's four sheet corners. */
export function pageMatrix(width: number, height: number, points: readonly Point[]): string {
  const [a, b, c, d] = points;
  const dx1 = b.x - c.x, dx2 = d.x - c.x, dx3 = a.x - b.x + c.x - d.x;
  const dy1 = b.y - c.y, dy2 = d.y - c.y, dy3 = a.y - b.y + c.y - d.y;
  const denominator = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / denominator;
  const h = (dx1 * dy3 - dx3 * dy1) / denominator;
  const matrix = [
    (b.x - a.x + g * b.x) / width, (b.y - a.y + g * b.y) / width, 0, g / width,
    (d.x - a.x + h * d.x) / height, (d.y - a.y + h * d.y) / height, 0, h / height,
    0, 0, 1, 0, a.x, a.y, 0, 1,
  ];
  return `matrix3d(${matrix.map(value => value.toFixed(12)).join(",")})`;
}
