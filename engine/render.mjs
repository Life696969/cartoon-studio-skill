// Scene -> MP4. Each frame is drawn as SVG, rasterised by resvg (no browser)
// and piped straight into ffmpeg, so no frame files ever touch the disk.
//
//   node engine/render.mjs <scene-dir> --voice <dir> --out <file.mp4> [--quality preview|final] [--still <seconds>]
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, renameSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { drawCharacter, svgDoc } from '../kit/character.mjs';
import { background, groundShadow } from '../kit/backgrounds/index.mjs';
import { compile } from './timeline.mjs';
import { bubble, caption, wrap } from './overlays.mjs';
import { toolPath, studioHome, isMain } from './tools.mjs';
import { rasterise } from './raster.mjs';
import { sceneProblems, characterProblems, assertValid } from './validate.mjs';

export const FORMATS = {
  vertical: { w: 1080, h: 1920, charScale: 1.0 },
  wide: { w: 1920, h: 1080, charScale: 0.78 },
};
const QUALITY = {
  preview: { scale: 0.5, crf: 26, preset: 'veryfast' },
  final: { scale: 1, crf: 18, preset: 'medium' },
};
const CHAR_HEIGHT = 900; // kit units from feet to top of hair, roughly

export function loadScene(sceneDir) {
  const scene = JSON.parse(readFileSync(join(sceneDir, 'scene.json'), 'utf8'));
  const lines = JSON.parse(readFileSync(join(sceneDir, 'lines.json'), 'utf8'));
  // A cast member's character file: an explicit path (relative to the scene),
  // else her saved character of that id in the studio.
  const charPath = (c) => (c.character ? resolve(sceneDir, c.character) : join(studioHome(), 'characters', `${c.id}.json`));
  const chars = Object.fromEntries(scene.cast.map((c) => {
    const p = charPath(c);
    if (!existsSync(p)) throw new Error(`No saved character "${c.id}" (looked for ${p}).`);
    const ch = JSON.parse(readFileSync(p, 'utf8'));
    assertValid(characterProblems(ch, c.id), `Character ${c.id}`);
    return [c.id, ch];
  }));
  assertValid(sceneProblems(scene, lines), 'The scene');
  return { scene, lines, chars };
}

// Try-on swap: a glowing line sweeps down the character; above it the new
// outfit, below it the old one, with a few sparkles riding the line.
function swapEffect(character, st, id) {
  const top = -960, k = st.swap.k, y = top + (0 - top) * k;
  const clip = (cid, y0, y1) => `<clipPath id="${cid}"><rect x="-400" y="${y0}" width="800" height="${y1 - y0}"/></clipPath>`;
  const sparkle = (sx, sy, r) => `<path d="M${sx},${sy - r} Q${sx},${sy} ${sx + r},${sy} Q${sx},${sy} ${sx},${sy + r} Q${sx},${sy} ${sx - r},${sy} Q${sx},${sy} ${sx},${sy - r}Z" fill="#fff6c8"/>`;
  const sparks = [-150, -70, 20, 110, 170].map((sx, i) => sparkle(sx, y + ((i * 37) % 40) - 20, 14 + ((i * 13 + Math.round(k * 50)) % 12))).join('');
  return `${clip(`${id}-new`, top - 200, y)}${clip(`${id}-old`, y, 100)}
    <g clip-path="url(#${id}-new)">${drawCharacter(character, { ...st, outfit: st.swap.to })}</g>
    <g clip-path="url(#${id}-old)">${drawCharacter(character, { ...st, outfit: st.swap.from })}</g>
    <rect x="-220" y="${y - 7}" width="440" height="14" rx="7" fill="#ffffff" opacity="0.85"/>
    <rect x="-240" y="${y - 22}" width="480" height="44" rx="22" fill="#fff3a6" opacity="0.25"/>
    ${sparks}`;
}

export function frameRenderer({ scene, lines, chars }, voiceDir) {
  const fmt = FORMATS[scene.format] ?? FORMATS.vertical;
  const { w, h } = fmt;
  const bg = background(scene.background?.name, w, h, scene.background?.options);
  const tl = compile(scene, lines, voiceDir);
  const place = (c) => ({ x: c.x * w, s: (c.scale ?? 1) * fmt.charScale });

  // still: true for check pictures, which must never catch a mid-blink face.
  function svgAt(t, { still = false } = {}) {
    let body = bg.svg;
    for (const c of scene.cast) {
      const { x, s } = place(c);
      const st = still ? { ...tl.stateOf(c.id, t), blink: false } : tl.stateOf(c.id, t);
      const drawn = st.swap ? swapEffect(chars[c.id], st, `${c.id}-${Math.round(t * 1000)}`) : drawCharacter(chars[c.id], st);
      body += groundShadow(x, bg.floorY, s * Math.max(0.4, Math.abs(st.spin ?? 1)))
        + `<g transform="translate(${x},${bg.floorY}) scale(${s})">${drawn}</g>`;
    }
    // The line being spoken (with a short pop in/out) gets a bubble or caption.
    const b = tl.beats.find((x) => t >= x.start - 0.1 && t < x.end + 0.35);
    if (b && b.caption !== false) {
      const k = Math.min(1, (t - (b.start - 0.1)) / 0.12, (b.end + 0.35 - t) / 0.12);
      const text = b.caption ?? b.text;
      if (scene.format === 'wide') {
        body += caption(w / 2, h * 0.815, wrap(text, 42), 50, k);
      } else {
        const sp = scene.cast.find((c) => c.id === b.who), { x, s } = place(sp);
        body += bubble(w / 2, 250, wrap(text, 20), 64, [x + 30, bg.floorY - CHAR_HEIGHT * s + 10], k);
      }
    }
    return svgDoc(w, h, body);
  }

  // One character alone at time t, for checking it stays inside the frame.
  function characterSvgAt(id, t) {
    const c = scene.cast.find((x) => x.id === id), { x, s } = place(c);
    const st = tl.stateOf(id, t);
    return svgDoc(w, h, `<g transform="translate(${x},${bg.floorY}) scale(${s})">${drawCharacter(chars[id], { ...st, swap: undefined })}</g>`);
  }

  return { svgAt, characterSvgAt, duration: tl.duration, beats: tl.beats, w, h, cast: scene.cast, chars };
}

