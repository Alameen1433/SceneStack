import React, { Suspense, lazy } from "react";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { UIProvider } from "./contexts/UIContext";
import { DiscoverProvider } from "./contexts/DiscoverContext";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { DemoWelcomeModal } from "./components/common/DemoWelcomeModal";
import { useDemoWelcome } from "./hooks/useDemoWelcome";
import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { useWatchlistInit } from "./store/useWatchlistStore";

const AuthPage = lazy(() => import("./pages/AuthPage").then((m) => ({ default: m.AuthPage })));

const WatchlistInitializer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useWatchlistInit();
  return <>{children}</>;
};

const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const { showWelcome, closeWelcome } = useDemoWelcome(user?.isDemo);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 border-brand-primary/20 border-t-brand-primary animate-spin" />
          <p className="text-brand-text-dim animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="animate-fadeIn">
        <Suspense
          fallback={
            <div className="min-h-screen bg-brand-bg flex items-center justify-center">
              <div className="animate-pulse text-brand-text-dim">Loading...</div>
            </div>
          }
        >
          <AuthPage />
        </Suspense>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <WatchlistInitializer>
        <UIProvider>
          <DiscoverProvider>
            <RouterProvider router={router} />
          </DiscoverProvider>
        </UIProvider>
      </WatchlistInitializer>
      {showWelcome && <DemoWelcomeModal onClose={closeWelcome} />}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
