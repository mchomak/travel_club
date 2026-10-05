import type { ProductId } from "./data";
import s from "./editorial.module.css";

export function FormatMotif({ id }: { id: ProductId }) {
  const shape = id === "plan" ? <><path d="M3 21 10 14 15 17 25 5" /><circle cx="3" cy="21" r="2" /><circle cx="15" cy="17" r="2" /><circle cx="25" cy="5" r="2" /></> : id === "turnkey" ? <><rect x="5" y="4" width="18" height="21" rx="1" /><path d="M9 4V1h10v3M10 11h8M10 16h8" /><circle cx="18" cy="21" r="1" /></> : <><circle cx="7" cy="10" r="3" /><circle cx="21" cy="10" r="3" /><path d="M1 25v-3a6 6 0 0 1 12 0v3M15 25v-3a6 6 0 0 1 12 0v3" /></>;
  return <span className={`${s.formatMotif} ${s[`formatMotif${id[0].toUpperCase()}${id.slice(1)}`]}`} aria-hidden="true"><svg viewBox="0 0 28 28" focusable="false">{shape}</svg></span>;
}
