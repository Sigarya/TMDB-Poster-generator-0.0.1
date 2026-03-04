const BASE_URL = 'https://www.omdbapi.com/';

export interface OMDBRating {
  Source: string;
  Value: string;
}

export interface OMDBResponse {
  Response: string;
  Ratings?: OMDBRating[];
  imdbID?: string;
  Title?: string;
  Year?: string;
  Error?: string;
}

export class OMDBService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async fetch<T>(params: Record<string, string>): Promise<T> {
    const url = new URL(BASE_URL);
    url.searchParams.append('apikey', this.apiKey);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`OMDB API Error: ${response.statusText}`);
    }
    return response.json();
  }

  async getRatings(imdbId: string) {
    return this.fetch<OMDBResponse>({ i: imdbId, plot: 'short' });
  }

  async searchFuzzy(title: string, year?: string) {
    const params: Record<string, string> = { s: title };
    if (year) params.y = year;
    return this.fetch<{ Search?: { Title: string; Year: string; imdbID: string }[]; Response: string }>({ ...params });
  }
}
