import React, { useState, useEffect } from 'react';
import { ConfigForm } from '@/components/ConfigForm';
import { MovieCard } from '@/components/MovieCard';
import { PosterCanvas } from '@/components/PosterCanvas';
import { TMDBService, TMDBItem } from '@/services/tmdb';
import { OMDBService } from '@/services/omdb';
import { PosterData } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [tmdbKey, setTmdbKey] = useState<string>('');
  const [omdbKey, setOmdbKey] = useState<string>('');
  const [items, setItems] = useState<TMDBItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<TMDBItem | null>(null);
  const [posterData, setPosterData] = useState<PosterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedTmdb = localStorage.getItem('tmdbKey');
    const savedOmdb = localStorage.getItem('omdbKey');
    if (savedTmdb) setTmdbKey(savedTmdb);
    if (savedOmdb) setOmdbKey(savedOmdb);
  }, []);

  const handleSaveKeys = (tmdb: string, omdb: string) => {
    setTmdbKey(tmdb);
    setOmdbKey(omdb);
    localStorage.setItem('tmdbKey', tmdb);
    localStorage.setItem('omdbKey', omdb);
  };

  const fetchItems = async () => {
    if (!tmdbKey) return;
    setLoading(true);
    setError(null);
    try {
      const tmdb = new TMDBService(tmdbKey);
      const [trendingMovies, popularMovies, trendingTv, popularTv] = await Promise.all([
        tmdb.getTrending('movie'),
        tmdb.getPopular('movie'),
        tmdb.getTrending('tv'),
        tmdb.getPopular('tv'),
      ]);

      const allItems = [
        ...trendingMovies.results.map(i => ({ ...i, media_type: 'movie' as const })),
        ...popularMovies.results.map(i => ({ ...i, media_type: 'movie' as const })),
        ...trendingTv.results.map(i => ({ ...i, media_type: 'tv' as const })),
        ...popularTv.results.map(i => ({ ...i, media_type: 'tv' as const })),
      ];

      // Deduplicate by ID
      const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());
      setItems(uniqueItems);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (item: TMDBItem) => {
    setSelectedItem(item);
    setGenerating(true);
    setPosterData(null);
    setError(null);

    try {
      const tmdb = new TMDBService(tmdbKey);
      const omdb = new OMDBService(omdbKey);

      const type = item.media_type || (item.first_air_date ? 'tv' : 'movie');
      const [details, credits, images] = await Promise.all([
        tmdb.getDetails(type, item.id),
        tmdb.getCredits(type, item.id),
        tmdb.getImages(type, item.id),
      ]);

      // Get Ratings
      let ratings = { tmdb: details.vote_average, rt: undefined as string | undefined, metacritic: undefined as string | undefined };
      
      if (omdbKey) {
        let omdbData;
        const imdbId = details.external_ids?.imdb_id || details.imdb_id;
        
        if (imdbId) {
          omdbData = await omdb.getRatings(imdbId);
        } else {
          const year = (details.release_date || details.first_air_date || '').substring(0, 4);
          const search = await omdb.searchFuzzy(details.title || details.name || '', year);
          if (search.Search && search.Search.length > 0) {
            omdbData = await omdb.getRatings(search.Search[0].imdbID);
          }
        }

        if (omdbData && omdbData.Ratings) {
          const rt = omdbData.Ratings.find(r => r.Source === 'Rotten Tomatoes');
          const meta = omdbData.Ratings.find(r => r.Source === 'Metacritic');
          if (rt) ratings.rt = rt.Value;
          if (meta) ratings.metacritic = meta.Value.split('/')[0];
        }
      }

      // Find English logo (prefer png)
      const logo = images.logos.find(l => l.iso_639_1 === 'en' && l.file_path.endsWith('.png'))?.file_path 
        || images.logos[0]?.file_path;

      const itemGenres = details.genres.map(g => g.name);
      
      let runtimeString = '';
      if (type === 'movie' && details.runtime) {
        const hours = Math.floor(details.runtime / 60);
        const minutes = details.runtime % 60;
        runtimeString = `${hours}h ${minutes}m`;
      } else if (type === 'tv') {
        runtimeString = `${details.number_of_seasons || 1} Seasons`;
      }

      setPosterData({
        title: details.title || details.name || '',
        backdropUrl: details.backdrop_path ? `https://image.tmdb.org/t/p/original${details.backdrop_path}` : '',
        logoUrl: logo ? `https://image.tmdb.org/t/p/original${logo}` : undefined,
        plot: details.overview,
        cast: credits.cast.slice(0, 5).map(c => c.name),
        director: credits.crew.find(c => c.job === 'Director')?.name,
        ratings,
        year: (details.release_date || details.first_air_date || '').substring(0, 4),
        runtime: runtimeString,
        genres: itemGenres,
      });

    } catch (err: any) {
      console.error(err);
      setError(`Failed to generate poster: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">TMDB Poster Generator</h1>
          <div className="text-sm text-gray-500">
            {items.length > 0 ? `${items.length} items loaded` : 'Load items to start'}
          </div>
        </header>

        {!tmdbKey || !omdbKey ? (
          <ConfigForm onSave={handleSaveKeys} initialTmdbKey={tmdbKey} initialOmdbKey={omdbKey} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Panel: Movie List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex gap-2">
                <Button onClick={fetchItems} disabled={loading} className="w-full">
                  {loading ? <Loader2 className="animate-spin mr-2" /> : null}
                  Fetch Movies & TV
                </Button>
                <Button variant="outline" onClick={() => { setTmdbKey(''); setOmdbKey(''); }}>
                  Reset Keys
                </Button>
              </div>
              
              {error && <div className="text-red-500 text-sm p-2 bg-red-50 rounded">{error}</div>}

              <div className="grid grid-cols-2 gap-4 max-h-[800px] overflow-y-auto pr-2">
                {items.map(item => (
                  <MovieCard
                    key={item.id}
                    item={item}
                    onClick={() => handleSelect(item)}
                    isSelected={selectedItem?.id === item.id}
                  />
                ))}
              </div>
            </div>

            {/* Right Panel: Preview */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 flex flex-col items-center justify-center min-h-[600px]">
              {generating ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                  <p className="text-gray-500">Generating poster...</p>
                </div>
              ) : posterData ? (
                <div className="w-full space-y-4">
                  <PosterCanvas data={posterData} />
                  <div className="text-xs text-gray-400 text-center">
                    Preview generated at 1920x1080 resolution
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <p className="text-lg">Select a movie or TV show to generate a poster</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
