// Scene file + voice lines -> every character's state on every frame.
// All acting rules live here.
//
// Motion model: each joint is a damped spring chasing a target pose, so
// moves accelerate, overshoot a touch and settle instead of sliding. Child
// joints (elbows, head) chase a slightly delayed target for follow-through.
// Hair and hems are secondary springs driven by how fast the body moves.
// Everything is simulated once, frame by frame, from t = 0, so any frame
// (or still) is exactly reproducible.
import { readFileSync } from 'node:fs';
import { GESTURES, EXPRESSIONS } from '../kit/presets.mjs';
import { withDefaults, CHANNELS } from '../kit/rig.mjs';
import { mouthAt, readCues } from './lipsync.mjs';

export const SCENE_SCHEMA = 'cartoon-studio/scene@1';

const ACT = {
  anticipate: 0.15,   // speaker starts the gesture this long before speaking
  react: 0.3,         // listeners react this long after the line starts
  settle: 0.5,        // after a line, the speaker eases back to idle after this
  blink: 0.1,         // blink duration
  handSwap: 0.1,      // hand shape changes this long after a gesture starts
};

// Spring per channel: [natural frequency rad/s, damping ratio, delay frames].
// Lower damping = more overshoot; delay = follow-through behind the parent.
const SPRING = {
  'armL.shoulder': [13, 0.72, 0], 'armR.shoulder': [13, 0.72, 0],
  'armL.elbow': [11, 0.6, 2], 'armR.elbow': [11, 0.6, 2],
  'head.tilt': [9, 0.7, 3], 'head.nod': [10, 0.75, 3], 'head.turn': [8, 0.85, 2],
  'body.lean': [7, 0.8, 0], 'body.bob': [10, 0.8, 0], 'body.shift': [5, 0.85, 0],
};

export function wavSeconds(path) {
  const b = readFileSync(path);
  const byteRate = b.readUInt32LE(28);
  let off = 12;
  while (off < b.length - 8) {
    const id = b.toString('ascii', off, off + 4), size = b.readUInt32LE(off + 4);
    if (id === 'data') return size / byteRate;
    off += 8 + size + (size % 2);
  }
  throw new Error(`No audio data in ${path}`);
}

// Lay beats out on the clock: each starts `at` seconds in, or `gap` after
// the previous line ends.
export function layout(scene, lines, voiceDir) {
  const byId = Object.fromEntries(lines.map((l) => [l.id, l]));
  let clock = 0;
  const beats = scene.beats.map((beat) => {
    const line = byId[beat.line];
    if (!line) throw new Error(`Beat refers to unknown line "${beat.line}"`);
    const wav = `${voiceDir}/${line.id}.wav`;
    const start = beat.at ?? clock + (beat.gap ?? 0.3);
    const end = start + wavSeconds(wav);
    clock = end;
    return { ...beat, who: line.who, text: line.text, wav, start, end, cues: readCues(`${voiceDir}/${line.id}.mouth.json`) };
  });
  const lastMoment = Math.max(0, ...(scene.moments ?? []).map((m) => momentTime(m, beats) + (m.dur ?? 0)));
  return { beats, duration: Math.max(clock, lastMoment) + (scene.tail ?? 1.0) };
}

// A moment is a direction not tied to speech: { at } seconds, or
// { after: <line id>, plus } seconds after that line ends.
function momentTime(m, beats) {
  if (m.after) {
    const b = beats.find((x) => x.line === m.after);
    if (!b) throw new Error(`Moment refers to unknown line "${m.after}"`);
    return b.end + (m.plus ?? 0);
  }
  return m.at ?? 0;
}

