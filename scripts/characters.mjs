// Character pictures for her to choose from and approve.
//
//   node scripts/characters.mjs takes <out.png> <a.json> <b.json> [<c.json>]
//       up to three versions side by side, labelled A, B, C, each with a
//       close-up of the face — she picks one and says what to change
//   node scripts/characters.mjs sheet <out.png> <character.json>
//       one character: full body, five expressions, three gestures — the
//       final check before the character is saved for every future video
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { drawCharacter, svgDoc } from '../kit/character.mjs';
import { groundShadow } from '../kit/backgrounds/index.mjs';
import { INK } from '../kit/style.mjs';
import { rasterise } from '../engine/raster.mjs';
import { isMain } from '../engine/tools.mjs';
import { wrap } from '../engine/overlays.mjs';
import { characterProblems, assertValid } from '../engine/validate.mjs';

const PAPER = '#fbf6ee';
const text = (x, y, s, size, weight = 800, fill = INK) =>
  `<text x="${x}" y="${y}" font-family="Nunito" font-weight="${weight}" font-size="${size}" text-anchor="middle" fill="${fill}">${s.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>`;
const headCrop = (char, state, x, y, size) =>
  `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="-205 -965 410 410">${drawCharacter(char, state)}</svg>`;
const load = (p) => { const c = JSON.parse(readFileSync(p, 'utf8')); assertValid(characterProblems(c, p), 'Character file'); return c; };
const save = (out, w, h, body) => { mkdirSync(dirname(out), { recursive: true }); writeFileSync(out, rasterise(svgDoc(w, h, body, PAPER))); return out; };

export function takes(out, files) {
  const chars = files.map(load);
  const col = 560, W = col * chars.length, H = 1600;
  let body = '';
  chars.forEach((c, i) => {
    const cx = col * i + col / 2;
    body += text(cx, 90, String.fromCharCode(65 + i), 80);
    body += headCrop(c, { expression: 'cheerful', gaze: [0, 0.1] }, cx - 170, 120, 340);
    body += groundShadow(cx, 1440, 1) + `<g transform="translate(${cx},1440)">${drawCharacter(c, { gesture: 'idle', expression: 'neutral', gaze: [0, 0.1] })}</g>`;
    if (c.role) wrap(c.role, 28).slice(0, 2).forEach((l, j) => { body += text(cx, 1505 + j * 34, l, 28, 600, '#6b5e57'); });
  });
  return save(out, W, H, body);
}

export function sheet(out, file) {
  const c = load(file);
  const W = 2200, H = 1300;
  let body = text(W / 2, 80, c.name ?? c.id, 64) + (c.role ? text(W / 2, 128, c.role, 30, 600, '#6b5e57') : '');
  body += groundShadow(260, 1180, 1) + `<g transform="translate(260,1180)">${drawCharacter(c, { expression: 'cheerful', gaze: [0, 0.1] })}</g>`;
  ['neutral', 'happy', 'surprised', 'thinking', 'worried'].forEach((e, i) => {
    body += headCrop(c, { expression: e }, 520 + i * 330, 170, 300) + text(670 + i * 330, 500, e, 30, 700);
  });
  ['wave', 'explain', 'pose'].forEach((g, i) => {
    const x = 800 + i * 520;
    body += groundShadow(x, 1250, 0.6) + `<g transform="translate(${x},1250) scale(0.68)">${drawCharacter(c, { gesture: g, expression: 'cheerful' })}</g>`;
  });
  return save(out, W, H, body);
}

if (isMain(import.meta.url)) {
  const [mode, out, ...files] = process.argv.slice(2);
  try {
    if (mode === 'takes' && files.length >= 1 && files.length <= 3) console.log(takes(out, files));
    else if (mode === 'sheet' && files.length === 1) console.log(sheet(out, files[0]));
    else { console.error('Usage: characters.mjs takes <out.png> <a.json> [b.json] [c.json] | sheet <out.png> <character.json>'); process.exit(2); }
  } catch (e) { console.error(e.message); process.exit(1); }
}
