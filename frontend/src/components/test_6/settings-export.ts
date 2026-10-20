import type { SceneParams } from "./parameters";

export const SETTINGS_FORMAT = "travel-club/test_6-settings";

export function serializeSceneSettings(settings: SceneParams): string {
  return JSON.stringify({ format: SETTINGS_FORMAT, version: 1, settings }, null, 2);
}

export function downloadSceneSettings(settings: SceneParams): void {
  const blob = new Blob([serializeSceneSettings(settings)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "test-6-settings.json";
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
