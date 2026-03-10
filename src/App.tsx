import React, { useState, useEffect, useRef } from 'react';
import { Settings } from './components/Settings';
import { MovieCard } from './components/MovieCard';
import { useStore } from './lib/store';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { fetchTrending, fetchPopular, fetchNowPlaying, fetchTopRated, fetchGenres, fetchImages, searchMulti } from './lib/tmdb';
import { generatePoster, PosterData } from './lib/generator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Loader2, Download, RefreshCw, Archive, CheckSquare, Square, Search } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

export default function App() {
  const { settings, isGenerating, setGenerating } = useStore();
  const [items, setItems] = useState<PosterData[]>([]);
  const [selectedItem, setSelectedItem] = useState<PosterData | null>(null);
  const [generatedPoster, setGeneratedPoster] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const [activeTab, setActiveTab] = useState('individual');
  const [selectedBatchItems, setSelectedBatchItems] = useState<Set<number>>(new Set());
  
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<PosterData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchQuery.trim() && settings.tmdbApiKey) {
        setIsSearching(true);
        try {
          const data = await searchMulti(settings.tmdbApiKey, searchQuery, settings.language);
          const results = data.results
            .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
            .filter((item: any) => item.poster_path || item.backdrop_path);
          setSuggestions(results.slice(0, 5));
          setShowSuggestions(true);
        } catch (error) {
          console.error('Search error:', error);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, settings.tmdbApiKey, settings.language]);

  const handleSuggestionClick = (item: PosterData) => {
    if (activeTab === 'batch') {
      if (!items.some(i => i.id === item.id)) {
        setItems(prev => [item, ...prev]);
      }
      setSelectedBatchItems(prev => new Set(prev).add(item.id));
    } else {
      setItems([item]);
      handleSelect(item);
    }
    setSearchQuery('');
    setShowSuggestions(false);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !settings.tmdbApiKey) return;
    
    setLoading(true);
    setShowSuggestions(false);
    try {
      const data = await searchMulti(settings.tmdbApiKey, searchQuery, settings.language);
      const results = data.results
        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .filter((item: any) => item.poster_path || item.backdrop_path);
        
      if (activeTab === 'batch') {
        const newItems = results.filter((r: any) => !items.some(i => i.id === r.id));
        setItems(prev => [...newItems, ...prev]);
      } else {
        setItems(results);
      }
      toast.success(`Found ${results.length} results.`);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Search failed.');
    } finally {
      setLoading(false);
      setSearchQuery('');
    }
  };

  const handleSelectAll = () => {
    setSelectedBatchItems(new Set(items.map(i => i.id)));
  };

  const handleDeselectAll = () => {
    setSelectedBatchItems(new Set());
  };

  const toggleBatchSelection = (id: number) => {
    const newSet = new Set(selectedBatchItems);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedBatchItems(newSet);
  };

  const fetchItems = async () => {
    if (!settings.tmdbApiKey) {
      toast.error('Please set your TMDB API Key in Settings.');
      return;
    }

    setLoading(true);
    setItems([]);
    setSelectedItem(null);
    setGeneratedPoster(null);

    try {
      // 1. Fetch Genres (for filtering)
      const movieGenres = await fetchGenres(settings.tmdbApiKey, 'movie', settings.language);
      const tvGenres = await fetchGenres(settings.tmdbApiKey, 'tv', settings.language);
      const genresMap: Record<number, string> = {};
      movieGenres.genres.forEach((g: any) => genresMap[g.id] = g.name);
      tvGenres.genres.forEach((g: any) => genresMap[g.id] = g.name);

      // 2. Fetch Content
      let allItems: PosterData[] = [];
      
      const fetchAndAdd = async (fetcher: () => Promise<any>, type: 'movie' | 'tv') => {
        try {
          const data = await fetcher();
          const items = data.results.map((item: any) => ({ ...item, media_type: type }));
          allItems.push(...items);
        } catch (e) {
          console.error(e);
        }
      };

      if (settings.includeMovies) {
        if (settings.includeTrendingDaily) await fetchAndAdd(() => fetchTrending(settings.tmdbApiKey, 'day', 'movie', settings.language), 'movie');
        if (settings.includeTrendingWeekly) await fetchAndAdd(() => fetchTrending(settings.tmdbApiKey, 'week', 'movie', settings.language), 'movie');
        if (settings.includePopular) await fetchAndAdd(() => fetchPopular(settings.tmdbApiKey, 'movie', settings.language), 'movie');
        if (settings.includeNowPlaying) await fetchAndAdd(() => fetchNowPlaying(settings.tmdbApiKey, settings.language), 'movie');
        if (settings.includeTopRated) await fetchAndAdd(() => fetchTopRated(settings.tmdbApiKey, 'movie', settings.language), 'movie');
      }

      if (settings.includeTV) {
        if (settings.includeTrendingDaily) await fetchAndAdd(() => fetchTrending(settings.tmdbApiKey, 'day', 'tv', settings.language), 'tv');
        if (settings.includeTrendingWeekly) await fetchAndAdd(() => fetchTrending(settings.tmdbApiKey, 'week', 'tv', settings.language), 'tv');
        if (settings.includePopular) await fetchAndAdd(() => fetchPopular(settings.tmdbApiKey, 'tv', settings.language), 'tv');
        if (settings.includeTopRated) await fetchAndAdd(() => fetchTopRated(settings.tmdbApiKey, 'tv', settings.language), 'tv');
      }

      // Deduplicate
      const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());
      
      // Filter
      const filteredItems = uniqueItems.filter(item => {
        if (!item.backdrop_path) return false;
        // Check excluded genres
        if (item.genre_ids.some(id => settings.excludedGenres.includes(genresMap[id]))) return false;
        // Check excluded keywords (title)
        if (settings.excludedKeywords.some(k => item.title?.toLowerCase().includes(k.toLowerCase()))) return false;
        return true;
      });

      let finalItems = filteredItems;
      if (settings.strictLogoLanguage) {
        toast.info('Filtering items by logo language (this may take a moment)...');
        const langCode = settings.language.split('-')[0];
        const imagePromises = filteredItems.map(async (item) => {
          try {
            const images = await fetchImages(settings.tmdbApiKey, item.id, item.media_type, settings.language);
            const hasLogo = images.logos.some((l: any) => l.iso_639_1 === langCode && l.file_path.endsWith('.png'));
            if (hasLogo) return item;
            return null;
          } catch (e) {
            return null;
          }
        });
        const results = await Promise.all(imagePromises);
        finalItems = results.filter(Boolean) as PosterData[];
      }

      setItems(finalItems);
      setSelectedBatchItems(new Set());
      toast.success(`Found ${finalItems.length} items.`);
    } catch (e) {
      console.error(e);
      toast.error('Failed to fetch items. Check your API Key.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (item: PosterData) => {
    setSelectedItem(item);
    setGeneratedPoster(null);
    setGenerating(true);

    try {
      const movieGenres = await fetchGenres(settings.tmdbApiKey, 'movie', settings.language);
      const tvGenres = await fetchGenres(settings.tmdbApiKey, 'tv', settings.language);
      const genresMap: Record<number, string> = {};
      movieGenres.genres.forEach((g: any) => genresMap[g.id] = g.name);
      tvGenres.genres.forEach((g: any) => genresMap[g.id] = g.name);

      const posterUrl = await generatePoster(item, settings.tmdbApiKey, settings.omdbApiKey, genresMap, settings.language, settings.isRTL, settings.strictCastLanguage);
      setGeneratedPoster(posterUrl);
      toast.success('Poster generated!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate poster.');
    } finally {
      setGenerating(false);
    }
  };

  const handleBatchDownload = async () => {
    const itemsToDownload = items.filter(i => selectedBatchItems.has(i.id));
    if (itemsToDownload.length === 0) {
      toast.error('Please select at least one item to download.');
      return;
    }
    
    setGenerating(true);
    setBatchProgress({ current: 0, total: itemsToDownload.length });
    const zip = new JSZip();

    try {
      // Fetch genres once
      const movieGenres = await fetchGenres(settings.tmdbApiKey, 'movie', settings.language);
      const tvGenres = await fetchGenres(settings.tmdbApiKey, 'tv', settings.language);
      const genresMap: Record<number, string> = {};
      movieGenres.genres.forEach((g: any) => genresMap[g.id] = g.name);
      tvGenres.genres.forEach((g: any) => genresMap[g.id] = g.name);

      for (let i = 0; i < itemsToDownload.length; i++) {
        const item = itemsToDownload[i];
        try {
          const posterUrl = await generatePoster(item, settings.tmdbApiKey, settings.omdbApiKey, genresMap, settings.language, settings.isRTL, settings.strictCastLanguage);
          // Remove data:image/jpeg;base64, prefix
          const base64Data = posterUrl.split(',')[1];
          // Sanitize filename
          const title = item.title || item.name || 'poster';
          const filename = `${title.replace(/[<>:"/\\|?*]/g, '')}.jpg`;
          zip.file(filename, base64Data, { base64: true });
        } catch (e) {
          console.error(`Failed to generate poster for ${item.title || item.name}`, e);
        }
        setBatchProgress({ current: i + 1, total: itemsToDownload.length });
      }

      const content = await zip.generateAsync({ type: 'blob' });
      saveAs(content, 'tmdb_posters.zip');
      toast.success('All posters downloaded!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate batch posters.');
    } finally {
      setGenerating(false);
      setBatchProgress(null);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <Toaster />
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold">TMDB Poster Generator</h1>
          <div className="flex items-center gap-4">
            <Settings />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-4rem)]">
        {/* Left Panel: List */}
        <div className="lg:col-span-1 flex flex-col gap-4 h-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual">Individual</TabsTrigger>
              <TabsTrigger value="batch">Batch</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search movies or TV shows..."
                className="pl-9 pr-4"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) setShowSuggestions(true);
                }}
              />
              {isSearching && (
                <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </form>
            
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-popover border rounded-md shadow-md z-50 overflow-hidden">
                {suggestions.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex items-center gap-3 p-2 hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => handleSuggestionClick(item)}
                  >
                    {item.poster_path ? (
                      <img 
                        src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} 
                        alt={item.title || item.name} 
                        className="w-8 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-8 h-12 bg-muted flex items-center justify-center rounded">
                        <span className="text-xs text-muted-foreground">No img</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title || item.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{item.media_type}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button onClick={fetchItems} disabled={loading || isGenerating} className="flex-1">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
              Fetch Movies & TV
            </Button>
          </div>

          {activeTab === 'batch' && (
            <div className="flex gap-2">
              <Button onClick={handleSelectAll} variant="outline" size="sm" className="flex-1">
                <CheckSquare className="mr-2 h-4 w-4" />
                Select All
              </Button>
              <Button onClick={handleDeselectAll} variant="outline" size="sm" className="flex-1">
                <Square className="mr-2 h-4 w-4" />
                Deselect All
              </Button>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto pr-2 border rounded-lg bg-muted/10 p-2">
            {items.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-center p-4">
                {loading ? 'Loading...' : 'Click "Fetch" to load items based on your settings.'}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {items.map((item) => (
                  <MovieCard
                    key={item.id}
                    item={item as any} // Type assertion needed due to slight mismatch in TMDBItem vs PosterData interfaces if any
                    onClick={() => !isGenerating && handleSelect(item)}
                    isSelected={activeTab === 'batch' ? selectedBatchItems.has(item.id) : selectedItem?.id === item.id}
                    isBatchMode={activeTab === 'batch'}
                    onSelectChange={() => toggleBatchSelection(item.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {activeTab === 'batch' && (
            <Button 
              onClick={handleBatchDownload} 
              disabled={loading || isGenerating || selectedBatchItems.size === 0} 
              className="w-full"
            >
              {batchProgress ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {batchProgress.current}/{batchProgress.total}
                </>
              ) : (
                <>
                  <Archive className="mr-2 h-4 w-4" />
                  Download Selected ({selectedBatchItems.size})
                </>
              )}
            </Button>
          )}
        </div>

        {/* Right Panel: Preview */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center bg-muted/10 rounded-xl border p-8 h-full">
          {activeTab === 'batch' ? (
            <div className="text-center text-muted-foreground flex flex-col items-center justify-center h-full">
              <Archive className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">Batch Mode Active</p>
              <p className="text-sm mt-2 max-w-md">
                Select multiple items from the list on the left and click "Download Selected" to generate and download them all as a ZIP file.
              </p>
            </div>
          ) : isGenerating ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">
                {batchProgress 
                  ? `Generating poster ${batchProgress.current} of ${batchProgress.total}...` 
                  : 'Generating high-quality poster...'}
              </p>
            </div>
          ) : generatedPoster ? (
            <div className="flex flex-col items-center gap-6 w-full max-w-3xl">
              <div className="relative rounded-lg overflow-hidden shadow-2xl border bg-black">
                <img src={generatedPoster} alt="Generated Poster" className="w-full h-auto max-h-[70vh] object-contain" />
              </div>
              <div className="flex gap-4">
                <Button onClick={() => saveAs(generatedPoster, `${(selectedItem?.title || selectedItem?.name || 'poster').replace(/[<>:"/\\|?*]/g, '')}.jpg`)}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Poster
                </Button>
                <Button variant="outline" onClick={() => setGeneratedPoster(null)}>
                  Close
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium">Select an item to generate a poster</p>
              <p className="text-sm">Configure settings to change sources and language.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
