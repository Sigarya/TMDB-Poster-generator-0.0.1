import { ASSETS } from './constants';
import { fetchDetails, fetchCredits, fetchImages, fetchGenres } from './tmdb';
import { fetchRatings, searchOMDB } from './omdb';

export interface PosterData {
  id: number;
  title: string;
  backdrop_path: string;
  poster_path: string;
  overview: string;
  release_date: string;
  vote_average: number;
  original_language: string;
  genre_ids: number[];
  media_type: 'movie' | 'tv';
}

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

// Helper to load image
const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

// Helper to wrap text
const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, isRTL: boolean, maxLines: number | null = null) => {
  const words = text.split(' ');
  let line = '';
  let currentY = y;
  let linesCount = 0;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth && n > 0) {
      if (maxLines && linesCount >= maxLines - 1) {
        // Truncate
        ctx.fillText(line.trim() + '...', x, currentY);
        return currentY + lineHeight;
      }

      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
      linesCount++;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
  return currentY + lineHeight;
};

export async function generatePoster(
  item: PosterData,
  tmdbApiKey: string,
  omdbApiKey: string,
  genresMap: Record<number, string>,
  language: string = 'en-US',
  isRTL: boolean = false,
  strictCastLanguage: boolean = false
): Promise<string> {
  // 1. Fetch additional data
  const details = await fetchDetails(tmdbApiKey, item.id, item.media_type, language);
  const credits = await fetchCredits(tmdbApiKey, item.id, item.media_type, language);
  const images = await fetchImages(tmdbApiKey, item.id, item.media_type, language);
  
  // 2. Get Logo
  const langCode = language.split('-')[0];
  let logo = images.logos.find((l: any) => l.iso_639_1 === langCode && l.file_path.endsWith('.png'));
  if (!logo && langCode !== 'en') {
    logo = images.logos.find((l: any) => l.iso_639_1 === 'en' && l.file_path.endsWith('.png'));
  }
  if (!logo) {
    logo = images.logos[0];
  }
  const logoPath = logo ? `https://image.tmdb.org/t/p/original${logo.file_path}` : null;

  // 3. Get Ratings
  let ratings = { rt: null, meta: null, certified: false };
  if (omdbApiKey) {
    // Try IMDB ID first
    const imdbId = details.imdb_id || details.external_ids?.imdb_id;
    if (imdbId) {
      const omdbData = await fetchRatings(imdbId, omdbApiKey);
      if (omdbData.Response === 'True') {
        const rt = omdbData.Ratings?.find((r: any) => r.Source === 'Rotten Tomatoes')?.Value;
        const meta = omdbData.Ratings?.find((r: any) => r.Source === 'Metacritic')?.Value;
        ratings.rt = rt ? parseInt(rt) : null;
        ratings.meta = meta ? parseInt(meta.split('/')[0]) : null;
        ratings.certified = ratings.rt !== null && ratings.rt >= 75; // Simplified logic
      }
    } else {
      // Fuzzy search fallback (simplified)
      const year = (item.release_date || '').split('-')[0];
      const search = await searchOMDB(item.title, year, omdbApiKey);
      if (search.Response === 'True' && search.Search?.length > 0) {
        const best = search.Search[0];
        const omdbData = await fetchRatings(best.imdbID, omdbApiKey);
         if (omdbData.Response === 'True') {
            const rt = omdbData.Ratings?.find((r: any) => r.Source === 'Rotten Tomatoes')?.Value;
            const meta = omdbData.Ratings?.find((r: any) => r.Source === 'Metacritic')?.Value;
            ratings.rt = rt ? parseInt(rt) : null;
            ratings.meta = meta ? parseInt(meta.split('/')[0]) : null;
            ratings.certified = ratings.rt !== null && ratings.rt >= 75;
         }
      }
    }
  }

  // 4. Prepare Canvas
  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not supported');

  // 5. Load Assets
  const [backdropImg, overlayImg, logoImg, castIcon, directorIcon, rtIcon, freshIcon, rottenIcon, certifiedIcon, metaIcon] = await Promise.all([
    loadImage(`https://image.tmdb.org/t/p/original${item.backdrop_path}`),
    loadImage(ASSETS.OVERLAY),
    logoPath ? loadImage(logoPath) : Promise.resolve(null),
    loadImage(ASSETS.CAST_ICON),
    loadImage(ASSETS.DIRECTOR_ICON),
    Promise.resolve(null), 
    loadImage(ASSETS.FRESH_TOMATO),
    loadImage(ASSETS.ROTTEN_TOMATO),
    loadImage(ASSETS.CERTIFIED_FRESH),
    loadImage(ASSETS.METACRITIC),
  ]);

  // 6. Draw
  // Backdrop
  ctx.drawImage(backdropImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  
  // Overlay
  ctx.save();
  if (isRTL) {
    ctx.scale(-1, 1);
    ctx.drawImage(overlayImg, -CANVAS_WIDTH, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  } else {
    ctx.drawImage(overlayImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
  ctx.restore();

  // Common Layout Config
  const marginX = 50;
  const contentX = isRTL ? CANVAS_WIDTH - marginX : marginX;
  ctx.textAlign = isRTL ? 'right' : 'left';
  if (isRTL) {
    canvas.dir = 'rtl';
  }

  // Start positioning from Top
  let currentY = 50;

  // Logo
  if (logoImg) {
    const maxLogoW = 600;
    const maxLogoH = 250;
    const ratio = Math.min(maxLogoW / logoImg.width, maxLogoH / logoImg.height);
    const logoW = logoImg.width * ratio;
    const logoH = logoImg.height * ratio;
    
    // Position
    const logoDrawX = isRTL ? contentX - logoW : contentX;
    
    ctx.drawImage(logoImg, logoDrawX, currentY, logoW, logoH);
    currentY += logoH + 30; // Add padding below logo
  } else {
    // Fallback Text Title
    ctx.font = 'bold 80px Arial';
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 10;
    // Need to account for text height roughly
    currentY += 80; 
    ctx.fillText(item.title, contentX, currentY);
    currentY += 30;
  }

  // Metadata (Year | Runtime | Genre)
  ctx.font = '30px Arial';
  ctx.fillStyle = '#cccccc';
  const year = (item.release_date || '').split('-')[0];
  const runtime = details.runtime ? `${details.runtime} min` : '';
  const genreNames = item.genre_ids.slice(0, 3).map(id => genresMap[id]).join(', ');
  const metaText = [year, runtime, genreNames].filter(Boolean).join('  •  ');
  
  // Adjust Y for text baseline (approx)
  currentY += 30;
  ctx.fillText(metaText, contentX, currentY);
  
  const metaWidth = ctx.measureText(metaText).width;

  // Ratings (Same row as Metadata)
  // Calculate starting X for ratings
  let ratingX = isRTL ? contentX - metaWidth - 50 : contentX + metaWidth + 50;
  const ratingY = currentY; 
  const iconSize = 40;
  
  // Helper to draw rating group
  const drawRating = (icon: HTMLImageElement | null, text: string, color: string = 'white') => {
    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = color;
    const textWidth = ctx.measureText(text).width;
    
    if (isRTL) {
      if (icon) {
        ctx.drawImage(icon, ratingX - iconSize, ratingY - 30, iconSize, iconSize);
        ctx.fillText(text, ratingX - iconSize - 10, ratingY);
        return iconSize + 10 + textWidth + 40;
      } else {
        ctx.fillText(text, ratingX, ratingY);
        return textWidth + 40;
      }
    } else {
      if (icon) {
        ctx.drawImage(icon, ratingX, ratingY - 30, iconSize, iconSize);
        ctx.fillText(text, ratingX + 50, ratingY);
        return 140; 
      } else {
        ctx.fillText(text, ratingX, ratingY);
        return textWidth + 40;
      }
    }
  };

  // RT
  if (ratings.rt !== null) {
    let icon = ratings.certified ? certifiedIcon : (ratings.rt >= 60 ? freshIcon : rottenIcon);
    if (icon) {
      const widthUsed = drawRating(icon, `${ratings.rt}%`);
      ratingX += isRTL ? -widthUsed : widthUsed;
    }
  }

  // Metacritic
  if (ratings.meta !== null) {
    const widthUsed = drawRating(metaIcon, `${ratings.meta}`);
    ratingX += isRTL ? -widthUsed : widthUsed;
  }

  // TMDB
  const tmdbWidth = drawRating(null, `TMDB ${Math.round(item.vote_average * 10)}%`, '#01b4e4');
  ratingX += isRTL ? -tmdbWidth : tmdbWidth;

  currentY += 50; // Reduced spacing to Plot

  // Plot
  ctx.font = '24px Arial';
  ctx.fillStyle = 'white';
  // Max 3 lines
  currentY = wrapText(ctx, item.overview, contentX, currentY, 1000, 36, isRTL, 3);
  currentY += 10; // Reduced padding

  // Cast
  let castList = credits.cast || [];
  if (strictCastLanguage) {
    castList = castList.filter((c: any) => c.name !== c.original_name || item.original_language === langCode);
  }
  const cast = castList.slice(0, 4).map((c: any) => c.name).join(', ');
  if (cast) {
    const iconX = isRTL ? contentX - 30 : contentX;
    ctx.drawImage(castIcon, iconX, currentY - 25, 30, 30); // Adjust icon Y to align with text
    
    ctx.font = '24px Arial';
    ctx.fillStyle = '#cccccc';
    const textX = isRTL ? contentX - 40 : contentX + 40;
    ctx.fillText(`${cast}`, textX, currentY);
    currentY += 40;
  }

  // Director
  let crewList = credits.crew || [];
  if (strictCastLanguage) {
    crewList = crewList.filter((c: any) => c.name !== c.original_name || item.original_language === langCode);
  }
  const director = crewList.find((c: any) => c.job === 'Director')?.name;
  if (director) {
    const iconX = isRTL ? contentX - 30 : contentX;
    ctx.drawImage(directorIcon, iconX, currentY - 25, 30, 30);
    
    ctx.font = '24px Arial';
    ctx.fillStyle = '#cccccc';
    const textX = isRTL ? contentX - 40 : contentX + 40;
    ctx.fillText(`${director}`, textX, currentY);
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}
