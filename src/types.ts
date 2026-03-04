export interface PosterData {
  title: string;
  backdropUrl: string;
  logoUrl?: string;
  plot: string;
  cast: string[];
  director?: string;
  ratings: {
    tmdb: number;
    rt?: string;
    metacritic?: string;
  };
  year: string;
  runtime?: string;
  genres: string[];
}
