/** API text limits count Unicode code points. */
export function maxTextLength(limit: number) {
  return (text?: string) => Array.from(text ?? "").length <= limit || `Не более ${limit} символов`;
}
