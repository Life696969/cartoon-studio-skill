// House style for every character: one outline weight, one ink colour,
// flat fills with a single cel-shade tone. Parts read these constants so a
// style change happens here, never inside a part.

export const INK = '#2b2220';
export const LINE = 6;          // outline width in kit units (character is ~1000 tall)
export const LINE_FINE = 4;     // inner details: brows, mouth lines, folds

export const SKIN = {
  porcelain: '#fde3cf',
  light: '#f6cfae',
  wheat: '#e9b48a',
  tan: '#d39a6a',
  brown: '#a86b45',
  deep: '#6e432b',
};

export const HAIR = {
  black: '#1f1a1c',
  darkbrown: '#3d2a22',
  brown: '#6b4630',
  auburn: '#8e3b26',
  blonde: '#e1b866',
  grey: '#a9a6a6',
  white: '#e9e6e1',
  blue: '#2f5d9b',
};

export const MOUTH = { inside: '#5c1f24', tongue: '#e57a80', teeth: '#ffffff' };
export const BLUSH = '#ff8f8f';
export const EYE_WHITE = '#ffffff';

// Cel shade: the same colour, darker, used on the side away from the light
// (light comes from the viewer's top-left).
export function shade(hex, amount = 0.18) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const k = 1 - amount;
  const to = (v) => Math.round(v * k).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export function tint(hex, amount = 0.25) {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  const to = (v) => Math.round(v + (255 - v) * amount).toString(16).padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`;
}

export const stroke = (w = LINE) =>
  `stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

// Resolve a palette name or pass a raw hex straight through.
export const pick = (table, value) => table[value] ?? value;
