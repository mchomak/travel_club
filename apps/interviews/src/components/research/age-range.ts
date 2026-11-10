const NON_ASCII_DASHES = /[\u2012-\u2015\u2212]/g;

export function formatAgeRange(value: string): string {
  return value.replace(/_/g, "-").replace(NON_ASCII_DASHES, "-");
}

export function formatAgeLabel(value: string | null | undefined): string {
  const ageRange = value?.trim();
  return `Возраст: ${ageRange ? formatAgeRange(ageRange) : "—"}`;
}
