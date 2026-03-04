import { TMDB_BASE_URL } from './constants';

export async function fetchTMDB(endpoint: string, apiKey: string) {
  if (!apiKey) throw new Error('TMDB API Key is missing');
  const url = `${TMDB_BASE_URL}${endpoint}${endpoint.includes('?') ? '&' : '?'}api_key=${apiKey}&language=en-US`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDB API Error: ${res.statusText}`);
  return res.json();
}

export async function fetchTrending(apiKey: string, timeWindow: 'day' | 'week', mediaType: 'movie' | 'tv') {
  return fetchTMDB(`/trending/${mediaType}/${timeWindow}`, apiKey);
}

export async function fetchPopular(apiKey: string, mediaType: 'movie' | 'tv') {
  return fetchTMDB(`/${mediaType}/popular`, apiKey);
}

export async function fetchNowPlaying(apiKey: string) {
  return fetchTMDB(`/movie/now_playing`, apiKey);
}

export async function fetchTopRated(apiKey: string, mediaType: 'movie' | 'tv') {
  return fetchTMDB(`/${mediaType}/top_rated`, apiKey);
}

export async function fetchDetails(apiKey: string, id: number, mediaType: 'movie' | 'tv') {
  return fetchTMDB(`/${mediaType}/${id}`, apiKey);
}

export async function fetchCredits(apiKey: string, id: number, mediaType: 'movie' | 'tv') {
  return fetchTMDB(`/${mediaType}/${id}/credits`, apiKey);
}

export async function fetchImages(apiKey: string, id: number, mediaType: 'movie' | 'tv') {
  return fetchTMDB(`/${mediaType}/${id}/images`, apiKey);
}

export async function fetchGenres(apiKey: string, mediaType: 'movie' | 'tv') {
  return fetchTMDB(`/genre/${mediaType}/list`, apiKey);
}
