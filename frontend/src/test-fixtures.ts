import { readFileSync } from "node:fs";
import path from "node:path";
import type { Calculation, TripInput } from "./lib/contracts";

type Totals = Pick<Calculation, "cost_total" | "cost_per_person" | "client_price" | "profit" | "actual_margin_percent" | "general_total">;
export const vectors = JSON.parse(readFileSync(path.resolve(process.cwd(), "../shared/pricing-vectors.json"), "utf8")) as { cases: { name: string; input: TripInput; expected: Partial<Totals> }[] };
