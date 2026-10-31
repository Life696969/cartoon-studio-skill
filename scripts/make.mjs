// One command per step of making a video. The skill runs these in order
// and stops between them for her OK.
//
//   node scripts/make.mjs <video-folder> voice     AI lines + her recordings -> voices, lip-sync
//   node scripts/make.mjs <video-folder> stills    one picture per moment + a contact sheet
//   node scripts/make.mjs <video-folder> preview   quick half-size video
//   node scripts/make.mjs <video-folder> final     full-quality video, mastered sound
//
// A video folder holds scene.json, lines.json and (for her own voice)
// recordings/<line id>.<wav|m4a|mp3|...>. Everything made goes in work/,
// stills/, preview.mp4 and final.mp4 inside that folder. Steps reuse earlier
// results when nothing they depend on changed, so re-running is cheap.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, statfsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ROOT, kokoroConfig, isMain } from '../engine/tools.mjs';
import { analyse } from '../engine/lipsync.mjs';
import { toWav, levelLine, mixAndMaster, effect } from '../engine/audio.mjs';
import { layout } from '../engine/timeline.mjs';
import { loadScene, frameRenderer, renderVideo } from '../engine/render.mjs';
import { rasterise, bbox } from '../engine/raster.mjs';
import { svgDoc } from '../kit/character.mjs';

const AUDIO_EXT = ['.wav', '.m4a', '.mp3', '.aac', '.ogg', '.webm', '.flac', '.mp4'];
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
const same = (p, meta) => existsSync(p) && JSON.stringify(readJson(p)) === JSON.stringify(meta);

class Stop extends Error {}

function paths(dir) {
  const work = join(dir, 'work'), voice = join(work, 'voice');
  return { dir, work, voice, stills: join(dir, 'stills'), recordings: join(dir, 'recordings') };
}

// ---------- voice ----------

export function voice(dir) {
  const P = paths(dir);
  mkdirSync(P.voice, { recursive: true });
  const lines = readJson(join(dir, 'lines.json'));

  // Her own recordings: any common audio format, converted to WAV.
  const missing = [];
  for (const l of lines.filter((x) => x.voice === 'own')) {
    const src = existsSync(P.recordings) && readdirSync(P.recordings).find((f) => f.startsWith(`${l.id}.`) && AUDIO_EXT.some((e) => f.toLowerCase().endsWith(e)));
    if (!src) { missing.push(l); continue; }
    const s = statSync(join(P.recordings, src));
    const meta = { text: l.text, source: src, size: s.size, mtime: s.mtimeMs };
    if (!same(join(P.voice, `${l.id}.meta.json`), meta)) {
      toWav(join(P.recordings, src), join(P.voice, `${l.id}.wav`));
      writeFileSync(join(P.voice, `${l.id}.meta.json`), JSON.stringify(meta));
    }
  }
  if (missing.length) {
    throw new Stop(`Waiting for your recordings. Please save these in ${P.recordings}:\n`
      + missing.map((l) => `  ${l.id}  (any format, e.g. ${l.id}.m4a)  "${l.text}"`).join('\n'));
  }

  // AI lines: only (re)generate the ones whose words or voice changed.
  const ai = lines.filter((x) => x.voice !== 'own')
    .filter((l) => !same(join(P.voice, `${l.id}.meta.json`), { text: l.text, voice: l.voice, speed: l.speed ?? 1 }));
  if (ai.length) {
    const k = kokoroConfig();
    const list = join(P.work, 'ai-lines.json');
    writeFileSync(list, JSON.stringify(ai));
    execFileSync(k.python, ['-I', join(ROOT, 'scripts', 'voice.py'), list, P.voice, k.model, k.voices], { stdio: ['ignore', 'ignore', 'pipe'] });
    rmSync(list, { force: true });
    for (const l of ai) writeFileSync(join(P.voice, `${l.id}.meta.json`), JSON.stringify({ text: l.text, voice: l.voice, speed: l.speed ?? 1 }));
  }

  // Lip-sync and levelling, redone only when the voice file changed.
  for (const l of lines) {
    const wav = join(P.voice, `${l.id}.wav`);
    const stamp = { size: statSync(wav).size, mtime: statSync(wav).mtimeMs, text: l.text };
    const done = join(P.voice, `${l.id}.done.json`);
    if (same(done, stamp)) continue;
    analyse(wav, l.text, join(P.voice, `${l.id}.mouth.json`));
    levelLine(wav, join(P.voice, `${l.id}.level.wav`));
    writeFileSync(done, JSON.stringify(stamp));
  }
  return { lines: lines.length, generated: ai.length };
}

// ---------- stills ----------

