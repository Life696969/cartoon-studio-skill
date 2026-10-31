// Renders the base-kit style sheets (stage 0 approval) to out/kit-sheet/:
//   1-characters  the four sample characters
//   2-faces       9 talking mouths + 8 expressions, close up
//   3-gestures    the gesture set on one character
//   4-scene-vertical / 5-scene-wide   a sample dialogue still in both formats
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drawCharacter, svgDoc } from '../kit/character.mjs';
import { MOUTH_NAMES } from '../kit/parts/face.mjs';
import { EXPRESSIONS, GESTURES } from '../kit/presets.mjs';
import { background, groundShadow } from '../kit/backgrounds/index.mjs';
import { INK } from '../kit/style.mjs';
import { renderPng } from './render.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = (name) => join(root, 'out', 'kit-sheet', `${name}.png`);
const charDir = join(root, 'samples', 'characters');
const cast = Object.fromEntries(readdirSync(charDir).filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(join(charDir, f), 'utf8'))).map((c) => [c.id, c]));

const PAPER = '#f6f1e7';
const label = (x, y, text, size = 34, weight = 700, fill = INK) =>
  `<text x="${x}" y="${y}" font-family="Nunito" font-size="${size}" font-weight="${weight}" text-anchor="middle" fill="${fill}">${text}</text>`;
const title = (w, text, sub) => label(w / 2, 80, text, 52, 800) + (sub ? label(w / 2, 128, sub, 28, 400, '#6b5e57') : '');

// Head close-up: crop a character drawing to its head with a nested viewport.
const headCrop = (char, state, x, y, size) =>
  `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="-205 -965 410 410">${drawCharacter(char, state)}</svg>`;

// 1 — the cast
{
  const order = ['meera', 'rohan', 'kapoor', 'zoya'];
  const W = 1800, H = 1240;
  let body = title(W, 'Cartoon Studio — base kit', 'Four sample characters, all built from the same parts');
  order.forEach((id, i) => {
    const x = 225 + i * 450, c = cast[id];
    body += groundShadow(x, 1100, 1) + `<g transform="translate(${x},1100)">${drawCharacter(c, { expression: 'neutral', gaze: [0, 0.1] })}</g>`;
    body += label(x, 1160, c.name) + label(x, 1200, c.role, 24, 400, '#6b5e57');
  });
  renderPng(svgDoc(W, H, body, PAPER), out('1-characters'));
}

// 2 — mouths and expressions
{
  const W = 1800, H = 1060, size = 190;
  let body = title(W, 'Faces', 'Top: the 9 talking mouths lip-sync uses. Bottom: expressions.');
  const mouthHint = { X: 'rest', A: 'M B P', B: 'most sounds', C: 'eh, ae', D: 'aa', E: 'o, er', F: 'oo, w', G: 'f, v', H: 'l' };
  MOUTH_NAMES.forEach((m, i) => {
    const x = 20 + i * 196;
    body += headCrop(cast.meera, { expression: 'neutral', mouth: m }, x, 170, size);
    body += label(x + size / 2, 390, m, 32) + label(x + size / 2, 422, mouthHint[m], 22, 400, '#6b5e57');
  });
  Object.keys(EXPRESSIONS).forEach((e, i) => {
    const x = 30 + i * 220;
    body += headCrop(cast.rohan, { expression: e }, x, 520, 210);
    body += label(x + 105, 760, e, 28);
  });
  Object.keys(EXPRESSIONS).forEach((e, i) => {
    const x = 30 + i * 220;
    body += headCrop(cast.zoya, { expression: e }, x, 790, 210);
  });
  renderPng(svgDoc(W, H, body, PAPER), out('2-faces'));
}

