// Voice recording -> mouth timeline, using Rhubarb Lip Sync (free, MIT).
// Giving Rhubarb the spoken text makes it far more accurate, so we always do.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { toolPath } from './tools.mjs';

export function analyse(wavPath, text, outJson) {
  const scratch = mkdtempSync(join(tmpdir(), 'cs-lipsync-'));
  try {
    const dialog = join(scratch, 'dialog.txt');
    writeFileSync(dialog, text, 'utf8');
    execFileSync(toolPath('rhubarb'), [
      '-f', 'json', '--extendedShapes', 'GHX', '-d', dialog, '-o', outJson, '--quiet', wavPath,
    ], { stdio: ['ignore', 'ignore', 'pipe'] });
  } finally {
    rmSync(scratch, { recursive: true, force: true });
  }
  return readCues(outJson);
}

export function readCues(jsonPath) {
  return JSON.parse(readFileSync(jsonPath, 'utf8')).mouthCues; // [{start, end, value}]
}

// Mouth at time t (seconds from the start of the line). Rhubarb already
// avoids flicker; we additionally hold any shape for at least `minHold`
// seconds so two-frame blips don't strobe on screen.
export function mouthAt(cues, t, minHold = 1 / 15) {
  let current = 'X';
  for (const c of cues) {
    if (c.start > t) break;
    if (c.end - c.start < minHold && c.end <= t) continue;
    current = c.value;
  }
  return current;
}