// Keyframes per character: [{t, gesture?, expression?, turn?, shift?, action?, outfit?, dur?}]
function keyframes(scene, beats) {
  const keys = Object.fromEntries(scene.cast.map((c) => [c.id, [{ t: 0, gesture: 'idle', expression: 'neutral', ...c.start }]]));
  for (const b of beats) {
    keys[b.who].push({ t: b.start - ACT.anticipate, ...b.speaker });
    // Relax to idle after the line, unless the same speaker's next line
    // starts first (its gesture would otherwise be overwritten).
    const next = beats.find((x) => x.who === b.who && x.start > b.start);
    const relaxAt = b.end + ACT.settle;
    if (!b.hold && !(next && next.start - ACT.anticipate <= relaxAt)) keys[b.who].push({ t: relaxAt, gesture: 'idle' });
    for (const [id, dir] of Object.entries(b.listeners ?? {})) keys[id].push({ t: b.start + ACT.react, ...dir });
  }
  for (const m of scene.moments ?? []) {
    const { who, at, after, plus, ...dir } = m;
    keys[who].push({ t: momentTime(m, beats), ...dir });
  }
  for (const k of Object.values(keys)) k.sort((a, b) => a.t - b.t);
  return keys;
}

const easeInOut = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);
const lastAt = (keys, t, field) => { let v; for (const k of keys) { if (k.t > t) break; if (k[field] !== undefined) v = k; } return v; };
const get = (pose, [g, k]) => pose[g][k];

function spring(x, v, target, [w, z], dt) {
  const steps = 4, h = dt / steps;
  for (let i = 0; i < steps; i++) {
    const a = w * w * (target - x) - 2 * z * w * v;
    v += a * h;
    x += v * h;
  }
  return [x, v];
}

// Deterministic per-character blink times, so re-renders match exactly.
function seeded(id) {
  let seed = [...id].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}
function blinkTimes(id, duration, keys) {
  const rand = seeded(id);
  const times = [];
  for (let t = 0.8 + rand() * 1.5; t < duration; t += 2.2 + rand() * 2.6) times.push(t);
  // Blink on every change of expression: it hides the switch, as animators do.
  for (const k of keys) if (k.expression && k.t > 0) times.push(k.t - 0.03);
  return times.sort((a, b) => a - b);
}