// audioPath: a finished mix (see audio.mjs). Without it, the raw lines are
// mixed on the fly — fine for quick tests, not for finals.
export async function renderVideo(sceneDir, voiceDir, outPath, quality = 'preview', audioPath) {
  const loaded = loadScene(sceneDir);
  const fps = loaded.scene.fps ?? 30;
  const q = QUALITY[quality];
  const r = frameRenderer(loaded, voiceDir);
  const width = Math.round((r.w * q.scale) / 2) * 2;
  const frames = Math.round(r.duration * fps);
  const seconds = (frames / fps).toFixed(3);

  const audioArgs = audioPath
    ? ['-i', audioPath, '-map', '0:v', '-map', '1:a']
    : [...r.beats.flatMap((b) => ['-i', b.wav]),
      '-filter_complex', r.beats.map((b, i) => `[${i + 1}:a]adelay=${Math.round(b.start * 1000)}:all=1[a${i}]`).join(';')
        + `;${r.beats.map((_, i) => `[a${i}]`).join('')}amix=inputs=${r.beats.length}:normalize=0,apad[aout]`,
      '-map', '0:v', '-map', '[aout]'];

  mkdirSync(dirname(outPath), { recursive: true });
  const partial = `${outPath}.partial.mp4`;
  const ff = spawn(toolPath('ffmpeg'), [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-',
    ...audioArgs, '-frames:v', String(frames), '-t', seconds,
    '-c:v', 'libx264', '-preset', q.preset, '-crf', String(q.crf), '-pix_fmt', 'yuv420p',
    '-c:a', 'aac', '-b:a', quality === 'final' ? '256k' : '160k',
    // Finals carry no hidden tags: no metadata, no encoder names, and the
    // x264 settings note (an SEI unit) is dropped from the picture stream.
    ...(quality === 'final' ? ['-map_metadata', '-1', '-map_chapters', '-1', '-fflags', '+bitexact',
      '-flags:v', '+bitexact', '-flags:a', '+bitexact', '-bsf:v', 'filter_units=remove_types=6',
      '-metadata:s:v', 'encoder=', '-metadata:s:a', 'encoder='] : []),
    '-movflags', '+faststart', partial,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((ok, fail) => ff.on('close', (code) => (code === 0 ? ok() : fail(new Error(`ffmpeg exited with ${code}`)))));

  try {
    const started = Date.now();
    for (let f = 0; f < frames; f++) {
      const png = rasterise(r.svgAt(f / fps), width);
      if (!ff.stdin.write(png)) await new Promise((ok) => ff.stdin.once('drain', ok));
      if (f % (fps * 2) === 0) process.stdout.write(`\rframe ${f}/${frames}`);
    }
    ff.stdin.end();
    await done;
    renameSync(partial, outPath);
    console.log(`\rrendered ${frames} frames in ${((Date.now() - started) / 1000).toFixed(1)} s -> ${outPath}`);
  } catch (err) {
    ff.kill();
    rmSync(partial, { force: true });
    throw err;
  }
  return outPath;
}

export function renderStill(sceneDir, voiceDir, t, outPath, width) {
  const r = frameRenderer(loadScene(sceneDir), voiceDir);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, rasterise(r.svgAt(t), width ?? r.w));
  return outPath;
}

// CLI
if (isMain(import.meta.url)) {
  const args = process.argv.slice(2);
  const opt = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : dflt; };
  const sceneDir = args[0];
  const voiceDir = opt('voice', join(sceneDir, 'voice'));
  const still = opt('still');
  const out = opt('out', join(sceneDir, still ? `still-${still}.png` : 'preview.mp4'));
  const job = still ? renderStill(sceneDir, voiceDir, Number(still), out) : renderVideo(sceneDir, voiceDir, out, opt('quality', 'preview'));
  Promise.resolve(job).catch((e) => { console.error(e.message); process.exit(1); });
}
