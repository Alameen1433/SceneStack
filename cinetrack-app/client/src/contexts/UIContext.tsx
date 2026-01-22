import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { searchMedia, getMovieDetails, getTVDetails } from "../services/tmdbService";
import type { SearchResult, MovieDetail, TVDetail, Media } from "../types/types";

interface UIContextType {
  searchResults: SearchResult[];
  isSearchLoading: boolean;
  setIsSearchLoading: (loading: boolean) => void;
  isSearchExpanded: boolean;
  setIsSearchExpanded: (expanded: boolean) => void;
  performSearch: (query: string) => Promise<void>;

  selectedMediaId: string | null;
  detailedMedia: MovieDetail | TVDetail | null;
  animatingMedia: { media: Media; rect: DOMRect } | null;
  handleSelectMedia: (media: Media, rect: DOMRect) => Promise<void>;
  handleCloseModal: () => void;

  isSettingsOpen: boolean;
  openSettings: () => void;
  closeSettings: () => void;

  isNotificationsOpen: boolean;
  openNotifications: () => void;
  closeNotifications: () => void;

  error: string | null;
  setError: (error: string | null) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
  const [detailedMedia, setDetailedMedia] = useState<MovieDetail | TVDetail | null>(null);
  const [animatingMedia, setAnimatingMedia] = useState<{ media: Media; rect: DOMRect } | null>(
    null
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const modalHistoryPushed = useRef(false);

  const clearModalState = useCallback(() => {
    setAnimatingMedia(null);
    setSelectedMediaId(null);
    setDetailedMedia(null);
    modalHistoryPushed.current = false;
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (detailedMedia || animatingMedia) {
        clearModalState();
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [detailedMedia, animatingMedia, clearModalState]);

  const performSearch = useCallback(async (query: string) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
    setError(null);
    try {
      const results = await searchMedia(query);
      setSearchResults(results.filter((r) => r.poster_path));
    } catch (err) {
      setError("Failed to fetch search results. Please try again.");
      console.error(err);
    }
  }, []);

  const handleSelectMedia = useCallback(
    async (media: Media, rect: DOMRect) => {
      if (animatingMedia) return;

      window.history.pushState({ modal: "media" }, "");
      modalHistoryPushed.current = true;

      setAnimatingMedia({ media, rect });
      setSelectedMediaId(`${media.media_type}-${media.id}`);
      setError(null);
      setDetailedMedia(null);

      try {
        let details: MovieDetail | TVDetail;
        if (media.media_type === "movie") {
          details = await getMovieDetails(media.id);
        } else {
          details = await getTVDetails(media.id);
        }
        setDetailedMedia(details);
        setAnimatingMedia(null);
      } catch (err) {
        setError("Failed to fetch media details.");
        console.error(err);
        setAnimatingMedia(null);
        if (modalHistoryPushed.current) {
          window.history.back();
        }
      }
    },
    [animatingMedia]
  );

  const handleCloseModal = useCallback(() => {
    if (modalHistoryPushed.current) {
      window.history.back();
    } else {
      clearModalState();
    }
  }, [clearModalState]);

  const openSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  const openNotifications = useCallback(() => {
    setIsNotificationsOpen(true);
  }, []);

  const closeNotifications = useCallback(() => {
    setIsNotificationsOpen(false);
  }, []);

  const value = useMemo(
    () => ({
      searchResults,
      isSearchLoading,
      setIsSearchLoading,
      isSearchExpanded,
      setIsSearchExpanded,
      performSearch,
      selectedMediaId,
      detailedMedia,
      animatingMedia,
      handleSelectMedia,
      handleCloseModal,
      isSettingsOpen,
      openSettings,
      closeSettings,
      isNotificationsOpen,
      openNotifications,
      closeNotifications,
      error,
      setError,
    }),
    [
      searchResults,
      isSearchLoading,
      isSearchExpanded,
      performSearch,
      selectedMediaId,
      detailedMedia,
      animatingMedia,
      handleSelectMedia,
      handleCloseModal,
      isSettingsOpen,
      openSettings,
      closeSettings,
      isNotificationsOpen,
      openNotifications,
      closeNotifications,
      error,
    ]
  );

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUIContext = (): UIContextType => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error("useUIContext must be used within a UIProvider");
  }
  return context;
};
