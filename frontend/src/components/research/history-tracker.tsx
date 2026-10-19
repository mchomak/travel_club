"use client";

import { useEffect } from "react";
import { flushAllPendingAnswers, hasPendingAnswerDrafts } from "@/lib/research";

const historyIndexKey = "__tcResearchHistoryIndex";
let latestHistoryIndex = 0;

function stateWithIndex(state: unknown, index: number): Record<string, unknown> {
  return {
    ...(state && typeof state === "object" ? state as Record<string, unknown> : {}),
    [historyIndexKey]: index,
  };
}

function indexFromState(state: unknown): number | null {
  if (!state || typeof state !== "object") return null;
  const index = (state as Record<string, unknown>)[historyIndexKey];
  return typeof index === "number" ? index : null;
}

export function ResearchHistoryTracker() {
  useEffect(() => {
    const history = window.history;
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    let currentEntry = {
      href: window.location.href,
      index: indexFromState(history.state) ?? Math.max(++latestHistoryIndex, history.length),
    };
    latestHistoryIndex = Math.max(latestHistoryIndex, currentEntry.index);
    let restoringHistory = false;
    let replayingHistory = false;
    let historyDestination: string | null = null;
    let restoreDelta: number | null = null;
    let navigationPending = false;

    const updateCurrentEntry = () => {
      currentEntry = { href: window.location.href, index: indexFromState(history.state) ?? currentEntry.index };
    };

    originalReplaceState.call(history, stateWithIndex(history.state, currentEntry.index), "", window.location.href);

    const trackedPushState: History["pushState"] = function (data, unused, url) {
      const nextIndex = ++latestHistoryIndex;
      const result = originalPushState.call(history, stateWithIndex(data, nextIndex), unused, url);
      updateCurrentEntry();
      return result;
    };
    const trackedReplaceState: History["replaceState"] = function (data, unused, url) {
      const nextIndex = indexFromState(data) ?? currentEntry.index;
      const result = originalReplaceState.call(history, stateWithIndex(data, nextIndex), unused, url);
      updateCurrentEntry();
      return result;
    };

    history.pushState = trackedPushState;
    history.replaceState = trackedReplaceState;

    const guardBrowserHistory = (event: PopStateEvent) => {
      if (replayingHistory) {
        const expected = historyDestination;
        if (expected && window.location.href === expected) {
          replayingHistory = false;
          historyDestination = null;
          restoreDelta = null;
          navigationPending = false;
          updateCurrentEntry();
          return;
        }
        replayingHistory = false;
        navigationPending = false;
      }

      if (restoringHistory) {
        event.preventDefault();
        event.stopImmediatePropagation();
        restoringHistory = false;
        updateCurrentEntry();
        const destination = historyDestination;
        if (destination) {
          window.setTimeout(() => {
            void (async () => {
              const saved = await flushAllPendingAnswers().catch(() => false);
              if (!saved && !window.confirm("Есть несохранённые изменения. Ответы ещё не подтверждены сервером, и текст может быть потерян. Перейти?")) {
                historyDestination = null;
                restoreDelta = null;
                navigationPending = false;
                return;
              }
              if (restoreDelta === null) {
                historyDestination = null;
                navigationPending = false;
                return;
              }
              replayingHistory = true;
              history.go(-restoreDelta);
            })();
          }, 0);
        } else {
          restoreDelta = null;
          navigationPending = false;
        }
        return;
      }

      const target = { href: window.location.href, index: indexFromState(event.state) };
      const currentUrl = new URL(currentEntry.href);
      const targetUrl = new URL(target.href);
      const changesRoute = targetUrl.origin === currentUrl.origin
        && (targetUrl.pathname !== currentUrl.pathname || targetUrl.search !== currentUrl.search);

      if (!changesRoute || !hasPendingAnswerDrafts() || navigationPending) {
        currentEntry = { href: target.href, index: target.index ?? currentEntry.index };
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();
      navigationPending = true;
      historyDestination = target.href;
      restoringHistory = true;
      restoreDelta = target.index !== null && target.index > currentEntry.index ? -1 : 1;
      history.go(restoreDelta);
    };

    window.addEventListener("popstate", guardBrowserHistory, true);
    return () => {
      window.removeEventListener("popstate", guardBrowserHistory, true);
      if (history.pushState === trackedPushState) history.pushState = originalPushState;
      if (history.replaceState === trackedReplaceState) history.replaceState = originalReplaceState;
    };
  }, []);

  return null;
}
