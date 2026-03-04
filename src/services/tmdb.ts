const BASE_URL = 'https://api.themoviedb.org/3';

export interface TMDBConfig {
  apiKey: string;
}

export interface TMDBItem {
  id: number;
  title?: string;
  name?: string;
  overview: string;
  backdrop_path: string | null;
  poster_path: string | null;
  vote_average: number;
  release_date?: string;
  first_air_date?: string;
  genre_ids: number[];
  original_language: string;
  origin_country?: string[];
  media_type?: 'movie' | 'tv';
}

export interface TMDBDetails extends TMDBItem {
  imdb_id?: string;
  external_ids?: {
    imdb_id?: string;
  };
  runtime?: number;
  episode_run_time?: number[];
  number_of_seasons?: number;
  genres: { id: number; name: string }[];
}

export interface TMDBCredits {
  cast: {
    id: number;
    name: string;
    character: string;
    profile_path: string | null;
  }[];
  crew: {
    id: number;
    name: string;
    job: string;
    department: string;
  }[];
}

export interface TMDBImages {
  logos: {
    file_path: string;
    iso_639_1: string;
  }[];
}

export class TMDBService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${BASE_URL}${endpoint}`);
    url.searchParams.append('api_key', this.apiKey);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`TMDB API Error: ${response.statusText}`);
    }
    return response.json();
  }

  async getGenres(type: 'movie' | 'tv') {
    return this.fetch<{ genres: { id: number; name: string }[] }>(`/genre/${type}/list`);
  }

  async getTrending(type: 'movie' | 'tv', timeWindow: 'day' | 'week' = 'day') {
    return this.fetch<{ results: TMDBItem[] }>(`/trending/${type}/${timeWindow}`);
  }

  async getPopular(type: 'movie' | 'tv') {
    return this.fetch<{ results: TMDBItem[] }>(`/${type}/popular`);
  }

  async getNowPlaying() {
    return this.fetch<{ results: TMDBItem[] }>(`/movie/now_playing`);
  }

  async getOnTheAir() {
    return this.fetch<{ results: TMDBItem[] }>(`/tv/on_the_air`);
  }

  async getTopRated(type: 'movie' | 'tv') {
    return this.fetch<{ results: TMDBItem[] }>(`/${type}/top_rated`);
  }

  async getDetails(type: 'movie' | 'tv', id: number) {
    return this.fetch<TMDBDetails>(`/${type}/${id}`, { append_to_response: 'external_ids' });
  }

  async getCredits(type: 'movie' | 'tv', id: number) {
    return this.fetch<TMDBCredits>(`/${type}/${id}/credits`);
  }

  async getImages(type: 'movie' | 'tv', id: number) {
    return this.fetch<TMDBImages>(`/${type}/${id}/images`, { include_image_language: 'en,null' });
  }
}
