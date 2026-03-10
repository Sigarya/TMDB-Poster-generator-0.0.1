import { TMDB_BASE_URL } from './constants';

export async function fetchTMDB(endpoint: string, apiKey: string, language: string = 'en-US') {
  if (!apiKey) throw new Error('TMDB API Key is missing');
  const url = `${TMDB_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${apiKey}&language=${language}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB API Error: ${res.statusText}`);
  return res.json();
}

export async function fetchTrending(apiKey: string, timeWindow: 'day' | 'week', mediaType: 'movie' | 'tv', language?: string) {
  return fetchTMDB(`/trending/${mediaType}/${timeWindow}`, apiKey, language);
}

export async function fetchPopular(apiKey: string, mediaType: 'movie' | 'tv', language?: string) {
  return fetchTMDB(`/${mediaType}/popular`, apiKey, language);
}

export async function fetchNowPlaying(apiKey: string, language?: string) {
  return fetchTMDB(`/movie/now_playing`, apiKey, language);
}

export async function fetchTopRated(apiKey: string, mediaType: 'movie' | 'tv', language?: string) {
  return fetchTMDB(`/${mediaType}/top_rated`, apiKey, language);
}

export async function fetchDetails(apiKey: string, id: number, mediaType: 'movie' | 'tv', language?: string) {
  return fetchTMDB(`/${mediaType}/${id}`, apiKey, language);
}

export async function fetchCredits(apiKey: string, id: number, mediaType: 'movie' | 'tv', language?: string) {
  return fetchTMDB(`/${mediaType}/${id}/credits`, apiKey, language);
}

export async function fetchImages(apiKey: string, id: number, mediaType: 'movie' | 'tv', language?: string) {
  // For images, we might want to include image language, but the base fetchTMDB appends &language=...
  // which sets the preferred language for image data if available, or just the query language.
  // TMDB images endpoint supports include_image_language param, but let's stick to the base language param for now
  // as it often defaults correctly or we can add include_image_language if needed.
  // Actually, fetchTMDB adds &language=${language}.
  // If we want specific image languages, we might need to append &include_image_language=${language},null
  // But let's start with just passing language to fetchTMDB.
  return fetchTMDB(`/${mediaType}/${id}/images`, apiKey, language);
}

export async function fetchGenres(apiKey: string, mediaType: 'movie' | 'tv', language?: string) {
  return fetchTMDB(`/genre/${mediaType}/list`, apiKey, language);
}

export async function searchMulti(apiKey: string, query: string, language?: string) {
  return fetchTMDB(`/search/multi?query=${encodeURIComponent(query)}`, apiKey, language);
}
