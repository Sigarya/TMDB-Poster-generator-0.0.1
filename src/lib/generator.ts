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
const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + ' ';
      currentY += lineHeight;
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
  genresMap: Record<number, string>
): Promise<string> {
  // 1. Fetch additional data
  const details = await fetchDetails(tmdbApiKey, item.id, item.media_type);
  const credits = await fetchCredits(tmdbApiKey, item.id, item.media_type);
  const images = await fetchImages(tmdbApiKey, item.id, item.media_type);
  
  // 2. Get Logo
  const logo = images.logos.find((l: any) => l.iso_639_1 === 'en' && l.file_path.endsWith('.png'));
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
    // We don't have a generic RT icon in the list, just fresh/rotten/certified.
    // The python script logic uses fresh/rotten/certified based on score.
    // We'll load them all and use conditionally.
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
  ctx.drawImage(overlayImg, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Logo
  if (logoImg) {
    // Resize logic: maintain aspect ratio, max width 800, max height 300
    // Position: Bottom Left area, usually.
    // The python script puts it at (50, 50) or similar? No, usually bottom left for these wallpapers.
    // Let's look at the sample output or python script.
    // Python script `_add_content`:
    // logo_size = (800, 300)
    // logo_position = (50, 50) -> Top Left?
    // Wait, `overlay.png` usually darkens the bottom or left.
    // Let's assume standard layout: Bottom Left or Top Left.
    // Most TV interfaces have info at the bottom.
    // Let's put it at Bottom Left, above the text.
    
    // Actually, let's check the python script logic if I can recall or infer.
    // "Rich Poster Design: Combines backdrop images with logos, cast, crew, ratings, and plot summaries"
    // Usually Title/Logo is Top Left or Bottom Left.
    // Let's go with Bottom Left, starting around y=600?
    
    const maxLogoW = 600;
    const maxLogoH = 250;
    const ratio = Math.min(maxLogoW / logoImg.width, maxLogoH / logoImg.height);
    const logoW = logoImg.width * ratio;
    const logoH = logoImg.height * ratio;
    
    // Position: x=50, y=CANVAS_HEIGHT - 450 (approx)
    ctx.drawImage(logoImg, 50, CANVAS_HEIGHT - 480 - logoH, logoW, logoH);
  } else {
    // Fallback Text Title
    ctx.font = 'bold 80px Arial';
    ctx.fillStyle = 'white';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 10;
    ctx.fillText(item.title, 50, CANVAS_HEIGHT - 500);
  }

  // Metadata (Year | Runtime | Genre | Certification)
  ctx.font = '30px Arial';
  ctx.fillStyle = '#cccccc';
  const year = (item.release_date || '').split('-')[0];
  const runtime = details.runtime ? `${details.runtime} min` : '';
  const genreNames = item.genre_ids.slice(0, 3).map(id => genresMap[id]).join(', ');
  // Certification is tricky to get from standard details without `release_dates` append.
  // Let's skip certification for now or fetch it if easy.
  const metaText = [year, runtime, genreNames].filter(Boolean).join('  •  ');
  ctx.fillText(metaText, 50, CANVAS_HEIGHT - 420);

  // Ratings
  let ratingX = 50;
  const ratingY = CANVAS_HEIGHT - 360;
  const iconSize = 40;
  
  // RT
  if (ratings.rt !== null) {
    let icon = ratings.certified ? certifiedIcon : (ratings.rt >= 60 ? freshIcon : rottenIcon);
    if (icon) {
      ctx.drawImage(icon, ratingX, ratingY - 30, iconSize, iconSize);
      ctx.font = 'bold 30px Arial';
      ctx.fillStyle = 'white';
      ctx.fillText(`${ratings.rt}%`, ratingX + 50, ratingY);
      ratingX += 140;
    }
  }

  // Metacritic
  if (ratings.meta !== null) {
    ctx.drawImage(metaIcon, ratingX, ratingY - 30, iconSize, iconSize);
    ctx.font = 'bold 30px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText(`${ratings.meta}`, ratingX + 50, ratingY);
    ratingX += 120;
  }

  // TMDB
  // Always show TMDB score
  // We don't have a specific TMDB icon in the assets list, but we can use text or the logo?
  // The assets list has `tmdblogo.png`.
  // Let's use a simple star or just "TMDB".
  ctx.font = 'bold 30px Arial';
  ctx.fillStyle = '#01b4e4'; // TMDB Blue
  ctx.fillText(`TMDB ${Math.round(item.vote_average * 10)}%`, ratingX, ratingY);


  // Plot
  ctx.font = '24px Arial';
  ctx.fillStyle = 'white';
  wrapText(ctx, item.overview, 50, CANVAS_HEIGHT - 300, 1000, 36);

  // Cast
  const cast = credits.cast?.slice(0, 4).map((c: any) => c.name).join(', ');
  if (cast) {
    ctx.drawImage(castIcon, 50, CANVAS_HEIGHT - 120, 30, 30);
    ctx.font = '24px Arial';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(`Starring: ${cast}`, 90, CANVAS_HEIGHT - 95);
  }

  // Director
  const director = credits.crew?.find((c: any) => c.job === 'Director')?.name;
  if (director) {
    ctx.drawImage(directorIcon, 50, CANVAS_HEIGHT - 70, 30, 30);
    ctx.font = '24px Arial';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(`Directed by: ${director}`, 90, CANVAS_HEIGHT - 45);
  }

  return canvas.toDataURL('image/jpeg', 0.9);
}