export function compile(scene, lines, voiceDir) {
  const fps = scene.fps ?? 30, dt = 1 / fps;
  const { beats, duration } = layout(scene, lines, voiceDir);
  const keys = keyframes(scene, beats);
  const xOf = Object.fromEntries(scene.cast.map((c) => [c.id, c.x]));
  const frameCount = Math.ceil(duration * fps) + 1;
  const frames = {};

  for (const c of scene.cast) {
    const k = keys[c.id];
    const blinks = blinkTimes(c.id, duration, k);
    const actions = k.filter((x) => x.action);
    const phase = xOf[c.id] * 7;
    // Pass 1: target pose per frame.
    const targets = [];
    for (let f = 0; f < frameCount; f++) {
      const t = f * dt;
      const g = lastAt(k, t, 'gesture');
      const act = actions.find((a) => t >= a.t && t < a.t + (a.dur ?? 1));
      const pose = withDefaults(GESTURES[act?.action === 'twirl' ? 'twirl' : g.gesture] ?? {});
      const turn = lastAt(k, t, 'turn'), shift = lastAt(k, t, 'shift');
      if (turn && turn.t >= g.t) pose.head.turn = turn.turn;
      if (shift && shift.t >= g.t) pose.body.shift = shift.shift;
      // Idle weight shift: people never stand perfectly still.
      if (g.gesture === 'idle' && !(shift && shift.t >= g.t)) pose.body.shift += Math.sign(Math.sin((t / 7) * 2 * Math.PI + phase)) * 7;
      // Hands change shape a moment into a new gesture; the opening gesture's
      // hands are there from the first frame (it's often the video's cover).
      const handKey = t - g.t < ACT.handSwap ? (k.filter((x) => x.gesture && x.t < g.t).at(-1) ?? g) : g;
      const hands = withDefaults(GESTURES[(act?.action === 'twirl' ? 'twirl' : handKey?.gesture) ?? 'idle'] ?? {});
      targets.push({ pose, hands: [hands.armL.hand, hands.armR.hand] });
    }
    // Pass 2: springs, secondary motion, life, discrete state.
    const sim = Object.fromEntries(CHANNELS.map((ch) => [ch.join('.'), [get(targets[0].pose, ch), 0]]));
    let hair = [0, 0], hem = [0, 0], prev = null;
    let outfit;
    const list = [];
    for (let f = 0; f < frameCount; f++) {
      const t = f * dt;
      const pose = withDefaults({});
      for (const ch of CHANNELS) {
        const name = ch.join('.');
        const [w, z, delay] = SPRING[name];
        const target = get(targets[Math.max(0, f - delay)].pose, ch);
        sim[name] = spring(sim[name][0], sim[name][1], target, [w, z], dt);
        pose[ch[0]][ch[1]] = sim[name][0];
      }
      pose.armL.hand = targets[f].hands[0];
      pose.armR.hand = targets[f].hands[1];

      // Actions: twirl (squash-flip turn, outfit changes when edge-on) and
      // swap (sparkle wipe from the old outfit to the new one).
      let spin = 1, flare = 0, swap;
      for (const a of actions) {
        const p = (t - a.t) / (a.dur ?? 1);
        if (a.action === 'twirl' && p >= 0 && p < 1) {
          const e = easeInOut(p);
          spin = Math.cos(2 * Math.PI * e);
          flare = Math.sin(Math.PI * p);
          if (e >= 0.25 && a.outfit) outfit = a.outfit;
        } else if (a.action === 'twirl' && p >= 1 && a.outfit) outfit = a.outfit;
        if (a.action === 'swap' && a.outfit) {
          if (p >= 0 && p < 1) swap = { from: outfit, to: a.outfit, k: easeInOut(p) };
          else if (p >= 1) outfit = a.outfit;
        }
      }
      // Keep a little width at the edge-on moment so the character never vanishes.
      if (Math.abs(spin) < 0.08) spin = spin < 0 ? -0.08 : 0.08;

      // Secondary motion: driven by the body's speed, so it lags and swings.
      const vel = (name) => (prev ? (pose[name.split('.')[0]][name.split('.')[1]] - prev[name]) / dt : 0);
      const drive = -(vel('body.shift') * 0.18 + vel('head.tilt') * 0.12 + vel('body.lean') * 0.6);
      hair = spring(hair[0], hair[1], Math.max(-14, Math.min(14, drive)) + flare * 8 * Math.sign(spin), [6, 0.35], dt);
      hem = spring(hem[0], hem[1], Math.max(-30, Math.min(30, -vel('body.shift') * 0.5 - vel('body.lean') * 2)), [7, 0.4], dt);
      prev = Object.fromEntries(CHANNELS.map((ch) => [ch.join('.'), get(pose, ch)]));

      // Life: breathing always; head sway while talking (added after springs).
      const speaking = beats.find((b) => b.who === c.id && t >= b.start && t < b.end);
      pose.body.bob += Math.sin((t / 3.4) * 2 * Math.PI + phase) * 3;
      if (speaking) {
        pose.head.tilt += Math.sin((t - speaking.start) * 2 * Math.PI * 0.55) * 2.5;
        pose.head.nod += Math.sin((t - speaking.start) * 2 * Math.PI * 1.4) * 2;
      }

      const expression = lastAt(k, t, 'expression')?.expression ?? 'neutral';
      const someoneElse = beats.find((b) => b.who !== c.id && t >= b.start - 0.2 && t < b.end + 0.4);
      const target = someoneElse?.who ?? scene.cast.find((x) => x.id !== c.id)?.id;
      const dir = target ? Math.sign(xOf[target] - xOf[c.id]) : 0;
      const exprGaze = EXPRESSIONS[expression]?.gaze;
      const gaze = exprGaze && !someoneElse ? exprGaze : [dir * 0.8, 0.05];

      list.push({
        pose, expression, gaze, spin, outfit, swap,
        fx: { hairSway: hair[0], hemSway: hem[0], flare },
        blink: blinks.some((bt) => t >= bt && t < bt + ACT.blink),
        mouth: speaking ? mouthAt(speaking.cues, t - speaking.start) : undefined,
      });
    }
    frames[c.id] = list;
  }

  const stateOf = (id, t) => frames[id][Math.max(0, Math.min(frameCount - 1, Math.round(t * fps)))];
  return { beats, duration, fps, stateOf };
}
