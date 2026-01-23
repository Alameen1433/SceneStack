import React, { Suspense, memo, useMemo } from "react";
import { Outlet, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { FiSettings, FiSearch, FiBell, FiGithub, FiArrowLeft } from "react-icons/fi";
import { useWatchlistStore, getWatchlistIds } from "../store/useWatchlistStore";
import { useNotificationStore } from "../store/useNotificationStore";
import { useUIContext } from "../contexts/UIContext";
import { SearchBar } from "../components/common/SearchBar";
import { SearchPalette } from "../components/common/SearchPalette";
import { NotificationsModal } from "../components/common/NotificationsModal";
import { LoadingPosterAnimation } from "../components/common/LoadingPosterAnimation";
import { BottomNavBar } from "../components/layout/BottomNavBar";
import { SideNavBar } from "../components/layout/SideNavBar";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { getTVSeasonDetails } from "../services/tmdbService";
import { ContextMenu } from "../components/overlay/ContextMenu";
import { Toaster } from "sonner";

const MediaDetailModal = React.lazy(() =>
  import("../components/media/MediaDetailModal").then((module) => ({
    default: module.MediaDetailModal,
  }))
);
const SettingsModal = React.lazy(() =>
  import("../components/features/SettingsModal").then((module) => ({
    default: module.SettingsModal,
  }))
);

const ModalLoadingFallback: React.FC = () => (
  <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
    <div className="animate-pulse text-white text-lg">Loading...</div>
  </div>
);

const Header: React.FC = memo(() => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const {
    isSearchLoading,
    isSearchExpanded,
    setIsSearchExpanded,
    openSettings,
    openNotifications,
    setIsSearchLoading,
    performSearch,
  } = useUIContext();

  const isOnSearchPage = location.pathname === "/search";
  const currentQuery = searchParams.get("q") || "";

  const handleSearch = (query: string) => {
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    } else {
      setIsSearchExpanded(false);
      if (isOnSearchPage) {
        navigate(-1);
      }
    }
  };

  const handleSearchSubmit = async (query: string) => {
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setIsSearchLoading(true);
      await performSearch(query);
      setIsSearchLoading(false);
    }
  };

  const unreadCount = useNotificationStore((state) => state.unreadCount);

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
            <div className="grow">
              <SearchBar onSearch={handleSearchSubmit} isLoading={isSearchLoading} />
            </div>
            <a
              href="https://github.com/Alameen1433"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light hover:bg-brand-surface transition-colors shrink-0"
              aria-label="View on GitHub"
            >
              <FiGithub className="h-6 w-6" />
            </a>
            <button
              onClick={openNotifications}
              className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light hover:bg-brand-surface transition-colors shrink-0 relative"
              aria-label="Notifications"
            >
              <FiBell className="h-6 w-6" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-brand-primary rounded-full border-2 border-brand-bg">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                </span>
              )}
            </button>
            <button
              onClick={openSettings}
              className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light hover:bg-brand-surface transition-colors shrink-0"
              aria-label="Open settings"
            >
              <FiSettings className="h-6 w-6" />
            </button>
          </div>
          {/* Desktop - Command Palette Search */}
          <div className="hidden lg:flex w-full justify-center">
            <SearchPalette onSearch={handleSearchSubmit} isLoading={isSearchLoading} />
          </div>
        </div>

        {/* Mobile Header */}
        <div className="flex sm:hidden w-full items-center justify-between">
          {isSearchExpanded || isOnSearchPage ? (
            <div className="flex w-full items-center gap-2">
              <button
                onClick={() => handleSearch("")}
                className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light"
                aria-label="Close search"
              >
                <FiArrowLeft className="h-6 w-6" />
              </button>
              <div className="grow">
                <SearchBar
                  onSearch={handleSearchSubmit}
                  isLoading={isSearchLoading}
                  isExpanded={true}
                  defaultValue={currentQuery}
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
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-brand-primary rounded-full border-2 border-brand-bg">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                    </span>
                  )}
                </button>
                <button
                  onClick={openSettings}
                  className="p-2 rounded-full text-brand-text-dim hover:text-brand-text-light hover:bg-brand-surface transition-colors shrink-0"
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

const Modals: React.FC = () => {
  const {
    detailedMedia,
    animatingMedia,
    handleCloseModal,
    isSettingsOpen,
    closeSettings,
    isNotificationsOpen,
    closeNotifications,
  } = useUIContext();
  const navigate = useNavigate();
  const watchlist = useWatchlistStore((state) => state.watchlist);
  const watchlistIds = useMemo(() => getWatchlistIds(watchlist), [watchlist]);
  const toggleWatchlist = useWatchlistStore((state) => state.toggleWatchlist);
  const toggleMovieWatched = useWatchlistStore((state) => state.toggleMovieWatched);
  const toggleEpisodeWatched = useWatchlistStore((state) => state.toggleEpisodeWatched);
  const toggleSeasonWatched = useWatchlistStore((state) => state.toggleSeasonWatched);
  const updateTags = useWatchlistStore((state) => state.updateTags);
  const exportWatchlist = useWatchlistStore((state) => state.exportWatchlist);
  const storeImportWatchlist = useWatchlistStore((state) => state.importWatchlist);

  const handleImportWatchlist = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (
        window.confirm(
          "Are you sure you want to overwrite your current watchlist? This action cannot be undone."
        )
      ) {
        storeImportWatchlist(file);
      }
    }
    event.target.value = "";
  };

  const handleSearchFromModal = (query: string) => {
    if (query) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
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
            onSearch={handleSearchFromModal}
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

      <NotificationsModal isOpen={isNotificationsOpen} onClose={closeNotifications} />
    </>
  );
};

const RootLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openSettings, openNotifications } = useUIContext();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useLocalStorage("sidebarCollapsed", false);

  const getActiveTab = (): "discover" | "lists" | "recommendations" | "stats" => {
    const path = location.pathname;
    if (path.startsWith("/lists")) return "lists";
    if (path.startsWith("/recommendations")) return "recommendations";
    if (path.startsWith("/stats")) return "stats";
    return "discover";
  };

  const handleTabChange = (tab: "discover" | "lists" | "recommendations" | "stats") => {
    const routes: Record<string, string> = {
      discover: "/",
      lists: "/lists",
      recommendations: "/recommendations",
      stats: "/stats",
    };
    navigate(routes[tab]);
  };

  const isOnSearchPage = location.pathname === "/search";

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text-light font-sans">
      <SideNavBar
        activeTab={getActiveTab()}
        onTabChange={handleTabChange}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        onOpenSettings={openSettings}
        onOpenNotifications={openNotifications}
      />

      <div
        className={`transition-all duration-300 ease-out ${
          isSidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-60"
        }`}
      >
        <Header />
        <main className="pb-24 lg:pb-0">
          <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <Suspense
              fallback={
                <div className="flex justify-center items-center py-20">
                  <div className="animate-pulse text-brand-text-dim">Loading...</div>
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>

      {!isOnSearchPage && <BottomNavBar activeTab={getActiveTab()} onTabChange={handleTabChange} />}

      <Modals />
      <ContextMenu />
      <Toaster
        position="bottom-center"
        offset={96}
        toastOptions={{
          className: "bg-brand-surface text-brand-text-light border border-brand-primary/20",
          duration: 3000,
        }}
      />
    </div>
  );
};

export default RootLayout;
