import { useCallback, useEffect, useRef, useState } from "react";

import { LogTerminal } from "@/panel/components/LogTerminal";
import { PanelNavBar } from "@/panel/components/PanelNavBar";
import {
  installBridge,
  uninstallBridge,
  waitForSession,
  getSourceInfo,
  triggerRemoteLogin,
  setLogCallback,
  hasSession,
} from "@/panel/lib/kicad-bridge";
import { getCategories, isAuthError, setApiToken } from "@/panel/lib/panel-api";
import type { PanelComponent } from "@/panel/lib/panel-api";
import { FINDER, recalledComponent, rememberComponent, type PanelPlace } from "@/panel/lib/panel-history";
import { appendPanelLog, emptyPanelLog } from "@/panel/lib/panel-log";
import { usePanelNavigation } from "@/panel/lib/use-panel-navigation";
import {
  emptyCategoryBrowse,
  emptyFinderView,
  type CategoryBrowseState,
} from "@/panel/lib/view-state";

import { PanelLoginScreen } from "@/panel/screens/PanelLoginScreen";
import { SymbolFinderScreen } from "@/panel/screens/SymbolFinderScreen";
import { CategoryListScreen } from "@/panel/screens/CategoryListScreen";
import { PartDetailScreen } from "@/panel/screens/PartDetailScreen";

/** The component to open once signed in: the one whose part page in Prism was just closed (``?component=``). */
function componentInAddress(): string | null {
  return new URL(window.location.href).searchParams.get("component");
}

/** Drops ``?component=`` once it has been opened, so a reload starts at the finder. */
function forgetComponentInAddress(): void {
  const url = new URL(window.location.href);
  if (!url.searchParams.has("component")) return;
  url.searchParams.delete("component");
  window.history.replaceState(window.history.state, "", url);
}

