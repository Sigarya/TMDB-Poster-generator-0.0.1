import { OMDB_BASE_URL } from './constants';

export async function fetchOMDB(params: Record<string, string>, apiKey: string) {
  if (!apiKey) throw new Error('OMDB API Key is missing');
  const query = new URLSearchParams({ ...params, apikey: apiKey }).toString();
  const url = `${OMDB_BASE_URL}/?${query}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`OMDB API Error: ${res.statusText}`);
  return res.json();
}

export async function fetchRatings(imdbId: string, apiKey: string) {
  return fetchOMDB({ i: imdbId, plot: 'short' }, apiKey);
}

export async function searchOMDB(title: string, year: string, apiKey: string) {
  return fetchOMDB({ s: title, y: year }, apiKey);
}
