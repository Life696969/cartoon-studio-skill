// Voice samples, so they choose by ear, not by label.
//
//   node scripts/voices.mjs <out-dir> "<a line the character says>" <voice> <voice> [<voice>]
//
// Writes one WAV per voice and samples.wav: every voice saying the same
// line, in the order given, with a short pause between them.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT, kokoroConfig, toolPath, isMain } from '../engine/tools.mjs';

export function samples(outDir, text, voices) {
  const k = kokoroConfig();
  mkdirSync(outDir, { recursive: true });
  const list = join(outDir, 'samples-lines.json');
  writeFileSync(list, JSON.stringify(voices.map((v, i) => ({
    id: `${i + 1}-${v}`, text, voice: v, lang: v.startsWith('b') ? 'en-gb' : v.startsWith('h') ? 'hi' : 'en-us',
  }))));
  try {
    execFileSync(k.python, ['-I', join(ROOT, 'scripts', 'voice.py'), list, outDir, k.model, k.voices], { stdio: ['ignore', 'ignore', 'pipe'] });
  } finally {
    rmSync(list, { force: true });
  }
  const files = voices.map((v, i) => join(outDir, `${i + 1}-${v}.wav`));
  const gap = 'anullsrc=r=24000:cl=mono:d=0.8';
  const inputs = files.flatMap((f, i) => (i ? ['-f', 'lavfi', '-t', '0.8', '-i', gap, '-i', f] : ['-i', f]));
  const n = files.length * 2 - 1;
  const out = join(outDir, 'samples.wav');
  execFileSync(toolPath('ffmpeg'), ['-hide_banner', '-loglevel', 'error', '-y', ...inputs,
    '-filter_complex', `${Array.from({ length: n }, (_, i) => `[${i}:a]`).join('')}concat=n=${n}:v=0:a=1`, out]);
  return { samples: out, files };
}

if (isMain(import.meta.url)) {
  const [outDir, text, ...voices] = process.argv.slice(2);
  if (!outDir || !text || voices.length < 2 || voices.length > 3) {
    console.error('Usage: voices.mjs <out-dir> "<line>" <voice> <voice> [<voice>]'); process.exit(2);
  }
  try { console.log(JSON.stringify(samples(outDir, text, voices), null, 2)); } catch (e) { console.error(e.message); process.exit(1); }
}