export function PanelApp() {
  const [componentToOpen] = useState(componentInAddress);
  // Taken by the first successful sign-in check only: a later one (KiCad handing over a token) leaves the screen alone.
  const componentOpened = useRef(false);
  const [finderView, setFinderView] = useState(emptyFinderView);
  const [categoryView, setCategoryView] = useState<CategoryBrowseState>(
    () => emptyCategoryBrowse(""),
  );
  const [log, setLog] = useState(emptyPanelLog);
  const [sessionReady, setSessionReady] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // A category list belongs to one category; arriving at another starts it empty.
  const showPlace = useCallback((place: PanelPlace) => {
    if (place.kind !== "category") return;
    setCategoryView((prev) => (prev.name === place.name ? prev : emptyCategoryBrowse(place.name)));
  }, []);
  const nav = usePanelNavigation(showPlace);
  const { place, enter: enterPanel, showLogin } = nav;

  const appendLog = useCallback((msg: string) => {
    const stamp = new Date().toLocaleTimeString();
    setLog((prev) => appendPanelLog(prev, `[${stamp}] ${msg}`));
  }, []);

  const clearLog = useCallback(() => setLog(emptyPanelLog()), []);

  const testAuthAndRoute = useCallback(async (signal?: AbortSignal) => {
    try {
      // This succeeds if we have a valid cookie session or valid token.
      await getCategories(signal);
      if (signal?.aborted) return;
      appendLog("Session authenticated — entering finder.");
      const opened = componentOpened.current ? null : componentToOpen;
      componentOpened.current = true;
      forgetComponentInAddress();
      enterPanel(opened);
    } catch (err) {
      if (signal?.aborted) return;
      if (isAuthError(err)) {
        appendLog("Session not authenticated.");
        showLogin();
      } else {
        // API reachable but failed (e.g. network error, empty results). We still enter the app.
        appendLog(`API reachable — entering finder. (${(err as Error).message})`);
        enterPanel(null);
      }
    }
  }, [appendLog, componentToOpen, enterPanel, showLogin]);

  // ─── Initialize bridge ──────────────────────────────────────────

  useEffect(() => {
    setLogCallback(appendLog);
    installBridge();
    const sessionWait = new AbortController();

    (async () => {
      try {
        // 1. Start waiting for KiCad session in background
        waitForSession({ signal: sessionWait.signal }).then(async () => {
          if (sessionWait.signal.aborted) return;
          setSessionReady(true);
          appendLog("KiCad session ready.");
          try {
            const sourceInfo = await getSourceInfo();
            if (sessionWait.signal.aborted) return;
            const params = (sourceInfo.parameters || {}) as Record<string, unknown>;
            if (params.token) {
              setApiToken(params.token as string);
              appendLog("Extracted token from KiCad session.");
              // We got a new token, try routing again just in case we were stuck on login
              void testAuthAndRoute(sessionWait.signal);
            }
            if (params.auth_type === "oauth2" && !params.authenticated) {
              appendLog("KiCad reports authentication required.");
              // Only override to login if currently in finder (could wait for search failure)
            }
          } catch (e) {
            if (sessionWait.signal.aborted) return;
            appendLog(`Source info error: ${(e as Error).message}`);
          }
        }).catch((err) => {
          if (sessionWait.signal.aborted || (err as Error).name === "AbortError") return;
          appendLog(`KiCad init error: ${(err as Error).message}`);
        });

        // 2. Immediately check if we have a valid cookie session via the API
        await testAuthAndRoute(sessionWait.signal);
      } catch (err) {
        if (sessionWait.signal.aborted) return;
        appendLog(`Init error: ${(err as Error).message}`);
      }
    })();

    return () => {
      sessionWait.abort();
      uninstallBridge();
    };
  }, [appendLog, testAuthAndRoute]);

  // ─── Login handler ──────────────────────────────────────────────

  const handleLogin = useCallback(async () => {
    if (!hasSession()) {
      setLoginError("KiCad session not ready yet.");
      return;
    }
    setLoginLoading(true);
    setLoginError(null);
    try {
      const response = await triggerRemoteLogin();
      const params = (response.parameters || {}) as Record<string, unknown>;

      if (params.token) {
        setApiToken(params.token as string);
        appendLog("Extracted token from KiCad session after login.");
      }

      if (params.started) {
        appendLog("Login flow started in system browser.");
        setLoginError(null);
        // KiCad will reload the panel after auth completes
      } else if (params.authenticated) {
        appendLog("Already authenticated.");
        enterPanel(null);
      } else {
        appendLog(`Login response: ${JSON.stringify(params)}`);
      }
    } catch (err) {
      const msg = (err as Error).message;
      appendLog(`Login failed: ${msg}`);
      setLoginError(msg);
    } finally {
      setLoginLoading(false);
    }
  }, [appendLog, enterPanel]);

  // ─── Navigation helpers ─────────────────────────────────────────

  const { push } = nav;

  const goToFinder = useCallback(() => {
    if (place?.kind !== "finder") push(FINDER);
  }, [place, push]);

  const goToCategory = useCallback((name: string, total?: number | null) => {
    setCategoryView((prev) =>
      prev.name === name ? prev : emptyCategoryBrowse(name, total ?? null),
    );
    push({ kind: "category", name });
  }, [push]);

  const goToDetail = useCallback((comp: PanelComponent) => {
    rememberComponent(comp);
    push({ kind: "detail", componentId: comp.id });
  }, [push]);

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[460px] flex-col">
      {place && (
        <PanelNavBar
          canGoBack={nav.canGoBack}
          canGoForward={nav.canGoForward}
          atHome={place.kind === "finder"}
          onBack={nav.back}
          onForward={nav.forward}
          onHome={goToFinder}
        />
      )}

      {/* Main content area */}
      <main className="flex flex-1 flex-col px-3 py-3">
        {!place && (
          <PanelLoginScreen
            onLogin={handleLogin}
            isLoading={loginLoading}
            error={loginError}
            sessionReady={sessionReady}
          />
        )}

        {place?.kind === "finder" && (
          <SymbolFinderScreen
            viewState={finderView}
            onViewStateChange={setFinderView}
            onSelectCategory={goToCategory}
            onSelectComponent={goToDetail}
            onAuthRequired={showLogin}
            appendLog={appendLog}
          />
        )}

        {place?.kind === "category" && (
          <CategoryListScreen
            category={place.name}
            viewState={categoryView}
            onViewStateChange={setCategoryView}
            onSelectComponent={goToDetail}
            onAuthRequired={showLogin}
            appendLog={appendLog}
          />
        )}

        {place?.kind === "detail" && (
          <PartDetailScreen
            key={place.componentId}
            componentId={place.componentId}
            prefetched={recalledComponent(place.componentId)}
            onAuthRequired={showLogin}
            appendLog={appendLog}
          />
        )}
      </main>

      {/* Log terminal — always at bottom */}
      <div className="px-3 pb-3">
        <LogTerminal entries={log.entries} dropped={log.dropped} onClear={clearLog} />
      </div>
    </div>
  );
}
