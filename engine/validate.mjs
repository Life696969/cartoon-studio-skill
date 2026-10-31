// Check character and scene files against what the kit actually has, and
// fail loudly with every problem listed. Without this, an unknown name
// quietly falls back to a default and the video comes out subtly wrong.
import { SKIN, HAIR } from '../kit/style.mjs';
import { HEAD_SHAPES } from '../kit/parts/head.mjs';
import { HAIR_STYLES } from '../kit/parts/hair.mjs';
import { OUTFITS, PATTERNS } from '../kit/parts/body.mjs';
import { GESTURES, EXPRESSIONS } from '../kit/presets.mjs';
import { BACKGROUNDS } from '../kit/backgrounds/index.mjs';

const HEX = /^#[0-9a-f]{6}$/i;
const oneOf = (problems, where, value, allowed, { hex = false, optional = true } = {}) => {
  if (value === undefined || value === null) { if (!optional) problems.push(`${where} is missing`); return; }
  if (hex && HEX.test(value)) return;
  if (!allowed.includes(value)) problems.push(`${where} "${value}" is not one of: ${allowed.join(', ')}${hex ? ', or a #rrggbb colour' : ''}`);
};
const color = (problems, where, value) => { if (value !== undefined && !HEX.test(value)) problems.push(`${where} "${value}" should be a #rrggbb colour`); };

export function outfitProblems(o, where, problems = []) {
  if (!o) return problems;
  oneOf(problems, `${where}.top`, o.top, Object.keys(OUTFITS));
  oneOf(problems, `${where}.pattern`, o.pattern, PATTERNS);
  for (const k of ['color', 'accent', 'pants', 'shoes']) color(problems, `${where}.${k}`, o[k]);
  return problems;
}

export function characterProblems(c, name = 'character') {
  const p = [];
  const l = c?.look;
  if (!c?.id) p.push(`${name}: id is missing`);
  if (!l) return [...p, `${name}: look is missing`];
  oneOf(p, `${name} skin`, l.skin, Object.keys(SKIN), { hex: true, optional: false });
  oneOf(p, `${name} head`, l.head, Object.keys(HEAD_SHAPES));
  oneOf(p, `${name} hair.style`, l.hair?.style, HAIR_STYLES);
  oneOf(p, `${name} hair.color`, l.hair?.color, Object.keys(HAIR), { hex: true });
  oneOf(p, `${name} eyes.style`, l.eyes?.style, ['classic', 'iris']);
  color(p, `${name} eyes.iris`, l.eyes?.iris);
  oneOf(p, `${name} nose`, l.nose, ['button', 'dot', 'line']);
  oneOf(p, `${name} glasses`, l.glasses, ['round', 'square']);
  oneOf(p, `${name} facialHair`, l.facialHair, ['moustache', 'beard', 'stubble']);
  outfitProblems(l.outfit, `${name} outfit`, p);
  return p;
}

function directionProblems(d, where, p) {
  if (!d) return;
  oneOf(p, `${where} gesture`, d.gesture, Object.keys(GESTURES));
  oneOf(p, `${where} expression`, d.expression, Object.keys(EXPRESSIONS));
}

export function sceneProblems(scene, lines) {
  const p = [];
  oneOf(p, 'format', scene.format, ['vertical', 'wide']);
  oneOf(p, 'background.name', scene.background?.name, Object.keys(BACKGROUNDS));
  const cast = new Set((scene.cast ?? []).map((c) => c.id));
  if (!cast.size) p.push('cast is empty');
  for (const c of scene.cast ?? []) directionProblems(c.start, `cast ${c.id} start`, p);
  const lineIds = new Set(lines.map((l) => l.id));
  for (const l of lines) if (!cast.has(l.who)) p.push(`line ${l.id}: speaker "${l.who}" is not in the cast`);
  for (const b of scene.beats ?? []) {
    if (!lineIds.has(b.line)) p.push(`beat refers to line "${b.line}", which isn't in lines.json`);
    directionProblems(b.speaker, `beat ${b.line} speaker`, p);
    for (const [id, d] of Object.entries(b.listeners ?? {})) {
      if (!cast.has(id)) p.push(`beat ${b.line}: listener "${id}" is not in the cast`);
      directionProblems(d, `beat ${b.line} listener ${id}`, p);
    }
  }
  for (const [i, m] of (scene.moments ?? []).entries()) {
    const where = `moment ${i + 1}`;
    if (!cast.has(m.who)) p.push(`${where}: "${m.who}" is not in the cast`);
    if (m.after && !lineIds.has(m.after)) p.push(`${where}: after "${m.after}", which isn't a line`);
    oneOf(p, `${where} action`, m.action, ['twirl', 'swap']);
    if (m.action && !m.outfit) p.push(`${where}: a ${m.action} needs an outfit to change into`);
    directionProblems(m, where, p);
    outfitProblems(m.outfit, `${where} outfit`, p);
  }
  return p;
}

export function assertValid(problems, what) {
  if (problems.length) throw new Error(`${what} has ${problems.length} problem(s):\n  - ${problems.join('\n  - ')}`);
}
