import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
    type ReactNode,
} from "react";
import {
    getTrendingMedia,
    getPopularMovies,
    getPopularTVShows,
} from "../services/tmdbService";
import type { SearchResult } from "../types/types";

interface DiscoverContextType {
    trending: SearchResult[];
    popularMovies: SearchResult[];
    popularTV: SearchResult[];
    isLoading: boolean;
    error: string | null;
}

const DiscoverContext = createContext<DiscoverContextType | undefined>(
    undefined
);

export const DiscoverProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [trending, setTrending] = useState<SearchResult[]>([]);
    const [popularMovies, setPopularMovies] = useState<SearchResult[]>([]);
    const [popularTV, setPopularTV] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDiscoverData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [trendingResults, popularMoviesResults, popularTVResults] =
                    await Promise.all([
                        getTrendingMedia(),
                        getPopularMovies(),
                        getPopularTVShows(),
                    ]);
                setTrending(trendingResults.filter((r) => r.poster_path));
                setPopularMovies(popularMoviesResults.filter((r) => r.poster_path));
                setPopularTV(popularTVResults.filter((r) => r.poster_path));
            } catch (err) {
                setError("Failed to fetch discover content. Please try again later.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDiscoverData();
    }, []);

    const value = useMemo(
        () => ({
            trending,
            popularMovies,
            popularTV,
            isLoading,
            error,
        }),
        [trending, popularMovies, popularTV, isLoading, error]
    );

    return (
        <DiscoverContext.Provider value={value}>
            {children}
        </DiscoverContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useDiscoverContext = (): DiscoverContextType => {
    const context = useContext(DiscoverContext);
    if (context === undefined) {
        throw new Error(
            "useDiscoverContext must be used within a DiscoverProvider"
        );
    }
    return context;
};
