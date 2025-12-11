import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useEffect,
    useMemo,
    type ReactNode,
} from "react";
import { searchMedia, getMovieDetails, getTVDetails } from "../services/tmdbService";
import type { SearchResult, MovieDetail, TVDetail, Media } from "../types/types";

interface UIContextType {
    activeTab: "discover" | "lists" | "recommendations" | "stats";
    setActiveTab: (tab: "discover" | "lists" | "recommendations" | "stats") => void;

    searchResults: SearchResult[];
    isSearchLoading: boolean;
    isSearchExpanded: boolean;
    setIsSearchExpanded: (expanded: boolean) => void;
    handleSearch: (query: string) => void;

    selectedMediaId: string | null;
    detailedMedia: MovieDetail | TVDetail | null;
    animatingMedia: { media: Media; rect: DOMRect } | null;
    handleSelectMedia: (media: Media, rect: DOMRect) => Promise<void>;
    handleCloseModal: () => void;

    isSettingsOpen: boolean;
    openSettings: () => void;
    closeSettings: () => void;

    viewAllSection: { title: string; items: Media[] } | null;
    openViewAll: (title: string, items: Media[]) => void;
    closeViewAll: () => void;

    error: string | null;
    setError: (error: string | null) => void;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [activeTab, setActiveTab] = useState<"discover" | "lists" | "recommendations" | "stats">("discover");


    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);
    const [detailedMedia, setDetailedMedia] = useState<MovieDetail | TVDetail | null>(null);
    const [animatingMedia, setAnimatingMedia] = useState<{ media: Media; rect: DOMRect } | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [viewAllSection, setViewAllSection] = useState<{ title: string; items: Media[] } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const performSearch = useCallback(async (query: string) => {
        if (!query) {
            setSearchResults([]);
            return;
        }
        setIsSearchLoading(true);
        setError(null);
        try {
            const results = await searchMedia(query);
            setSearchResults(results.filter((r) => r.poster_path));
        } catch (err) {
            setError("Failed to fetch search results. Please try again.");
            console.error(err);
        } finally {
            setIsSearchLoading(false);
        }
    }, []);

    const handleSearch = useCallback(
        (query: string) => {
            const url = new URL(window.location.toString());
            if (query) {
                url.searchParams.set("q", query);
            } else {
                url.searchParams.delete("q");
                setIsSearchExpanded(false);
            }
            window.history.pushState({}, "", url);
            performSearch(query);
        },
        [performSearch]
    );

    // Consolidate all popstate handling into one effect to prevent race conditions
    useEffect(() => {
        const handlePopState = () => {
            const params = new URLSearchParams(window.location.search);
            const query = params.get("q") || "";
            performSearch(query);
            if (!query) {
                setIsSearchExpanded(false);
            }
            const hash = window.location.hash;
            if (!hash.startsWith("#media/") && !hash.startsWith("#settings") && !hash.startsWith("#viewall/")) {
                setSelectedMediaId(null);
                setDetailedMedia(null);
                setAnimatingMedia(null);
                setIsSettingsOpen(false);
                setViewAllSection(null);
            }
        };

        window.addEventListener("popstate", handlePopState);

        // Initial State Checks
        const initialParams = new URLSearchParams(window.location.search);
        const initialQuery = initialParams.get("q");
        if (initialQuery) {
            performSearch(initialQuery);
            setIsSearchExpanded(true);
        }

        // Cleanup invalid hashes on mount
        const hash = window.location.hash;
        if (hash.startsWith("#media/") || hash === "#settings" || hash.startsWith("#viewall/")) {
            // Replace invalid initial hash states with clean URL
            window.history.replaceState(
                null,
                "",
                window.location.pathname + window.location.search
            );
        }

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
    }, [performSearch]);

    const handleSelectMedia = useCallback(
        async (media: Media, rect: DOMRect) => {
            if (animatingMedia) return;

            window.history.pushState(
                { modal: "mediaDetail" },
                "",
                `#media/${media.media_type}/${media.id}`
            );

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
                window.history.back();
            }
        },
        [animatingMedia]
    );

    const handleCloseModal = useCallback(() => {
        setAnimatingMedia(null);
        setSelectedMediaId(null);
        setDetailedMedia(null);
        window.history.back();
    }, []);

    const openSettings = useCallback(() => {
        window.history.pushState({ modal: "settings" }, "", "#settings");
        setIsSettingsOpen(true);
    }, []);

    const closeSettings = useCallback(() => {
        window.history.back();
    }, []);

    const openViewAll = useCallback((title: string, items: Media[]) => {
        const sectionSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        window.history.pushState({ viewAll: sectionSlug }, "", `#viewall/${sectionSlug}`);
        setViewAllSection({ title, items });
    }, []);

    const closeViewAll = useCallback(() => {
        window.history.back();
    }, []);

    const value = useMemo(
        () => ({
            activeTab,
            setActiveTab,
            searchResults,
            isSearchLoading,
            isSearchExpanded,
            setIsSearchExpanded,
            handleSearch,
            selectedMediaId,
            detailedMedia,
            animatingMedia,
            handleSelectMedia,
            handleCloseModal,
            isSettingsOpen,
            openSettings,
            closeSettings,
            viewAllSection,
            openViewAll,
            closeViewAll,
            error,
            setError,
        }),
        [
            activeTab,
            searchResults,
            isSearchLoading,
            isSearchExpanded,
            handleSearch,
            selectedMediaId,
            detailedMedia,
            animatingMedia,
            handleSelectMedia,
            handleCloseModal,
            isSettingsOpen,
            openSettings,
            closeSettings,
            viewAllSection,
            openViewAll,
            closeViewAll,
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
