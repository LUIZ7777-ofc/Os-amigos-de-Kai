import { createHash } from 'node:crypto';
import { createCanvas } from '@napi-rs/canvas';

const WIDTH = 1100;
const HEIGHT = 430;
const GOLD = '#F2C531';

function parseColor(value) {
  return /^#[0-9A-Fa-f]{6}$/.test(value ?? '') ? value : '#7C3AED';
}

function wrapText(ctx, text, maxWidth, maxLines) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';

  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines) break;
    } else {
      line = candidate;
    }
  }

  if (line && lines.length < maxLines) lines.push(line);
  const hasMore = words.join(' ').length > lines.join(' ').length;
  if (hasMore && lines.length) {
    let last = lines[lines.length - 1];
    while (last && ctx.measureText(`${last}...`).width > maxWidth) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = `${last.trimEnd()}...`;
  }
  return lines;
}

function fitTitle(ctx, title, maxWidth) {
  let fontSize = 76;
  ctx.font = `900 ${fontSize}px sans-serif`;
  while (fontSize > 34 && ctx.measureText(title).width > maxWidth) {
    fontSize -= 2;
    ctx.font = `900 ${fontSize}px sans-serif`;
  }
  return fontSize;
}

function drawGrid(ctx, accent) {
  ctx.fillStyle = '#10282B';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.strokeStyle = '#29464A';
  ctx.lineWidth = 1;
  for (let x = 0; x < WIDTH; x += 35) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < HEIGHT; y += 35) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.18;
  ctx.fillRect(0, 0, WIDTH, 8);
  ctx.globalAlpha = 1;
}

export function getBannerFilename(draft) {
  const contents = JSON.stringify({
    title: draft.title,
    description: draft.description,
    color: draft.color,
    authorName: draft.authorName,
    footerText: draft.footerText,
  });
  const hash = createHash('sha256').update(contents).digest('hex').slice(0, 12);
  return `embed-${hash}.png`;
}

export function createBanner(draft) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  const accent = parseColor(draft.color);
  const title = (draft.title || 'Novo embed').trim().toUpperCase();
  const description = (draft.description || 'Personalize este embed no menu.').trim();
  const author = (draft.authorName || 'Zape cansado').trim();
  const footer = (draft.footerText || 'Mais informacoes').trim();

  ctx.fillStyle = '#163236';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  drawGrid(ctx, accent);

  ctx.fillStyle = '#E5AFA5';
  ctx.font = '16px sans-serif';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`${author.toUpperCase()}  -  COMUNICADO`, 55, 75, 990);

  ctx.fillStyle = GOLD;
  const titleFontSize = fitTitle(ctx, title, 980);
  ctx.font = `900 ${titleFontSize}px sans-serif`;
  ctx.fillText(title, 48, 190, 990);

  ctx.fillStyle = accent;
  ctx.fillRect(55, 220, 110, 5);

  ctx.fillStyle = '#E5DFD2';
  ctx.font = '20px sans-serif';
  const descriptionLines = wrapText(ctx, description, 940, 3);
  descriptionLines.forEach((line, index) => {
    ctx.fillText(line, 55, 266 + index * 29);
  });

  ctx.fillStyle = '#C4BFC0';
  ctx.font = '15px sans-serif';
  ctx.fillText(footer.toUpperCase(), 55, 395, 990);

  return canvas.toBuffer('image/png');
}
