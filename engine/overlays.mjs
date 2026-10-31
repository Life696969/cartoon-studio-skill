// Text on top of the picture: speech bubbles and captions. Sizes are in
// output pixels; lines are wrapped by character count, which is close
// enough for one bold sans font.
import { INK } from '../kit/style.mjs';

const FONT = `font-family="Nunito" font-weight="800"`;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Balanced wrap: as few lines as fit `maxChars`, with similar lengths, so a
// bubble never ends on one orphaned word.
export function wrap(text, maxChars) {
  const greedy = (limit) => {
    const lines = [];
    let line = '';
    for (const word of text.trim().split(/\s+/)) {
      if (line && (line + ' ' + word).length > limit) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
    }
    if (line) lines.push(line);
    return lines;
  };
  const count = greedy(maxChars).length;
  for (let limit = Math.ceil(text.length / count); limit < maxChars; limit++) {
    const lines = greedy(limit);
    if (lines.length === count) return lines;
  }
  return greedy(maxChars);
}

const boxSize = (lines, size) => ({
  w: Math.max(...lines.map((l) => l.length)) * size * 0.52 + size * 1.4,
  h: lines.length * size * 1.25 + size * 0.9,
});

const textLines = (cx, y, lines, size) => lines
  .map((l, i) => `<text x="${cx}" y="${y + size * 1.15 + i * size * 1.25}" ${FONT} font-size="${size}" text-anchor="middle" fill="${INK}">${esc(l)}</text>`)
  .join('');

// Speech bubble centred on cx with a tail to `tail` (the speaker's head).
// `opacity` lets a bubble pop in and out.
export function bubble(cx, y, lines, size, tail, opacity = 1) {
  const { w, h } = boxSize(lines, size);
  const bx = Math.min(Math.max(tail[0], cx - w / 2 + 70), cx + w / 2 - 70);
  return `<g opacity="${opacity}">
    <polygon points="${bx - 30},${y + h - 4} ${bx + 30},${y + h - 4} ${tail[0]},${tail[1]}" fill="#ffffff" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    <rect x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" rx="${size * 0.6}" fill="#ffffff" stroke="${INK}" stroke-width="6"/>
    <polygon points="${bx - 27},${y + h - 8} ${bx + 27},${y + h - 8} ${tail[0]},${tail[1] - 10}" fill="#ffffff"/>
    ${textLines(cx, y, lines, size)}
  </g>`;
}

// Plain caption card, for wide videos.
export function caption(cx, y, lines, size, opacity = 1) {
  const { w, h } = boxSize(lines, size);
  return `<g opacity="${opacity}"><rect x="${cx - w / 2}" y="${y}" width="${w}" height="${h}" rx="${size * 0.5}" fill="#ffffff" stroke="${INK}" stroke-width="6"/>
    ${textLines(cx, y, lines, size)}</g>`;
}
