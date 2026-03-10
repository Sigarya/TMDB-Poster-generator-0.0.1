export const ASSETS = {
  BACKGROUND: 'https://raw.githubusercontent.com/nzk0/tmdb_omdb_bg/main/bckg.png',
  OVERLAY: 'https://raw.githubusercontent.com/nzk0/tmdb_omdb_bg/main/overlay.png',
  TMDB_LOGO: 'https://raw.githubusercontent.com/nzk0/tmdb_omdb_bg/main/tmdblogo.png',
  FRESH_TOMATO: 'https://raw.githubusercontent.com/nzk0/tmdb_omdb_bg/main/fresh_tomato.png',
  ROTTEN_TOMATO: 'https://raw.githubusercontent.com/nzk0/tmdb_omdb_bg/main/rotten_tomato.png',
  CERTIFIED_FRESH: 'https://raw.githubusercontent.com/nzk0/tmdb_omdb_bg/main/Certified_Fresh_2018.png',
  METACRITIC: 'https://raw.githubusercontent.com/nzk0/tmdb_omdb_bg/main/Metacritic_M.png',
  CAST_ICON: 'https://raw.githubusercontent.com/nzk0/tmdb_omdb_bg/main/1f3ad.png',
  DIRECTOR_ICON: 'https://raw.githubusercontent.com/nzk0/tmdb_omdb_bg/main/1f3ac.png',
  DIRECTOR_ICON_ALT: 'https://raw.githubusercontent.com/nzk0/tmdb_omdb_bg/main/1f3ac.png',
};

export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
export const OMDB_BASE_URL = 'https://www.omdbapi.com';
export const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/original';

export const DEFAULT_SETTINGS = {
  tmdbApiKey: '',
  omdbApiKey: '',
  excludedCountries: [] as string[],
  excludedGenres: [] as string[],
  excludedKeywords: [] as string[],
  includeTrendingDaily: true,
  includeTrendingWeekly: true,
  includePopular: true,
  includeNowPlaying: true,
  includeTopRated: true,
  includeTV: true,
  includeMovies: true,
  language: 'en-US',
  isRTL: false,
  strictCastLanguage: false,
  strictLogoLanguage: false,
};
