import { Suspense, lazy, useDeferredValue, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Search } from "lucide-react";
import { Toaster } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { fetchApi, ApiHttpError } from "@/lib/api";
import { fetchAuthConfig, fetchCurrentUser, isAuthCallbackPath } from "@/lib/auth";
import type { AuthConfig, User } from "@/types/auth";
import prismLogoMark from "./assets/branding/kicad-prism/kicad-prism-icon.svg";

const LoginPage = lazy(() =>
  import("./components/login-page").then((module) => ({ default: module.LoginPage }))
);
const AuthCallbackPage = lazy(() =>
  import("./components/auth-callback-page").then((module) => ({ default: module.AuthCallbackPage }))
);
const Workspace = lazy(() =>
  import("./components/workspace").then((module) => ({ default: module.Workspace }))
);
const ProjectDetailPage = lazy(() =>
  import("./pages/ProjectDetailPage").then((module) => ({ default: module.ProjectDetailPage }))
);

function RouteFallback() {
  return (
    <div className="flex h-full min-h-[16rem] items-center justify-center bg-background">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  );
}

function FullScreenMessage({ message, isError = false }: { message: string; isError?: boolean }) {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className={isError ? "text-red-500" : "text-muted-foreground"}>{message}</div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState("");
  const deferredWorkspaceSearchQuery = useDeferredValue(workspaceSearchQuery);
  const isAuthCallbackRoute = typeof window !== "undefined" && isAuthCallbackPath();

  const loadCurrentUser = async (config: AuthConfig, signal?: AbortSignal) => {
    try {
      const currentUser = await fetchCurrentUser(signal);
      if (signal?.aborted) {
        return;
      }
      setUser(currentUser);
      setAuthError(null);
    } catch (error) {
      if (signal?.aborted) {
        return;
      }
      if (error instanceof ApiHttpError && (error.status === 401 || error.status === 403)) {
        setUser(null);
        setAuthError(config.auth_enabled && error.status === 403 ? error.message : null);
        return;
      }
      throw error;
    }
  };

  useEffect(() => {
    const controller = new AbortController();

    const initializeAuth = async () => {
      try {
        const config = await fetchAuthConfig(controller.signal);
        if (controller.signal.aborted) {
          return;
        }

        setAuthConfig(config);
        setAuthError(null);
        await loadCurrentUser(config, controller.signal);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        console.error("Failed to initialize authentication", error);
        setUser(null);
        setAuthError("Failed to initialize authentication");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void initializeAuth();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handleAuthError = (event: Event) => {
      const customEvent = event as CustomEvent<{ status?: number; url?: string }>;
      const status = customEvent.detail?.status;
      const url = customEvent.detail?.url ?? "";
      if (status === 401) {
        setUser(null);
        return;
      }
      if (status === 403 && url.includes("/api/auth/me")) {
        setUser(null);
      }
    };

    window.addEventListener("kicad-prism-auth-error", handleAuthError);
    return () => window.removeEventListener("kicad-prism-auth-error", handleAuthError);
  }, []);

  const handleLogout = () => {
    void fetchApi("/api/auth/logout", { method: "POST" }).finally(() => {
      setUser(null);
      setAuthError(null);
    });
  };

  const handleLoginSuccess = (currentUser: User) => {
    setUser(currentUser);
    setAuthError(null);
  };

  if (loading) {
    return <FullScreenMessage message="Loading..." />;
  }

  if (!authConfig) {
    return <FullScreenMessage message={authError || "Failed to load authentication configuration."} isError />;
  }

  if (authConfig.auth_enabled && authConfig.auth_provider === "google" && !user && isAuthCallbackRoute) {
    return (
      <Suspense fallback={<RouteFallback />}>
        <AuthCallbackPage onLoginSuccess={handleLoginSuccess} />
      </Suspense>
    );
  }

  if (authConfig.auth_enabled && !user) {
    if (authConfig.auth_provider === "google" && !authConfig.google_client_id) {
      return <FullScreenMessage message="Error: Missing Google Client ID in backend configuration." isError />;
    }

    return (
      <Suspense fallback={<RouteFallback />}>
        <LoginPage
          authProvider={authConfig.auth_provider}
          googleClientId={authConfig.google_client_id}
          onLoginSuccess={handleLoginSuccess}
          devMode={authConfig.dev_mode}
          workspaceName={authConfig.workspace_name}
          initialError={authError}
        />
      </Suspense>
    );
  }

  if (!user) {
    return <FullScreenMessage message={authError || "Failed to resolve current user."} isError />;
  }

  return (
    <BrowserRouter>
      <Toaster richColors position="top-right" />
      <Routes>
        <Route
          path="/"
          element={
            <div className="min-h-screen bg-background text-foreground">
              <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
                <div className="grid h-16 grid-cols-[auto_1fr_auto] items-center gap-4 px-3 md:px-4">
                  <div className="flex items-center gap-2 text-primary">
                    <img src={prismLogoMark} alt="KiCAD Prism Logo" className="h-7 w-7 object-contain" />
                    <span className="text-xl font-bold tracking-tight text-foreground">KiCAD Prism</span>
                  </div>

                  <div className="flex justify-center">
                    <div className="relative w-full max-w-2xl">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        value={workspaceSearchQuery}
                        onChange={(event) => setWorkspaceSearchQuery(event.target.value)}
                        placeholder="Search projects by name, description, and metadata"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {user.email !== "guest@local" ? (
                      <>
                        <span className="text-sm text-muted-foreground">
                          Welcome, {user.name} ({user.role})
                        </span>
                        <Button variant="ghost" size="sm" onClick={handleLogout}>
                          Logout
                        </Button>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">Viewing as Guest</span>
                    )}
                  </div>
                </div>
              </header>

              <main className="h-[calc(100vh-4rem)]">
                <Suspense fallback={<RouteFallback />}>
                  <Workspace searchQuery={deferredWorkspaceSearchQuery} user={user} authConfig={authConfig} />
                </Suspense>
              </main>
            </div>
          }
        />
        <Route
          path="/project/:projectId"
          element={
            <Suspense fallback={<RouteFallback />}>
              <ProjectDetailPage user={user} />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
