import React, { Suspense, lazy, memo } from "react";
import { WatchlistProvider, useWatchlistContext } from "./contexts/WatchlistContext";
import { UIProvider, useUIContext } from "./contexts/UIContext";
import { DiscoverProvider } from "./contexts/DiscoverContext";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { AuthPage } from "./pages/AuthPage";
import { SearchBar } from "./components/common/SearchBar";
import { LoadingPosterAnimation } from "./components/common/LoadingPosterAnimation";
import { BottomNavBar } from "./components/layout/BottomNavBar";
import { SideNavBar } from "./components/layout/SideNavBar";
import { MediaGrid } from "./components/media/MediaGrid";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { getTVSeasonDetails } from "./services/tmdbService";
import { DiscoverPage } from "./pages/DiscoverPage";
import { ListsPage } from "./pages/ListsPage";
import { RecommendationsPage } from "./pages/RecommendationsPage";

// Lazy load heavy modal components
const MediaDetailModal = lazy(() =>
  import("./components/media/MediaDetailModal").then((module) => ({
    default: module.MediaDetailModal,
  }))
);
const SettingsModal = lazy(() =>
  import("./components/features/SettingsModal").then((module) => ({
    default: module.SettingsModal,
  }))
);

// Loading fallback for modals
const ModalLoadingFallback: React.FC = () => (
  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
    <div className="animate-pulse text-white text-lg">Loading...</div>
  </div>
);

// Header component
const Header: React.FC = memo(() => {
  const { handleSearch, isSearchLoading, isSearchExpanded, setIsSearchExpanded, openSettings } = useUIContext();

  return (
    <header className="sticky top-0 z-20 bg-brand-bg/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Desktop Header */}
        <div className="hidden sm:flex w-full items-center justify-between">
          <div className="lg:hidden text-3xl font-black tracking-tighter text-white">
            Scene<span className="text-brand-secondary">Stack</span>
          </div>
          <div className="w-full max-w-sm flex items-center gap-2 ml-auto">
            <div className="flex-grow">
              <SearchBar onSearch={handleSearch} isLoading={isSearchLoading} />
            </div>
            <button
              onClick={openSettings}
              className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light hover:bg-brand-surface transition-colors flex-shrink-0"
              aria-label="Open settings"
            >
              <SettingsIcon />
            </button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="flex sm:hidden w-full items-center justify-between">
          {isSearchExpanded ? (
            <div className="flex w-full items-center gap-2">
              <button
                onClick={() => handleSearch("")}
                className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light"
                aria-label="Close search"
              >
                <BackIcon />
              </button>
              <div className="flex-grow">
                <SearchBar
                  onSearch={handleSearch}
                  isLoading={isSearchLoading}
                  isExpanded={isSearchExpanded}
                />
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-black tracking-tighter text-white">
                Scene<span className="text-brand-secondary">Stack</span>
              </h1>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsSearchExpanded(true)}
                  className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light"
                  aria-label="Open search"
                >
                  <SearchIcon />
                </button>
                <button
                  onClick={openSettings}
                  className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light hover:bg-brand-surface transition-colors flex-shrink-0"
                  aria-label="Open settings"
                >
                  <SettingsIcon />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
});

Header.displayName = "Header";

// Icon components
const SettingsIcon: React.FC = () => (
  <svg
    className="h-6 w-6"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const SearchIcon: React.FC = () => (
  <svg
    className="h-6 w-6"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const BackIcon: React.FC = () => (
  <svg
    className="h-6 w-6"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);

// Main content component
const MainContent: React.FC = memo(() => {
  const { activeTab, searchResults, selectedMediaId, handleSelectMedia, error } = useUIContext();
  const { watchlistIds, isLoading: isDbLoading } = useWatchlistContext();

  return (
    <main className="pb-24 lg:pb-0">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {searchResults.length > 0 ? (
          <section>
            <h2 className="text-3xl font-bold mb-6 text-brand-text-light">Search Results</h2>
            <MediaGrid
              mediaItems={searchResults}
              onCardClick={handleSelectMedia}
              watchlistIds={watchlistIds}
              selectedMediaId={selectedMediaId}
            />
          </section>
        ) : isDbLoading ? (
          <div className="text-center py-20 text-brand-text-dim">
            <p>Loading your watchlist...</p>
          </div>
        ) : (
          <>
            {activeTab === "discover" && <DiscoverPage />}
            {activeTab === "lists" && <ListsPage />}
            {activeTab === "recommendations" && <RecommendationsPage />}
          </>
        )}
      </div>
    </main>
  );
});

MainContent.displayName = "MainContent";

// Modals component with lazy loading
const Modals: React.FC = () => {
  const {
    detailedMedia,
    animatingMedia,
    handleCloseModal,
    isSettingsOpen,
    closeSettings,
    handleSearch,
  } = useUIContext();
  const {
    watchlist,
    watchlistIds,
    toggleWatchlist,
    toggleMovieWatched,
    toggleEpisodeWatched,
    toggleSeasonWatched,
    updateTags,
    exportWatchlist,
    importWatchlist,
  } = useWatchlistContext();

  return (
    <>
      {animatingMedia && !detailedMedia && (
        <LoadingPosterAnimation media={animatingMedia.media} rect={animatingMedia.rect} />
      )}

      {detailedMedia && (
        <Suspense fallback={<ModalLoadingFallback />}>
          <MediaDetailModal
            media={detailedMedia}
            watchlistIds={watchlistIds}
            onClose={handleCloseModal}
            onToggleWatchlist={toggleWatchlist}
            onToggleMovieWatched={toggleMovieWatched}
            onToggleEpisodeWatched={toggleEpisodeWatched}
            getSeasonDetails={getTVSeasonDetails}
            watchlistItem={watchlist.find((item) => item.id === detailedMedia.id)}
            onSearch={handleSearch}
            onToggleSeasonWatched={toggleSeasonWatched}
            onUpdateTags={updateTags}
          />
        </Suspense>
      )}

      <Suspense fallback={null}>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={closeSettings}
          onExport={exportWatchlist}
          onImport={importWatchlist}
        />
      </Suspense>
    </>
  );
};

// App layout component
const AppLayout: React.FC = () => {
  const { activeTab, setActiveTab, searchResults } = useUIContext();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage("sidebarCollapsed", false);

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-light font-sans">
      <SideNavBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      <div
        className={`transition-all duration-300 ease-in-out ${isSidebarCollapsed ? "lg:pl-20" : "lg:pl-64"
          }`}
      >
        <Header />
        <MainContent />
      </div>

      {searchResults.length === 0 && (
        <BottomNavBar activeTab={activeTab} onTabChange={setActiveTab} />
      )}

      <Modals />
    </div>
  );
};

// Main App component
const App: React.FC = () => {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
};

// Renders either AuthPage or the main app based on auth state
const AuthenticatedApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="animate-pulse text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return (
    <WatchlistProvider>
      <UIProvider>
        <DiscoverProvider>
          <AppLayout />
        </DiscoverProvider>
      </UIProvider>
    </WatchlistProvider>
  );
};

export default App;
