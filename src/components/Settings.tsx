import { useState } from 'react';
import { useStore } from '../lib/store';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Settings as SettingsIcon } from 'lucide-react';

export function Settings() {
  const { settings, updateSettings } = useStore();
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <SettingsIcon className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tmdbApiKey" className="text-right">
              TMDB API Key
            </Label>
            <Input
              id="tmdbApiKey"
              value={settings.tmdbApiKey}
              onChange={(e) => updateSettings({ tmdbApiKey: e.target.value })}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="omdbApiKey" className="text-right">
              OMDB API Key
            </Label>
            <Input
              id="omdbApiKey"
              value={settings.omdbApiKey}
              onChange={(e) => updateSettings({ omdbApiKey: e.target.value })}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="language" className="text-right">
              Language
            </Label>
            <Input
              id="language"
              value={settings.language}
              placeholder="en-US"
              onChange={(e) => updateSettings({ language: e.target.value })}
              className="col-span-3"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isRTL">RTL Layout</Label>
            <Switch
              id="isRTL"
              checked={settings.isRTL}
              onCheckedChange={(checked) => updateSettings({ isRTL: checked })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label htmlFor="includeMovies">Include Movies</Label>
            <Switch
              id="includeMovies"
              checked={settings.includeMovies}
              onCheckedChange={(checked) => updateSettings({ includeMovies: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="includeTV">Include TV Shows</Label>
            <Switch
              id="includeTV"
              checked={settings.includeTV}
              onCheckedChange={(checked) => updateSettings({ includeTV: checked })}
            />
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium leading-none">Sources</h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="trendingDaily">Trending (Daily)</Label>
              <Switch
                id="trendingDaily"
                checked={settings.includeTrendingDaily}
                onCheckedChange={(checked) => updateSettings({ includeTrendingDaily: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="trendingWeekly">Trending (Weekly)</Label>
              <Switch
                id="trendingWeekly"
                checked={settings.includeTrendingWeekly}
                onCheckedChange={(checked) => updateSettings({ includeTrendingWeekly: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="popular">Popular</Label>
              <Switch
                id="popular"
                checked={settings.includePopular}
                onCheckedChange={(checked) => updateSettings({ includePopular: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="nowPlaying">Now Playing</Label>
              <Switch
                id="nowPlaying"
                checked={settings.includeNowPlaying}
                onCheckedChange={(checked) => updateSettings({ includeNowPlaying: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="topRated">Top Rated</Label>
              <Switch
                id="topRated"
                checked={settings.includeTopRated}
                onCheckedChange={(checked) => updateSettings({ includeTopRated: checked })}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h4 className="font-medium leading-none">Strict Language Filters</h4>
            <div className="flex items-center justify-between">
              <Label htmlFor="strictCastLanguage" className="flex-1 pr-4">
                Strict Cast/Director Language
                <p className="text-xs text-muted-foreground font-normal mt-1">Only show cast/director names if they have a translation in the target language (or if the original language matches).</p>
              </Label>
              <Switch
                id="strictCastLanguage"
                checked={settings.strictCastLanguage}
                onCheckedChange={(checked) => updateSettings({ strictCastLanguage: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="strictLogoLanguage" className="flex-1 pr-4">
                Strict Logo Language
                <p className="text-xs text-muted-foreground font-normal mt-1">Only show titles that have a stylized logo in the target language.</p>
              </Label>
              <Switch
                id="strictLogoLanguage"
                checked={settings.strictLogoLanguage}
                onCheckedChange={(checked) => updateSettings({ strictLogoLanguage: checked })}
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
