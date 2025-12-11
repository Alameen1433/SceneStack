import { TMDB_API_BASE_URL } from "../constants/constants";
import type {
  SearchResult,
  MovieDetail,
  TVDetail,
  SeasonDetail,
  WatchProvidersResponse,
  LogoImage,
  WatchProvider,
  WatchProviderCountry,
} from "../types/types";

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
    const errorData = await response.json().catch(() => ({})); 
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
  return data.results.filter(
    (item) => item.media_type === "movie" || item.media_type === "tv"
  );
};

export const getPopularMovies = async (): Promise<SearchResult[]> => {
  const data = await fetchFromTMDB<{
    results: Omit<SearchResult, "media_type">[];
  }>(`movie/popular`);
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
    `movie/${id}?append_to_response=videos,credits,images`
  );
  return { ...details, media_type: "movie" };
};

export const getTVDetails = async (id: number): Promise<TVDetail> => {
  const details = await fetchFromTMDB<Omit<TVDetail, "media_type">>(
    `tv/${id}?append_to_response=videos,credits,images`
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
  return data.results.map((item) => ({ ...item, media_type: "movie" }));
};

export const getTVRecommendations = async (
  id: number
): Promise<SearchResult[]> => {
  const data = await fetchFromTMDB<{
    results: Omit<SearchResult, "media_type">[];
  }>(`tv/${id}/recommendations`);
  return data.results.map((item) => ({ ...item, media_type: "tv" }));
};

export const getMediaImages = async (
  id: number,
  media_type: "movie" | "tv"
) => {
  return fetchFromTMDB<{ logos: LogoImage[] }>(`${media_type}/${id}/images`);
};

export const getBestLogo = (logos?: LogoImage[]): LogoImage | null => {
  if (!logos || logos.length === 0) return null;

  let bestLogo = logos.find(
    (l) => l.iso_639_1 === "en" && l.file_path.endsWith(".svg")
  );
  if (bestLogo) return bestLogo;

  bestLogo = logos.find((l) => l.file_path.endsWith(".svg"));
  if (bestLogo) return bestLogo;

  bestLogo = logos.find((l) => l.iso_639_1 === "en");
  if (bestLogo) return bestLogo;

  return logos[0];
};

export const getBestTrailer = (videos?: { results: any[] }): any | null => {
  const videoList = videos?.results;
  if (!videoList) return null;

  const youtubeVideos = videoList.filter((v: any) => v.site === "YouTube");

  const officialTrailer = youtubeVideos.find(
    (v: any) => v.type === "Trailer" && v.official
  );
  if (officialTrailer) return officialTrailer;

  const anyTrailer = youtubeVideos.find((v: any) => v.type === "Trailer");
  if (anyTrailer) return anyTrailer;

  const officialTeaser = youtubeVideos.find(
    (v: any) => v.type === "Teaser" && v.official
  );
  if (officialTeaser) return officialTeaser;

  const anyTeaser = youtubeVideos.find((v: any) => v.type === "Teaser");
  if (anyTeaser) return anyTeaser;

  return null;
};

export const combineRentBuyProviders = (providers?: WatchProviderCountry | null): WatchProvider[] => {
  if (!providers) return [];

  const combined = new Map<number, WatchProvider>();

  (providers.rent || []).forEach((p) => {
    if (!combined.has(p.provider_id)) {
      combined.set(p.provider_id, p);
    }
  });

  (providers.buy || []).forEach((p) => {
    if (!combined.has(p.provider_id)) {
      combined.set(p.provider_id, p);
    }
  });

  return Array.from(combined.values());
};

// Logo Cache
const logoCache = new Map<number, string | null>();

import { selectBestLogo, getLogoUrl } from "../utils/logoHelpers";

export const getCachedLogo = (id: number): string | null | undefined => {
  return logoCache.get(id);
};

export const fetchAndCacheLogo = async (id: number, media_type: "movie" | "tv"): Promise<string | null> => {
  if (logoCache.has(id)) {
    return logoCache.get(id) || null;
  }

  try {
    const imageInfo = await getMediaImages(id, media_type);
    const bestLogo = selectBestLogo(imageInfo.logos);
    const url = getLogoUrl(bestLogo) || null;
    logoCache.set(id, url);
    return url;
  } catch (error) {
    logoCache.set(id, null);
    return null;
  }
};
