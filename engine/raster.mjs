// SVG -> PNG with resvg. Only the bundled fonts in kit/fonts are loaded:
// scanning the computer's system fonts on every frame made renders ~7x
// slower, and bundling keeps text identical on Windows and Mac.
import { Resvg } from '@resvg/resvg-js';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './tools.mjs';

const fontDir = join(ROOT, 'kit', 'fonts');
const FONT = {
  loadSystemFonts: false,
  fontFiles: readdirSync(fontDir).filter((f) => /\.(ttf|otf)$/i.test(f)).map((f) => join(fontDir, f)),
  defaultFontFamily: 'Nunito',
};

// Bounding box of everything drawn (strokes included), without rendering.
export function bbox(svg) {
  const b = new Resvg(svg, { font: FONT }).getBBox();
  return b ? { x: b.x, y: b.y, width: b.width, height: b.height } : null;
}

export function rasterise(svg, width) {
  const fitTo = width ? { mode: 'width', value: width } : { mode: 'original' };
  return new Resvg(svg, { fitTo, font: FONT }).render().asPng();
}
