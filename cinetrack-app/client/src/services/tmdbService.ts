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

const API_BASE_URL = "/api/tmdb";

export class TMDBServiceError extends Error {
  public readonly statusCode: number;
  public readonly isNetworkError: boolean;

  constructor(message: string, statusCode = 0, isNetworkError = false) {
    super(message);
    this.name = "TMDBServiceError";
    this.statusCode = statusCode;
    this.isNetworkError = isNetworkError;
  }
}

const fetchFromProxy = async <T>(endpoint: string): Promise<T> => {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`);
  } catch {
    throw new TMDBServiceError(
      "Unable to connect to the server. Please check your internet connection.",
      0,
      true
    );
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new TMDBServiceError(
      errorData.message || `Request failed with status ${response.status}`,
      response.status
    );
  }

  return response.json();
};

export const searchMedia = async (query: string): Promise<SearchResult[]> => {
  const data = await fetchFromProxy<{ results: SearchResult[] }>(
    `/search?q=${encodeURIComponent(query)}`
  );
  return data.results;
};

interface DiscoverData {
  trending: SearchResult[];
  popularMovies: SearchResult[];
  popularTV: SearchResult[];
}

let cachedDiscover: DiscoverData | null = null;

const fetchDiscoverData = async (): Promise<DiscoverData> => {
  if (cachedDiscover) return cachedDiscover;

  const data = await fetchFromProxy<DiscoverData>("/discover");
  cachedDiscover = data;
  setTimeout(() => { cachedDiscover = null; }, 5 * 60 * 1000);
  return data;
};

export const getTrendingMedia = async (): Promise<SearchResult[]> => {
  const data = await fetchDiscoverData();
  return data.trending;
};

export const getPopularMovies = async (): Promise<SearchResult[]> => {
  const data = await fetchDiscoverData();
  return data.popularMovies;
};

export const getPopularTVShows = async (): Promise<SearchResult[]> => {
  const data = await fetchDiscoverData();
  return data.popularTV;
};

export const getMovieDetails = async (id: number): Promise<MovieDetail> => {
  return fetchFromProxy<MovieDetail>(`/details/movie/${id}`);
};

export const getTVDetails = async (id: number): Promise<TVDetail> => {
  return fetchFromProxy<TVDetail>(`/details/tv/${id}`);
};

export const getTVSeasonDetails = async (
  tvId: number,
  seasonNumber: number
): Promise<SeasonDetail> => {
  return fetchFromProxy<SeasonDetail>(`/season/${tvId}/${seasonNumber}`);
};

export const getWatchProviders = async (
  id: number,
  media_type: "movie" | "tv"
): Promise<WatchProvidersResponse> => {
  return fetchFromProxy<WatchProvidersResponse>(`/providers/${media_type}/${id}`);
};

export const getMovieRecommendations = async (
  id: number
): Promise<SearchResult[]> => {
  const data = await fetchFromProxy<{ results: SearchResult[] }>(
    `/recommendations/movie/${id}`
  );
  return data.results;
};

export const getTVRecommendations = async (
  id: number
): Promise<SearchResult[]> => {
  const data = await fetchFromProxy<{ results: SearchResult[] }>(
    `/recommendations/tv/${id}`
  );
  return data.results;
};

export const getMediaImages = async (
  id: number,
  media_type: "movie" | "tv"
) => {
  return fetchFromProxy<{ logos: LogoImage[] }>(`/images/${media_type}/${id}`);
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

export const getBestTrailer = (videos?: { results: { site: string; type: string; official: boolean; key: string }[] }): { site: string; type: string; official: boolean; key: string } | null => {
  const videoList = videos?.results;
  if (!videoList) return null;

  const youtubeVideos = videoList.filter((v) => v.site === "YouTube");

  const officialTrailer = youtubeVideos.find(
    (v) => v.type === "Trailer" && v.official
  );
  if (officialTrailer) return officialTrailer;

  const anyTrailer = youtubeVideos.find((v) => v.type === "Trailer");
  if (anyTrailer) return anyTrailer;

  const officialTeaser = youtubeVideos.find(
    (v) => v.type === "Teaser" && v.official
  );
  if (officialTeaser) return officialTeaser;

  const anyTeaser = youtubeVideos.find((v) => v.type === "Teaser");
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
  } catch {
    logoCache.set(id, null);
    return null;
  }
};
