// Write one SVG to a PNG file (used by the style sheets).
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { rasterise } from '../engine/raster.mjs';

export function renderPng(svg, outPath, width) {
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, rasterise(svg, width));
  return outPath;
}
