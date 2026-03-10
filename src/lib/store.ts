import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_SETTINGS } from './constants';

interface Settings {
  tmdbApiKey: string;
  omdbApiKey: string;
  excludedCountries: string[];
  excludedGenres: string[];
  excludedKeywords: string[];
  includeTrendingDaily: boolean;
  includeTrendingWeekly: boolean;
  includePopular: boolean;
  includeNowPlaying: boolean;
  includeTopRated: boolean;
  includeTV: boolean;
  includeMovies: boolean;
  language: string;
  isRTL: boolean;
  strictCastLanguage: boolean;
  strictLogoLanguage: boolean;
}

interface AppState {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
  resetSettings: () => void;
  isGenerating: boolean;
  setGenerating: (generating: boolean) => void;
  generatedPosters: string[]; // URLs of generated posters
  addPoster: (url: string) => void;
  clearPosters: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      settings: DEFAULT_SETTINGS,
      updateSettings: (newSettings) =>
        set((state) => ({ settings: { ...state.settings, ...newSettings } })),
      resetSettings: () => set({ settings: DEFAULT_SETTINGS }),
      isGenerating: false,
      setGenerating: (generating) => set({ isGenerating: generating }),
      generatedPosters: [],
      addPoster: (url) =>
        set((state) => ({ generatedPosters: [...state.generatedPosters, url] })),
      clearPosters: () => set({ generatedPosters: [] }),
    }),
    {
      name: 'tmdb-poster-settings',
      partialize: (state) => ({ settings: state.settings }), // Only persist settings
    }
  )
);
