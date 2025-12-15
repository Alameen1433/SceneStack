import React, { Suspense, lazy, memo, useMemo } from "react";
import { FiSettings, FiSearch, FiBell, FiGithub, FiArrowLeft } from "react-icons/fi";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { WatchlistProvider } from "./contexts/WatchlistContext";
import { useWatchlistStore, getWatchlistIds } from "./store/useWatchlistStore";
import { UIProvider, useUIContext } from "./contexts/UIContext";
import { DiscoverProvider } from "./contexts/DiscoverContext";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { SearchBar } from "./components/common/SearchBar";
import { SearchPalette } from "./components/common/SearchPalette";
import { NotificationsModal } from "./components/common/NotificationsModal";
import { LoadingPosterAnimation } from "./components/common/LoadingPosterAnimation";
import { BottomNavBar } from "./components/layout/BottomNavBar";
import { SideNavBar } from "./components/layout/SideNavBar";
import { MediaGrid } from "./components/media/MediaGrid";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { getTVSeasonDetails } from "./services/tmdbService";

const AuthPage = lazy(() => import("./pages/AuthPage").then(m => ({ default: m.AuthPage })));
const DiscoverPage = lazy(() => import("./pages/DiscoverPage").then(m => ({ default: m.DiscoverPage })));
const ListsPage = lazy(() => import("./pages/ListsPage").then(m => ({ default: m.ListsPage })));
const RecommendationsPage = lazy(() => import("./pages/RecommendationsPage").then(m => ({ default: m.RecommendationsPage })));
const StatisticsPage = lazy(() => import("./pages/StatisticsPage").then(m => ({ default: m.StatisticsPage })));
const ViewAllPage = lazy(() => import("./pages/ViewAllPage").then(m => ({ default: m.ViewAllPage })));

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
  const { handleSearch, isSearchLoading, isSearchExpanded, setIsSearchExpanded, openSettings, openNotifications } = useUIContext();

  return (
    <header className="sticky top-0 z-20 bg-brand-bg/80 backdrop-blur-lg">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Desktop Header */}
        <div className="hidden sm:flex w-full items-center justify-between">
          <div className="lg:hidden font-display text-3xl tracking-wide text-white">
            SCENE<span className="text-brand-primary">STACK</span>
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
              <FiGithub className="h-6 w-6" />
            </a>
            <button
              onClick={openNotifications}
              className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light hover:bg-brand-surface transition-colors flex-shrink-0 relative"
              aria-label="Notifications"
            >
              <FiBell className="h-6 w-6" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-brand-primary rounded-full" />
            </button>
            <button
              onClick={openSettings}
              className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light hover:bg-brand-surface transition-colors flex-shrink-0"
              aria-label="Open settings"
            >
              <FiSettings className="h-6 w-6" />
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
                <FiArrowLeft className="h-6 w-6" />
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
              <h1 className="font-display text-3xl tracking-wide text-white">
                SCENE<span className="text-brand-primary">STACK</span>
              </h1>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsSearchExpanded(true)}
                  className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light"
                  aria-label="Open search"
                >
                  <FiSearch className="h-6 w-6" />
                </button>
                <a
                  href="https://github.com/Alameen1433"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light"
                  aria-label="View on GitHub"
                >
                  <FiGithub className="h-6 w-6" />
                </a>
                <button
                  onClick={openNotifications}
                  className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light relative"
                  aria-label="Notifications"
                >
                  <FiBell className="h-6 w-6" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-brand-primary rounded-full" />
                </button>
                <button
                  onClick={openSettings}
                  className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light hover:bg-brand-surface transition-colors flex-shrink-0"
                  aria-label="Open settings"
                >
                  <FiSettings className="h-6 w-6" />
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

// Main content component
const MainContent: React.FC = memo(() => {
  const { activeTab, searchResults, selectedMediaId, handleSelectMedia, error, handleSearch, isSearchLoading } = useUIContext();
  const watchlist = useWatchlistStore(state => state.watchlist);
  const watchlistIds = useMemo(() => getWatchlistIds(watchlist), [watchlist]);
  const isDbLoading = useWatchlistStore(state => state.isLoading);

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
                <FiArrowLeft className="h-5 w-5" />
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
          <Suspense fallback={
            <div className="flex justify-center items-center py-20">
              <div className="animate-pulse text-brand-text-dim">Loading...</div>
            </div>
          }>
            {activeTab === "discover" && <DiscoverPage />}
            {activeTab === "lists" && <ListsPage />}
            {activeTab === "recommendations" && <RecommendationsPage />}
            {activeTab === "stats" && <StatisticsPage />}
          </Suspense>
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
    isNotificationsOpen,
    closeNotifications,
    handleSearch,
  } = useUIContext();
  const watchlist = useWatchlistStore(state => state.watchlist);
  const watchlistIds = useMemo(() => getWatchlistIds(watchlist), [watchlist]);
  const toggleWatchlist = useWatchlistStore(state => state.toggleWatchlist);
  const toggleMovieWatched = useWatchlistStore(state => state.toggleMovieWatched);
  const toggleEpisodeWatched = useWatchlistStore(state => state.toggleEpisodeWatched);
  const toggleSeasonWatched = useWatchlistStore(state => state.toggleSeasonWatched);
  const updateTags = useWatchlistStore(state => state.updateTags);
  const exportWatchlist = useWatchlistStore(state => state.exportWatchlist);
  const storeImportWatchlist = useWatchlistStore(state => state.importWatchlist);

  // Adapter for importWatchlist to match previous Context signature
  const handleImportWatchlist = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (window.confirm("Are you sure you want to overwrite your current watchlist? This action cannot be undone.")) {
        storeImportWatchlist(file);
      }
    }
    event.target.value = "";
  };

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
          onImport={handleImportWatchlist}
        />
      </Suspense>

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={closeNotifications}
      />
    </>
  );
};

// App layout component
const AppLayout: React.FC = () => {
  const { activeTab, setActiveTab, searchResults, openSettings, openNotifications, viewAllSection, closeViewAll, handleSearch } = useUIContext();
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
        <Suspense fallback={
          <div className="flex justify-center items-center min-h-screen">
            <div className="animate-pulse text-brand-text-dim">Loading...</div>
          </div>
        }>
          <ViewAllPage
            title={viewAllSection.title}
            items={viewAllSection.items}
            onClose={closeViewAll}
          />
        </Suspense>
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
        onOpenNotifications={openNotifications}
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
    <ErrorBoundary>
      <AuthProvider>
        <AuthenticatedApp />
      </AuthProvider>
    </ErrorBoundary>
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
        <Suspense fallback={
          <div className="min-h-screen bg-brand-bg flex items-center justify-center">
            <div className="animate-pulse text-brand-text-dim">Loading...</div>
          </div>
        }>
          <AuthPage />
        </Suspense>
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
