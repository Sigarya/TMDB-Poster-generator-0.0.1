import React from 'react';
import { TMDBItem } from '@/services/tmdb';
import { cn } from '@/lib/utils';

interface MovieCardProps {
  item: TMDBItem;
  onClick: () => void;
  isSelected?: boolean;
}

export const MovieCard: React.FC<MovieCardProps> = ({ item, onClick, isSelected }) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative aspect-[2/3] rounded-lg overflow-hidden cursor-pointer transition-all hover:scale-105",
        isSelected ? "ring-4 ring-indigo-500" : "hover:ring-2 hover:ring-gray-300"
      )}
    >
      {item.poster_path ? (
        <img
          src={`https://image.tmdb.org/t/p/w500${item.poster_path}`}
          alt={item.title || item.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-gray-400">
          No Poster
        </div>
      )}
      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
        <h3 className="text-white text-sm font-medium truncate">{item.title || item.name}</h3>
      </div>
    </div>
  );
};
