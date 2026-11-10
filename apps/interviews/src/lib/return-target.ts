export const AUTH_RETURN_TO_HEADER = "x-travel-club-return-to";
export const DEFAULT_AUTH_RETURN_TARGET = "/home";

const URL_BASE = "https://travel-club.invalid";

function containsControlCharacters(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

export function safeAuthReturnTarget(target: unknown, fallback = DEFAULT_AUTH_RETURN_TARGET): string {
  if (
    typeof target !== "string" ||
    !target.startsWith("/") ||
    target.startsWith("//") ||
    target.includes("\\") ||
    containsControlCharacters(target)
  ) {
    return fallback;
  }

  try {
    const url = new URL(target, URL_BASE);
    if (url.origin !== URL_BASE) return fallback;

    const decodedPath = decodeURIComponent(url.pathname);
    if (decodedPath.startsWith("//") || decodedPath.includes("\\") || containsControlCharacters(decodedPath)) {
      return fallback;
    }

    const normalizedPath = new URL(decodedPath, URL_BASE).pathname.replace(/\/+$/, "").toLowerCase();
    if (normalizedPath === "/admin/login") return fallback;

    return `${url.pathname}${url.search}`;
  } catch {
    return fallback;
  }
}
