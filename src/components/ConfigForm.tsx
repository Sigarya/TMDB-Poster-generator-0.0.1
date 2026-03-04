import React, { useState } from 'react';
import { cn } from '@/lib/utils';

interface ConfigFormProps {
  onSave: (tmdbKey: string, omdbKey: string) => void;
  initialTmdbKey?: string;
  initialOmdbKey?: string;
}

export function ConfigForm({ onSave, initialTmdbKey = '', initialOmdbKey = '' }: ConfigFormProps) {
  const [tmdbKey, setTmdbKey] = useState(initialTmdbKey);
  const [omdbKey, setOmdbKey] = useState(initialOmdbKey);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(tmdbKey, omdbKey);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white shadow-sm">
      <h2 className="text-lg font-semibold">API Configuration</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">TMDB API Key</label>
        <input
          type="password"
          value={tmdbKey}
          onChange={(e) => setTmdbKey(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          placeholder="Enter TMDB API Key"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">OMDB API Key</label>
        <input
          type="password"
          value={omdbKey}
          onChange={(e) => setOmdbKey(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
          placeholder="Enter OMDB API Key"
          required
        />
      </div>
      <button
        type="submit"
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        Save Configuration
      </button>
    </form>
  );
}
