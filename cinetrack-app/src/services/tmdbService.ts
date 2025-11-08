import { TMDB_API_BASE_URL } from "../constants";
import type {
  SearchResult,
  MovieDetail,
  TVDetail,
  SeasonDetail,
  WatchProvidersResponse,
} from "../types";

const TMDB_API_READ_ACCESS_TOKEN = import.meta.env.VITE_TMDB_API_READ_ACCESS_TOKEN;

const fetchFromTMDB = async <T>(endpoint: string): Promise<T> => {
  const url = `${TMDB_API_BASE_URL}/${endpoint}`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      Authorization: `Bearer ${TMDB_API_READ_ACCESS_TOKEN}`,
    },
  };

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})); // try to get more info from body
    console.error("TMDB API Error:", errorData);
    throw new Error(`TMDB API request failed: ${response.statusText}`);
  }
  return response.json();
};

export const searchMedia = async (query: string): Promise<SearchResult[]> => {
  const data = await fetchFromTMDB<{ results: SearchResult[] }>(
    `search/multi?query=${encodeURIComponent(query)}`
  );
  // Filter out people from search results
  return data.results.filter(
    (item) => item.media_type === "movie" || item.media_type === "tv"
  );
};

export const getTrendingMedia = async (): Promise<SearchResult[]> => {
  const data = await fetchFromTMDB<{ results: SearchResult[] }>(
    `trending/all/week`
  );
  // Filter out people from results, which the 'all' endpoint might include
  return data.results.filter(
    (item) => item.media_type === "movie" || item.media_type === "tv"
  );
};

export const getPopularMovies = async (): Promise<SearchResult[]> => {
  const data = await fetchFromTMDB<{
    results: Omit<SearchResult, "media_type">[];
  }>(`movie/popular`);
  // Explicitly add media_type as it might be missing from this endpoint
  return data.results.map((item) => ({ ...item, media_type: "movie" }));
};

export const getPopularTVShows = async (): Promise<SearchResult[]> => {
  const data = await fetchFromTMDB<{
    results: Omit<SearchResult, "media_type">[];
  }>(`tv/popular`);
  // Explicitly add media_type as it might be missing from this endpoint
  return data.results.map((item) => ({ ...item, media_type: "tv" }));
};

export const getMovieDetails = async (id: number): Promise<MovieDetail> => {
  const details = await fetchFromTMDB<Omit<MovieDetail, "media_type">>(
    `movie/${id}?append_to_response=videos,credits`
  );
  return { ...details, media_type: "movie" };
};

export const getTVDetails = async (id: number): Promise<TVDetail> => {
  const details = await fetchFromTMDB<Omit<TVDetail, "media_type">>(
    `tv/${id}?append_to_response=videos,credits`
  );
  return { ...details, media_type: "tv" };
};

export const getTVSeasonDetails = async (
  tvId: number,
  seasonNumber: number
): Promise<SeasonDetail> => {
  return fetchFromTMDB<SeasonDetail>(`tv/${tvId}/season/${seasonNumber}`);
};

export const getWatchProviders = async (
  id: number,
  media_type: "movie" | "tv"
): Promise<WatchProvidersResponse> => {
  return fetchFromTMDB<WatchProvidersResponse>(
    `${media_type}/${id}/watch/providers`
  );
};

export const getMovieRecommendations = async (
  id: number
): Promise<SearchResult[]> => {
  const data = await fetchFromTMDB<{
    results: Omit<SearchResult, "media_type">[];
  }>(`movie/${id}/recommendations`);
  // Explicitly add media_type as it might be missing from this endpoint
  return data.results.map((item) => ({ ...item, media_type: "movie" }));
};

export const getTVRecommendations = async (
  id: number
): Promise<SearchResult[]> => {
  const data = await fetchFromTMDB<{
    results: Omit<SearchResult, "media_type">[];
  }>(`tv/${id}/recommendations`);
  // Explicitly add media_type as it might be missing from this endpoint
  return data.results.map((item) => ({ ...item, media_type: "tv" }));
};
