// Backgrounds are functions of the frame size, so one design serves 9:16
// and 16:9. Each returns { svg, floorY } — floorY is where characters stand.
import { INK, LINE, LINE_FINE, stroke, shade, tint } from '../style.mjs';

const fine = (w = LINE_FINE) => stroke(w);

function office(w, h, { wall = '#f6e7d2', floor = '#c99a6e', accent = '#f4a261', board = '' } = {}) {
  const portrait = h > w;
  // Portrait keeps the top band clear for captions and the bottom band for
  // the app's own UI, so wall decor sits lower, behind the characters.
  const floorY = Math.round(h * (portrait ? 0.82 : 0.80));
  const u = Math.min(w, h) / 1080; // scale unit
  // Window with a simple skyline
  const winW = (portrait ? 300 : 380) * u, winH = (portrait ? 250 : 300) * u;
  const winX = portrait ? w * 0.05 : w * 0.08, winY = portrait ? h * 0.27 : h * 0.14;
  const sky = '#bfe3f2';
  const skyline = [0.05, 0.22, 0.38, 0.55, 0.72].map((fx, i) => {
    const bw = winW * 0.15, bh = winH * (0.35 + ((i * 37) % 5) * 0.09);
    return `<rect x="${winX + winW * fx}" y="${winY + winH - bh}" width="${bw}" height="${bh}" fill="${['#8fb3cc', '#7aa2bf', '#9cc0d6'][i % 3]}"/>`;
  }).join('');
  const win = `<rect x="${winX}" y="${winY}" width="${winW}" height="${winH}" rx="${10 * u}" fill="${sky}"/>
    ${skyline}
    <rect x="${winX}" y="${winY}" width="${winW}" height="${winH}" rx="${10 * u}" fill="none" ${stroke(LINE * u)}/>
    <path d="M${winX + winW / 2},${winY} L${winX + winW / 2},${winY + winH} M${winX},${winY + winH / 2} L${winX + winW},${winY + winH / 2}" ${stroke(LINE * u)}/>`;
  // Whiteboard on the right, where the brand or a key line can go
  const bW = (portrait ? 380 : 460) * u, bH = (portrait ? 250 : 280) * u;
  const bX = portrait ? w * 0.58 : w - bW - w * 0.07, bY = portrait ? h * 0.27 : h * 0.15;
  const boardSvg = `<rect x="${bX}" y="${bY}" width="${bW}" height="${bH}" rx="${12 * u}" fill="#ffffff" ${stroke(LINE * u)}/>
    <path d="M${bX + 40 * u},${bY + bH - 60 * u} L${bX + 130 * u},${bY + bH - 120 * u} L${bX + 220 * u},${bY + bH - 90 * u} L${bX + 330 * u},${bY + 70 * u}" fill="none" stroke="${accent}" stroke-width="${10 * u}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M${bX + 300 * u},${bY + 64 * u} L${bX + 334 * u},${bY + 66 * u} L${bX + 326 * u},${bY + 98 * u}" fill="none" stroke="${accent}" stroke-width="${10 * u}" stroke-linecap="round" stroke-linejoin="round"/>
    ${board ? `<text x="${bX + 30 * u}" y="${bY + 52 * u}" font-family="Nunito" font-weight="800" font-size="${36 * u}" fill="${INK}">${board}</text>` : ''}`;
  // Plant
  const pX = w * 0.9, pY = floorY;
  const plant = `<path d="M${pX - 40 * u},${pY - 90 * u} L${pX + 40 * u},${pY - 90 * u} L${pX + 30 * u},${pY} L${pX - 30 * u},${pY}Z" fill="#d1774f" ${stroke(LINE * u)}/>
    ${[-50, -20, 10, 40].map((a, i) => `<ellipse cx="${pX + a * u * 0.8}" cy="${pY - (150 + (i % 2) * 40) * u}" rx="${26 * u}" ry="${62 * u}" transform="rotate(${a * 0.6} ${pX + a * u * 0.8} ${pY - (150 + (i % 2) * 40) * u})" fill="${['#4f9d69', '#5fb37a'][i % 2]}" ${stroke(LINE_FINE * u)}/>`).join('')}`;
  // Floor with a soft skirting line
  const room = `<rect width="${w}" height="${h}" fill="${wall}"/>
    <rect y="${floorY}" width="${w}" height="${h - floorY}" fill="${floor}"/>
    <rect y="${floorY - 14 * u}" width="${w}" height="${14 * u}" fill="${shade(wall, 0.12)}"/>
    <path d="M0,${floorY} L${w},${floorY}" ${stroke(LINE * u)}/>
    ${[0.25, 0.5, 0.75].map((f) => `<path d="M${w * f},${floorY + 10 * u} L${w * f - 60 * u},${h}" stroke="${shade(floor, 0.1)}" stroke-width="${4 * u}"/>`).join('')}`;
  return { svg: room + win + boardSvg + plant, floorY };
}

// Plain studio backdrop: soft colour, two blobs, a floor shadow. Good for
// talking-to-camera explainers where the words should carry the scene.
function studio(w, h, { color = '#ffe8c7', accent = '#f4a261' } = {}) {
  const floorY = Math.round(h * 0.86);
  const u = Math.min(w, h) / 1080;
  return {
    floorY,
    svg: `<rect width="${w}" height="${h}" fill="${color}"/>
      <circle cx="${w * 0.15}" cy="${h * 0.2}" r="${260 * u}" fill="${tint(accent, 0.55)}"/>
      <circle cx="${w * 0.88}" cy="${h * 0.62}" r="${200 * u}" fill="${tint(accent, 0.7)}"/>
      <rect y="${floorY}" width="${w}" height="${h - floorY}" fill="${shade(color, 0.06)}"/>`,
  };
}

export const BACKGROUNDS = { office, studio };

export function background(name, w, h, opts) {
  return (BACKGROUNDS[name] ?? studio)(w, h, opts);
}

// Soft contact shadow under a standing character.
export const groundShadow = (x, y, scale = 1) =>
  `<ellipse cx="${x}" cy="${y}" rx="${120 * scale}" ry="${16 * scale}" fill="#000000" opacity="0.12"/>`;
