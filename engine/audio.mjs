// Audio: bring every line to the same loudness, lay the lines on the
// timeline, and master the mix for phones and social apps.
//   - lines are levelled to -18 LUFS with gain only (no compression), so a
//     quiet recording and a loud AI voice sit together;
//   - the mix is mastered to -14 LUFS (Instagram/YouTube's reference) with a
//     limiter as a safety net at -1 dBTP so nothing clips.
import { execFileSync, spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { toolPath } from './tools.mjs';

// The limiter works on samples; true peaks between samples run a little
// higher, so it sits half a dB under the -1 dBTP promise.
const LINE_LUFS = -18, MASTER_LUFS = -14, CEILING_DB = -1.5;

const ff = (args) => execFileSync(toolPath('ffmpeg'), ['-hide_banner', '-nostats', '-y', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

// Any recording (phone m4a, mp3, wav...) -> mono 24 kHz 16-bit WAV.
export function toWav(input, out) {
  ff(['-i', input, '-ac', '1', '-ar', '24000', '-c:a', 'pcm_s16le', out]);
  return out;
}

// Integrated loudness and true peak. loudnorm prints its JSON on stderr.
export function measure(path) {
  const r = spawnSync(toolPath('ffmpeg'), ['-hide_banner', '-nostats', '-i', path, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8' });
  const log = r.stderr ?? '';
  const json = JSON.parse(log.slice(log.lastIndexOf('{'), log.lastIndexOf('}') + 1));
  return { lufs: Number(json.input_i), truePeak: Number(json.input_tp) };
}

// Gain-only levelling of one line, written as 32-bit float so no sample
// clips before the master limiter.
export function levelLine(input, out) {
  const { lufs } = measure(input);
  const gain = Number.isFinite(lufs) ? LINE_LUFS - lufs : 0;
  ff(['-i', input, '-af', `volume=${gain.toFixed(2)}dB`, '-c:a', 'pcm_f32le', out]);
  return { out, gain };
}

// Small sound effects made from scratch (no downloaded assets, nothing to
// license): a soft whoosh for a twirl, a rising chime for a sparkle swap.
// Levelled to -26 LUFS so they sit well under the voices.
const SFX_LUFS = -26;
export function effect(kind, seconds, out) {
  const d = Math.max(0.4, seconds).toFixed(2);
  const src = kind === 'whoosh'
    ? `anoisesrc=d=${d}:c=pink:a=0.6:r=48000,bandpass=f=900:width_type=o:w=2,afade=t=in:d=${(d * 0.45).toFixed(2)}:curve=qsin,afade=t=out:st=${(d * 0.45).toFixed(2)}:d=${(d * 0.55).toFixed(2)}:curve=qsin`
    : `aevalsrc='${[1568, 2093, 2637, 3136].map((f, i) => `0.25*sin(2*PI*${f}*(t-${i * 0.09}))*exp(-7*(t-${i * 0.09}))*gte(t,${i * 0.09})`).join('+')}':s=48000:d=${d}`;
  const tmp = out.replace(/\.wav$/i, '.gen.wav');
  try {
    ff(['-f', 'lavfi', '-i', src, '-ac', '1', '-c:a', 'pcm_f32le', tmp]);
    const { lufs } = measure(tmp);
    ff(['-i', tmp, '-af', `volume=${(SFX_LUFS - lufs).toFixed(2)}dB`, '-c:a', 'pcm_f32le', out]);
  } finally {
    rmSync(tmp, { force: true });
  }
  return out;
}

// Lines at their start times -> one mastered stereo 48 kHz WAV.
export function mixAndMaster(lines, duration, out) {
  const inputs = lines.flatMap((l) => ['-i', l.wav]);
  const chains = lines.map((l, i) => `[${i}:a]aresample=48000,adelay=${Math.round(l.start * 1000)}:all=1[a${i}]`).join(';');
  const mixGraph = `${chains};${lines.map((_, i) => `[a${i}]`).join('')}amix=inputs=${lines.length}:normalize=0,apad,atrim=0:${duration.toFixed(3)}`;
  const raw = out.replace(/\.wav$/i, '.raw.wav');
  try {
    ff([...inputs, '-filter_complex', mixGraph, '-ac', '2', '-c:a', 'pcm_f32le', raw]);
    const before = measure(raw);
    const gain = MASTER_LUFS - before.lufs;
    const limit = 10 ** (CEILING_DB / 20);
    ff(['-i', raw, '-af', `volume=${gain.toFixed(2)}dB,alimiter=limit=${limit.toFixed(4)}:level=disabled`, '-c:a', 'pcm_s16le', out]);
    return { out, before, after: measure(out), gain };
  } finally {
    rmSync(raw, { force: true });
  }
}
