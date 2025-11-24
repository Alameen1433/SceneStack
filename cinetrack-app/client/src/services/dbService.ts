import type { WatchlistItem } from "../types/types";

// This should point to your backend server.
// For local development, this should be 'http://localhost:3001/api'.
// In production, this would be your deployed backend URL.

// Dynamically set the API host based on where the frontend is served.
// In production (served by backend), use relative path.
// In development (Vite dev server), use localhost:3001.
const API_BASE_URL = import.meta.env.PROD ? '/api' : 'http://localhost:3001/api';

const apiFetch = async <T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
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

  // For 204 No Content, response.json() will fail.
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
    // If the item is not found (404), the API fetch will throw.
    // We can check the message or just return undefined for simplicity.
    if (error instanceof Error && error.message.includes("404")) {
      return undefined;
    }
    console.error(`Failed to get item ${id}:`, error);
    // Re-throw other errors
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
