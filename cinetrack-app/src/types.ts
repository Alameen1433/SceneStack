export interface SearchResult {
  id: number;
  title?: string; // Movies have 'title'
  name?: string; // TV shows have 'name'
  overview: string;
  poster_path: string | null;
  media_type: "movie" | "tv";
  release_date?: string; // Movie
  first_air_date?: string; // TV
}

export interface CastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
}

export interface Video {
  id: string;
  key: string;
  name: string;
  site: "YouTube" | string;
  type: "Trailer" | "Teaser" | string;
  official: boolean;
}

interface BaseMedia {
  id: number;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  genres: { id: number; name: string }[];
}

export interface MovieDetail extends BaseMedia {
  media_type: "movie";
  title: string;
  release_date: string;
  runtime: number;
  credits: {
    cast: CastMember[];
  };
  videos: {
    results: Video[];
  };
}

export interface TVDetail extends BaseMedia {
  media_type: "tv";
  name: string;
  first_air_date: string;
  last_air_date: string;
  status: string;
  seasons: {
    air_date: string;
    episode_count: number;
    id: number;
    name: string;
    overview: string;
    poster_path: string;
    season_number: number;
  }[];
  number_of_seasons: number;
  number_of_episodes: number;
  credits: {
    cast: CastMember[];
  };
  videos: {
    results: Video[];
  };
}

export type Media = SearchResult | WatchlistItem;

export interface MovieWatchlistItem extends MovieDetail {
  watched: boolean;
  tags?: string[];
}

export interface TVWatchlistItem extends TVDetail {
  watchedEpisodes: Record<number, number[]>; // { seasonNumber: [episodeNumber, ...] }
  tags?: string[];
}

export type WatchlistItem = MovieWatchlistItem | TVWatchlistItem;

export interface Episode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  air_date: string;
  still_path: string | null;
}

export interface SeasonDetail {
  _id: string;
  air_date: string;
  episodes: Episode[];
  name: string;
  overview: string;
  id: number;
  poster_path: string | null;
  season_number: number;
}

export interface WatchProvider {
  logo_path: string;
  provider_name: string;
  provider_id: number;
}

export interface WatchProviderCountry {
  link: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

export interface WatchProvidersResponse {
  id: number;
  results: Record<string, WatchProviderCountry>;
}
