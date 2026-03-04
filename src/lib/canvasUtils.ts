import { PosterData } from '@/types';

export const CANVAS_WIDTH = 1920;
export const CANVAS_HEIGHT = 1080;

export async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
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
}

export async function drawPoster(
  ctx: CanvasRenderingContext2D,
  data: PosterData
) {
  // Clear canvas
  ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 1. Draw Backdrop
  try {
    const backdrop = await loadImage(data.backdropUrl);
    // Scale to cover
    const scale = Math.max(CANVAS_WIDTH / backdrop.width, CANVAS_HEIGHT / backdrop.height);
    const x = (CANVAS_WIDTH - backdrop.width * scale) / 2;
    const y = (CANVAS_HEIGHT - backdrop.height * scale) / 2;
    ctx.drawImage(backdrop, x, y, backdrop.width * scale, backdrop.height * scale);
  } catch (e) {
    console.error('Failed to load backdrop', e);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  // 2. Draw Overlay (Gradient)
  const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
  gradient.addColorStop(0, 'rgba(0,0,0,0.95)');
  gradient.addColorStop(0.4, 'rgba(0,0,0,0.7)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 3. Draw Logo or Title
  const contentX = 100;
  let currentY = 150;

  if (data.logoUrl) {
    try {
      const logo = await loadImage(data.logoUrl);
      const logoWidth = 600;
      const logoHeight = (logo.height / logo.width) * logoWidth;
      ctx.drawImage(logo, contentX, currentY, logoWidth, logoHeight);
      currentY += logoHeight + 50;
    } catch (e) {
      console.error('Failed to load logo', e);
      // Fallback to text title
      ctx.fillStyle = 'white';
      ctx.font = 'bold 80px Arial';
      currentY = wrapText(ctx, data.title, contentX, currentY + 80, 800, 90);
      currentY += 20;
    }
  } else {
    ctx.fillStyle = 'white';
    ctx.font = 'bold 80px Arial';
    currentY = wrapText(ctx, data.title, contentX, currentY + 80, 800, 90);
    currentY += 20;
  }

  // 4. Draw Metadata (Year, Runtime, Genres)
  ctx.fillStyle = '#cccccc';
  ctx.font = '30px Arial';
  const metaText = [data.year, data.runtime, data.genres.slice(0, 3).join(', ')].filter(Boolean).join(' • ');
  ctx.fillText(metaText, contentX, currentY);
  currentY += 60;

  // 5. Draw Ratings
  // TMDB
  ctx.fillStyle = 'white';
  ctx.font = 'bold 30px Arial';
  let ratingsX = contentX;
  
  // TMDB
  ctx.fillStyle = '#01b4e4'; // TMDB Blue
  ctx.fillText('TMDB', ratingsX, currentY);
  ctx.fillStyle = 'white';
  ctx.fillText(`${data.ratings.tmdb.toFixed(1)}`, ratingsX + 90, currentY);
  ratingsX += 200;

  // Rotten Tomatoes
  if (data.ratings.rt) {
    const score = parseInt(data.ratings.rt);
    ctx.fillStyle = score >= 60 ? '#fa320a' : '#5F9EA0'; // Red for fresh, greenish for rotten
    ctx.fillText('RT', ratingsX, currentY);
    ctx.fillStyle = 'white';
    ctx.fillText(data.ratings.rt, ratingsX + 50, currentY);
    ratingsX += 150;
  }

  // Metacritic
  if (data.ratings.metacritic) {
    const score = parseInt(data.ratings.metacritic);
    ctx.fillStyle = score >= 60 ? '#66cc33' : '#ffcc33'; // Green/Yellow
    ctx.fillText('Meta', ratingsX, currentY);
    ctx.fillStyle = 'white';
    ctx.fillText(data.ratings.metacritic, ratingsX + 80, currentY);
  }
  
  currentY += 60;

  // 6. Draw Plot
  ctx.fillStyle = '#dddddd';
  ctx.font = '32px Arial';
  currentY = wrapText(ctx, data.plot, contentX, currentY, 900, 45);
  currentY += 40;

  // 7. Draw Cast & Crew
  if (data.director) {
    ctx.fillStyle = '#aaaaaa';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('Director:', contentX, currentY);
    ctx.fillStyle = 'white';
    ctx.font = '28px Arial';
    ctx.fillText(data.director, contentX + 130, currentY);
    currentY += 40;
  }

  if (data.cast.length > 0) {
    ctx.fillStyle = '#aaaaaa';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('Starring:', contentX, currentY);
    ctx.fillStyle = 'white';
    ctx.font = '28px Arial';
    const castText = data.cast.slice(0, 4).join(', ');
    wrapText(ctx, castText, contentX + 130, currentY, 770, 40);
  }
}
