import React, { Suspense, lazy, memo } from "react";
import { WatchlistProvider, useWatchlistContext } from "./contexts/WatchlistContext";
import { UIProvider, useUIContext } from "./contexts/UIContext";
import { DiscoverProvider } from "./contexts/DiscoverContext";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { AuthPage } from "./pages/AuthPage";
import { SearchBar } from "./components/common/SearchBar";
import { SearchPalette } from "./components/common/SearchPalette";
import { LoadingPosterAnimation } from "./components/common/LoadingPosterAnimation";
import { BottomNavBar } from "./components/layout/BottomNavBar";
import { SideNavBar } from "./components/layout/SideNavBar";
import { MediaGrid } from "./components/media/MediaGrid";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { getTVSeasonDetails } from "./services/tmdbService";
import { DiscoverPage } from "./pages/DiscoverPage";
import { ListsPage } from "./pages/ListsPage";
import { RecommendationsPage } from "./pages/RecommendationsPage";
import { StatisticsPage } from "./pages/StatisticsPage";
import { ViewAllPage } from "./pages/ViewAllPage";

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
          {/* Tablet - Regular SearchBar */}
          <div className="lg:hidden w-full max-w-sm flex items-center gap-2 ml-auto">
            <div className="flex-grow">
              <SearchBar onSearch={handleSearch} isLoading={isSearchLoading} />
            </div>
            <a
              href="https://github.com/Alameen1433"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light hover:bg-brand-surface transition-colors flex-shrink-0"
              aria-label="View on GitHub"
            >
              <GitHubIcon />
            </a>
            <button
              className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light hover:bg-brand-surface transition-colors flex-shrink-0 relative"
              aria-label="Notifications"
            >
              <NotificationIcon />
              {/* Notification badge placeholder */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-primary rounded-full" />
            </button>
            <button
              onClick={openSettings}
              className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light hover:bg-brand-surface transition-colors flex-shrink-0"
              aria-label="Open settings"
            >
              <SettingsIcon />
            </button>
          </div>
          {/* Desktop - Command Palette Search */}
          <div className="hidden lg:flex w-full justify-center">
            <SearchPalette onSearch={handleSearch} isLoading={isSearchLoading} />
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
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsSearchExpanded(true)}
                  className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light"
                  aria-label="Open search"
                >
                  <SearchIcon />
                </button>
                <a
                  href="https://github.com/Alameen1433"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light"
                  aria-label="View on GitHub"
                >
                  <GitHubIcon />
                </a>
                <button
                  className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light relative"
                  aria-label="Notifications"
                >
                  <NotificationIcon />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-brand-primary rounded-full" />
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

const NotificationIcon: React.FC = () => (
  <svg
    className="h-6 w-6"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const GitHubIcon: React.FC = () => (
  <svg
    className="h-6 w-6"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
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
  const { activeTab, searchResults, selectedMediaId, handleSelectMedia, error, handleSearch, isSearchLoading } = useUIContext();
  const { watchlistIds, isLoading: isDbLoading } = useWatchlistContext();

  const handleBackToHome = () => {
    handleSearch("");
  };

  return (
    <main className="pb-24 lg:pb-0">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        {/* Search Loading State */}
        {isSearchLoading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-full border-2 border-brand-primary/20 border-t-brand-primary animate-spin" />
            </div>
            <p className="text-brand-text-dim animate-pulse">Searching...</p>
          </div>
        )}

        {/* Search Results */}
        {!isSearchLoading && searchResults.length > 0 ? (
          <section>
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={handleBackToHome}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-brand-text-dim hover:text-white hover:bg-white/10 transition-all"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span className="text-sm font-medium">Back</span>
              </button>
              <div className="h-6 w-px bg-white/10" />
              <h2 className="text-xl font-bold text-white">
                Search Results
                <span className="ml-2 text-sm font-normal text-brand-text-dim">
                  ({searchResults.length} found)
                </span>
              </h2>
            </div>
            <MediaGrid
              mediaItems={searchResults}
              onCardClick={handleSelectMedia}
              watchlistIds={watchlistIds}
              selectedMediaId={selectedMediaId}
            />
          </section>
        ) : !isSearchLoading && isDbLoading ? (
          <div className="text-center py-20 text-brand-text-dim">
            <p>Loading your watchlist...</p>
          </div>
        ) : !isSearchLoading && (
          <>
            {activeTab === "discover" && <DiscoverPage />}
            {activeTab === "lists" && <ListsPage />}
            {activeTab === "recommendations" && <RecommendationsPage />}
            {activeTab === "stats" && <StatisticsPage />}
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
  const { activeTab, setActiveTab, searchResults, openSettings, viewAllSection, closeViewAll, handleSearch } = useUIContext();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage("sidebarCollapsed", false);

  // Handle tab change - clear search results if any
  const handleTabChange = (tab: "discover" | "lists" | "recommendations" | "stats") => {
    if (searchResults.length > 0) {
      handleSearch(""); // Clear search results
    }
    setActiveTab(tab);
  };

  // If viewing all items in a section, render the ViewAllPage
  if (viewAllSection) {
    return (
      <div className="min-h-screen bg-brand-bg text-brand-text-light font-sans">
        <ViewAllPage
          title={viewAllSection.title}
          items={viewAllSection.items}
          onClose={closeViewAll}
        />
        <Modals />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-light font-sans">
      <SideNavBar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onOpenSettings={openSettings}
      />

      <div
        className={`transition-all duration-300 ease-out ${isSidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-60"
          }`}
      >
        <Header />
        <MainContent />
      </div>

      {searchResults.length === 0 && (
        <BottomNavBar activeTab={activeTab} onTabChange={handleTabChange} />
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
        <AuthPage />
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <WatchlistProvider>
        <UIProvider>
          <DiscoverProvider>
            <AppLayout />
          </DiscoverProvider>
        </UIProvider>
      </WatchlistProvider>
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

export default App;

