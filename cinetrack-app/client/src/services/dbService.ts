import type { WatchlistItem } from "../types/types";
import { getAuthToken } from "../contexts/AuthContext";

// API requests use relative URLs - Vite proxy handles forwarding in dev
const API_BASE_URL = '/api';

const apiFetch = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "An unknown error occurred" }));
    console.error("API Error:", errorData);
    throw new Error(
      errorData.message || `Request failed with status ${response.status}`
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
};

export const getAllWatchlistItems = async (): Promise<WatchlistItem[]> => {
  return apiFetch<WatchlistItem[]>("/watchlist");
};

export const getWatchlistItem = async (
  id: number
): Promise<WatchlistItem | undefined> => {
  try {
    return await apiFetch<WatchlistItem>(`/watchlist/${id}`);
  } catch (error) {
    if (error instanceof Error && error.message.includes("404")) {
      return undefined;
    }
    console.error(`Failed to get item ${id}:`, error);
    throw error;
  }
};

export const putWatchlistItem = async (
  item: WatchlistItem
): Promise<number> => {
  const savedItem = await apiFetch<WatchlistItem>("/watchlist", {
    method: "PUT",
    body: JSON.stringify(item),
  });
  return savedItem.id;
};

export const deleteWatchlistItem = async (id: number): Promise<void> => {
  await apiFetch<void>(`/watchlist/${id}`, {
    method: "DELETE",
  });
};

export const clearAndBulkPut = async (
  items: WatchlistItem[]
): Promise<void> => {
  await apiFetch<void>("/watchlist/import", {
    method: "POST",
    body: JSON.stringify(items),
  });
};

export type WatchlistStatus = "watchlist" | "watching" | "watched";

interface PaginatedResponse {
  items: WatchlistItem[];
  hasMore: boolean;
  page: number;
  totalCount: number;
}

export const getWatchlistByStatus = async (
  status: WatchlistStatus,
  page = 1,
  limit = 20
): Promise<PaginatedResponse> => {
  return apiFetch<PaginatedResponse>(
    `/watchlist/by-status/${status}?page=${page}&limit=${limit}`
  );
};

interface RecommendationsResponse {
  recommendations: import("../types/types").SearchResult[];
}

export const getRecommendations = async (
  refresh = false
): Promise<RecommendationsResponse> => {
  return apiFetch<RecommendationsResponse>(
    `/watchlist/recommendations${refresh ? "?refresh=true" : ""}`
  );
};