// 3 — gestures, two rows of five with room for outstretched arms
{
  const names = Object.keys(GESTURES);
  const W = 2100, H = 2060, perRow = 5;
  let body = title(W, 'Gestures', 'Each one is just three angles per arm, so new ones are cheap to add');
  const moods = { idle: 'neutral', wave: 'happy', point: 'confident', pointUp: 'surprised', explain: 'neutral', clasp: 'happy', shrug: 'worried', thumbsUp: 'confident', think: 'thinking', present: 'happy' };
  names.forEach((g, i) => {
    const x = 230 + (i % perRow) * 410, y = 1000 + Math.floor(i / perRow) * 960;
    const who = i % 2 ? cast.zoya : cast.meera;
    body += groundShadow(x, y, 0.8) + `<g transform="translate(${x},${y}) scale(0.82)">${drawCharacter(who, { gesture: g, expression: moods[g] })}</g>`;
    body += label(x, y + 56, g, 30);
  });
  renderPng(svgDoc(W, H, body, PAPER), out('3-gestures'));
}

// Caption card used on the sample scenes.
const caption = (cx, y, lines, size) => {
  const w = Math.max(...lines.map((l) => l.length)) * size * 0.56 + size * 1.6;
  const h = lines.length * size * 1.25 + size * 0.9;
  return `<rect x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" rx="${size * 0.5}" fill="#ffffff" stroke="${INK}" stroke-width="6"/>`
    + lines.map((l, i) => `<text x="${cx}" y="${y + size * 1.15 + i * size * 1.25}" font-family="Nunito" font-weight="800" font-size="${size}" text-anchor="middle" fill="${INK}">${l}</text>`).join('');
};

// Speech bubble with a tail pointing at the speaker's head.
const bubble = (cx, y, lines, size, tail) => {
  const w = Math.max(...lines.map((l) => l.length)) * size * 0.56 + size * 1.6;
  const h = lines.length * size * 1.25 + size * 0.9;
  const bx = Math.min(Math.max(cx, tail[0] - w / 2 + 60), tail[0] + w / 2 - 60);
  const tailBase = `${bx - 30},${y + h - 4} ${bx + 30},${y + h - 4}`;
  return `<polygon points="${tailBase} ${tail[0]},${tail[1]}" fill="#ffffff" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>`
    + `<rect x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" rx="${size * 0.6}" fill="#ffffff" stroke="${INK}" stroke-width="6"/>`
    + `<polygon points="${bx - 27},${y + h - 8} ${bx + 27},${y + h - 8} ${tail[0]},${tail[1] - 10}" fill="#ffffff"/>`
    + lines.map((l, i) => `<text x="${cx}" y="${y + size * 1.15 + i * size * 1.25}" font-family="Nunito" font-weight="800" font-size="${size}" text-anchor="middle" fill="${INK}">${l}</text>`).join('');
};

// Rohan (customer) is speaking; Meera (founder) listens.
const sceneCast = (floorY, s, xs) =>
  groundShadow(xs[0], floorY, s) + groundShadow(xs[1], floorY, s)
  + `<g transform="translate(${xs[0]},${floorY}) scale(${s})">${drawCharacter(cast.rohan, { gesture: 'explain', expression: 'worried', mouth: 'C', gaze: [0.9, 0] })}</g>`
  + `<g transform="translate(${xs[1]},${floorY}) scale(${s})">${drawCharacter(cast.meera, { gesture: 'clasp', expression: 'thinking', gaze: [-0.9, 0] })}</g>`;

// 4 — vertical 9:16 sample still (text kept out of the Reels/Shorts UI zones)
{
  const W = 1080, H = 1920;
  const bg = background('office', W, H, { board: 'TiffinPal' });
  const s = 1.0, xs = [290, 790];
  const headTop = bg.floorY - 900 * s;
  const body = bg.svg + sceneCast(bg.floorY, s, xs)
    + bubble(W / 2, 250, ['My lunch is always', 'cold by 1 pm.'], 64, [xs[0] + 40, headTop + 10]);
  renderPng(svgDoc(W, H, body), out('4-scene-vertical'));
}

// 5 — wide 16:9 sample still with a bottom caption
{
  const W = 1920, H = 1080;
  const bg = background('office', W, H, { board: 'TiffinPal' });
  const body = bg.svg + sceneCast(bg.floorY, 0.78, [760, 1160]) + caption(W / 2, 880, ['My lunch is always cold by 1 pm.'], 50);
  renderPng(svgDoc(W, H, body), out('5-scene-wide'));
}

console.log('sheets written to out/kit-sheet/');