export function stills(dir) {
  const P = paths(dir);
  const loaded = loadScene(dir);
  const r = frameRenderer(loaded, P.voice);
  // One still in the middle of every line, plus mid-way through every action.
  const marks = r.beats.map((b, i) => ({ t: b.start + (b.end - b.start) * 0.45, label: `line-${String(i + 1).padStart(2, '0')}` }));
  const { beats } = layout(loaded.scene, loaded.lines, P.voice);
  for (const m of loaded.scene.moments ?? []) {
    const base = m.after ? beats.find((b) => b.line === m.after).end + (m.plus ?? 0) : m.at;
    if (m.action) marks.push({ t: base + (m.dur ?? 1) * 0.5, label: `${m.who}-${m.action}` });
  }
  marks.sort((a, b) => a.t - b.t);
  rmSync(P.stills, { recursive: true, force: true });
  mkdirSync(P.stills, { recursive: true });
  const files = marks.map((m, i) => {
    const file = join(P.stills, `${String(i + 1).padStart(2, '0')}-${m.label}.png`);
    writeFileSync(file, rasterise(r.svgAt(m.t, { still: true })));
    return file;
  });
  // Contact sheet: every still side by side, small, for a one-glance check.
  // Each tile is its own viewport, so nothing spills into the next one.
  const cols = Math.min(4, marks.length), rows = Math.ceil(marks.length / cols);
  const tw = r.w / 3, th = r.h / 3, pad = 12;
  const tiles = marks.map((m, i) => {
    const inner = r.svgAt(m.t, { still: true }).replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
    return `<svg x="${(i % cols) * (tw + pad) + pad}" y="${Math.floor(i / cols) * (th + pad) + pad}" width="${tw}" height="${th}" viewBox="0 0 ${r.w} ${r.h}">${inner}</svg>`;
  }).join('');
  const contact = join(P.stills, 'contact-sheet.png');
  writeFileSync(contact, rasterise(svgDoc(cols * (tw + pad) + pad, rows * (th + pad) + pad, tiles, '#d9d4cc')));
  return { files, contact, warnings: edgeCheck(r) };
}

// Sample the whole video and report any time a character pokes out of the
// frame (a twirl or wave too close to the edge). Plain sentences for her.
function edgeCheck(r) {
  const warnings = [];
  for (const c of r.cast) {
    const name = r.chars[c.id].name ?? c.id;
    let run = null;
    const flush = () => { if (run) warnings.push(`${name} goes past the ${run.side} edge from ${run.from.toFixed(1)} s to ${run.to.toFixed(1)} s`); run = null; };
    for (let t = 0; t <= r.duration; t += 0.25) {
      const b = bbox(r.characterSvgAt(c.id, t));
      const side = !b ? null : b.x < -2 ? 'left' : b.x + b.width > r.w + 2 ? 'right' : b.y < -2 ? 'top' : null;
      if (side && run?.side === side) run.to = t;
      else { flush(); if (side) run = { side, from: t, to: t }; }
    }
    flush();
  }
  return warnings;
}

// ---------- preview / final ----------

// Preview and final share the same mastered mix, so what she approves in the
// preview is exactly what she hears in the final.
function mix(dir) {
  const P = paths(dir);
  const loaded = loadScene(dir);
  const { beats, duration } = layout(loaded.scene, loaded.lines, P.voice);
  const levelled = beats.map((b) => ({ start: b.start, wav: b.wav.replace(/\.wav$/, '.level.wav') }));
  // A whoosh under every twirl and a chime under every swap, unless the scene
  // says "sfx": false.
  const sfx = loaded.scene.sfx === false ? [] : (loaded.scene.moments ?? []).filter((m) => m.action).map((m, i) => {
    const at = m.after ? beats.find((b) => b.line === m.after).end + (m.plus ?? 0) : m.at;
    const kind = m.action === 'twirl' ? 'whoosh' : 'chime';
    return { start: at, wav: effect(kind, m.dur ?? 1, join(P.work, `sfx-${i + 1}-${kind}.wav`)) };
  });
  return mixAndMaster([...levelled, ...sfx], duration, join(P.work, 'mix.wav'));
}

function checkDisk(dir, needGb) {
  const s = statfsSync(dir);
  const free = (s.bavail * s.bsize) / 1e9;
  if (free < needGb) throw new Stop(`Only ${free.toFixed(1)} GB free on this drive; making the video needs about ${needGb} GB. Free some space and try again.`);
}

export async function preview(dir) {
  checkDisk(dir, 1);
  const m = mix(dir);
  return { video: await renderVideo(dir, paths(dir).voice, join(dir, 'preview.mp4'), 'preview', m.out), loudness: m.after };
}

export async function final(dir) {
  checkDisk(dir, 2);
  const m = mix(dir);
  return { video: await renderVideo(dir, paths(dir).voice, join(dir, 'final.mp4'), 'final', m.out), loudness: m.after };
}

if (isMain(import.meta.url)) {
  const [dirArg, step] = process.argv.slice(2);
  const dir = resolve(dirArg ?? '.');
  const steps = { voice, stills, preview, final };
  if (!steps[step]) { console.error('Usage: make.mjs <video-folder> voice|stills|preview|final'); process.exit(2); }
  Promise.resolve()
    .then(() => (step === 'voice' ? null : voice(dir)))
    .then(() => steps[step](dir))
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((e) => { console.error(e instanceof Stop ? e.message : `Something went wrong: ${e.message}`); process.exit(e instanceof Stop ? 3 : 1); });
}
