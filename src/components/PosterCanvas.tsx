import React, { useEffect, useRef, useState } from 'react';
import { PosterData } from '@/types';
import { drawPoster, CANVAS_WIDTH, CANVAS_HEIGHT } from '@/lib/canvasUtils';
import { Button } from '@/components/ui/button'; // Assuming I'll create a Button component or use standard HTML button

interface PosterCanvasProps {
  data: PosterData;
  onDownload?: () => void;
}

export function PosterCanvas({ data, onDownload }: PosterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = async () => {
      setIsDrawing(true);
      try {
        await drawPoster(ctx, data);
      } catch (error) {
        console.error('Failed to draw poster:', error);
      } finally {
        setIsDrawing(false);
      }
    };

    render();
  }, [data]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement('a');
    link.download = `${data.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_poster.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    if (onDownload) onDownload();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden shadow-xl border border-gray-800">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full object-contain"
        />
        {isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-white">
            Drawing...
          </div>
        )}
      </div>
      <button
        onClick={handleDownload}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        disabled={isDrawing}
      >
        Download Poster
      </button>
    </div>
  );
}
