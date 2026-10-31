// Torso, outfits, neck and legs. Character space: x centred, y = 0 at the
// ground, up is negative. The rig joints these parts hang from live in
// rig.mjs so a part never hard-codes where another part sits.
import { stroke, shade, LINE, LINE_FINE, INK } from '../style.mjs';
import { RIG } from '../rig.mjs';

const { hipY, shoulderY, neckTop } = RIG;

const TORSO = `M-100,${shoulderY - 13} Q-114,${shoulderY + 6} -108,${shoulderY + 60} L-90,${hipY - 10}
  Q-88,${hipY + 4} -76,${hipY + 4} L76,${hipY + 4} Q88,${hipY + 4} 90,${hipY - 10}
  L108,${shoulderY + 60} Q114,${shoulderY + 6} 100,${shoulderY - 13} Q50,${shoulderY - 29} 0,${shoulderY - 29}
  Q-50,${shoulderY - 29} -100,${shoulderY - 13}Z`;

const KURTA = `M-100,${shoulderY - 13} Q-114,${shoulderY + 6} -108,${shoulderY + 60} L-118,${hipY + 110}
  Q-116,${hipY + 124} -100,${hipY + 124} L100,${hipY + 124} Q116,${hipY + 124} 118,${hipY + 110}
  L108,${shoulderY + 60} Q114,${shoulderY + 6} 100,${shoulderY - 13} Q50,${shoulderY - 29} 0,${shoulderY - 29}
  Q-50,${shoulderY - 29} -100,${shoulderY - 13}Z`;

// Fitted bodice for dresses: in at the waist, where the skirt takes over.
const { waistY } = RIG;
const BODICE = `M-96,${shoulderY - 13} Q-110,${shoulderY + 6} -104,${shoulderY + 60} Q-80,${waistY - 60} -70,${waistY + 6}
  L70,${waistY + 6} Q80,${waistY - 60} 104,${shoulderY + 60} Q110,${shoulderY + 6} 96,${shoulderY - 13}
  Q50,${shoulderY - 29} 0,${shoulderY - 29} Q-50,${shoulderY - 29} -96,${shoulderY - 13}Z`;

const fineLine = (d, color = INK) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${LINE_FINE}" stroke-linecap="round" stroke-linejoin="round"/>`;

// sleeve: long | short | puff | none.  skirt: hem height above the ground.
export const OUTFITS = {
  tshirt:  { sleeve: 'short', shape: TORSO },
  polo:    { sleeve: 'short', shape: TORSO },
  hoodie:  { sleeve: 'long',  shape: TORSO },
  blazer:  { sleeve: 'long',  shape: TORSO },
  kurta:   { sleeve: 'long',  shape: KURTA },
  sweater: { sleeve: 'long',  shape: TORSO },
  dress:   { sleeve: 'puff',  shape: BODICE, skirt: { hemY: -150, width: 150 } },
  gown:    { sleeve: 'none',  shape: BODICE, skirt: { hemY: -24, width: 178 } },
  sundress:{ sleeve: 'none',  shape: BODICE, skirt: { hemY: -120, width: 160 } },
};

// ---------- fabric patterns ----------

export const PATTERNS = ['plain', 'dots', 'stripes', 'floral', 'checks'];

// Returns { defs, fill } — fill is a colour or a url() to the pattern.
export function fabric(pattern, color, accent, id) {
  const a = accent ?? '#ffffff';
  const pid = `${id}-fab`;
  const tile = (size, inner) => ({
    defs: `<pattern id="${pid}" patternUnits="userSpaceOnUse" width="${size}" height="${size}">
      <rect width="${size}" height="${size}" fill="${color}"/>${inner}</pattern>`,
    fill: `url(#${pid})`,
  });
  switch (pattern) {
    case 'dots': return tile(44, `<circle cx="11" cy="11" r="6" fill="${a}"/><circle cx="33" cy="33" r="6" fill="${a}"/>`);
    case 'stripes': return tile(36, `<rect width="12" height="36" fill="${a}"/>`);
    case 'checks': return tile(48, `<rect width="24" height="48" fill="${a}" opacity="0.45"/><rect width="48" height="24" fill="${a}" opacity="0.45"/>`);
    case 'floral': {
      const flower = (x, y, r) => [0, 72, 144, 216, 288].map((d) => {
        const rad = (d * Math.PI) / 180;
        return `<circle cx="${(x + Math.cos(rad) * r).toFixed(1)}" cy="${(y + Math.sin(rad) * r).toFixed(1)}" r="${r * 0.75}" fill="${a}"/>`;
      }).join('') + `<circle cx="${x}" cy="${y}" r="${r * 0.6}" fill="${shade(a, 0.35)}"/>`;
      return tile(70, flower(18, 18, 7) + flower(52, 52, 6));
    }
    default: return { defs: '', fill: color };
  }
}

// ---------- skirt ----------

// fx.hemSway: px the hem lags sideways; fx.flare: 0..1 extra spread (twirl).
export function skirt(outfit, fill, color, fx = {}, id) {
  const sk = OUTFITS[outfit]?.skirt;
  if (!sk) return '';
  const sway = fx.hemSway ?? 0, flare = fx.flare ?? 0;
  const hw = sk.width + flare * 90, hemY = sk.hemY - flare * 40;
  const top = waistY, wx = 70;
  const left = -hw + sway, right = hw + sway;
  // Scalloped hem from left to right: soft waves that ride the sway.
  const waves = 6, step = (right - left) / waves;
  let hem = '';
  for (let i = 1; i <= waves; i++) {
    const x = left + i * step;
    hem += ` Q${(x - step / 2).toFixed(1)},${hemY + (i % 2 ? 16 : 6)} ${x.toFixed(1)},${hemY}`;
  }
  // Sides bow out and lag behind the hem, so the cloth reads as soft.
  const shape = `M${-wx},${top} C${-wx - 30},${top + 70} ${left + sway * 0.3 + 10},${hemY - 90} ${left},${hemY}${hem}
    C${right + sway * 0.3 - 10},${hemY - 90} ${wx + 30},${top + 70} ${wx},${top}Z`;
  const folds = [-0.45, 0, 0.45].map((f) => fineLine(
    `M${f * wx},${top + 30} Q${f * hw * 0.7 + sway * 0.5},${(top + hemY) / 2} ${f * hw * 0.9 + sway},${hemY - 4}`, shade(color, 0.3)));
  return `<clipPath id="${id}-skirt"><path d="${shape}"/></clipPath>
    <path d="${shape}" fill="${fill}"/>
    <g clip-path="url(#${id}-skirt)">
      <path d="M${hw * 0.3 + sway},${top} L${right + 60},${top} L${right + 60},${hemY + 30} L${hw * 0.45 + sway},${hemY + 30}Z" fill="${INK}" opacity="0.10"/>
      ${folds.join('')}
    </g>
    <path d="${shape}" fill="none" ${stroke()}/>`;
}

export function neck(skin) {
  return `<path d="M-24,${neckTop + 20} L-26,${shoulderY - 10} Q0,${shoulderY + 4} 26,${shoulderY - 10} L24,${neckTop + 20}Z" fill="${skin}" ${stroke()}/>
    <path d="M-24,${shoulderY - 22} Q0,${shoulderY - 6} 24,${shoulderY - 22}" fill="none" stroke="${shade(skin, 0.25)}" stroke-width="10" stroke-linecap="round" opacity="0.7"/>`;
}

// Things that sit behind the neck (hoodie hood, collars that wrap round).
export function behindNeck(outfit, color) {
  if (outfit === 'hoodie') {
    return `<path d="M-78,${shoulderY - 10} Q-92,${shoulderY - 70} 0,${shoulderY - 78} Q92,${shoulderY - 70} 78,${shoulderY - 10}Z" fill="${shade(color, 0.15)}" ${stroke()}/>`;
  }
  return '';
}

// fill: plain colour or a fabric pattern url; skin shows through necklines.
export function torso(outfit, { color, accent, fill = color, skin }, id) {
  const o = OUTFITS[outfit] ?? OUTFITS.tshirt;
  const s = shoulderY;
  const shadeBand = `<clipPath id="${id}-torso"><path d="${o.shape}"/></clipPath>
    <g clip-path="url(#${id}-torso)"><path d="M40,${s - 40} Q120,${s + 120} 70,${hipY + 140} L160,${hipY + 140} L160,${s - 40}Z" fill="${INK}" opacity="0.12"/></g>`;
  const body = `<path d="${o.shape}" fill="${fill}"/>${shadeBand}<path d="${o.shape}" fill="none" ${stroke()}/>`;
  let detail = '';
  switch (outfit) {
    case 'dress':
    case 'gown':
    case 'sundress': {
      const deep = outfit === 'gown' ? 40 : 26;
      detail = `<path d="M-40,${s - 27} Q0,${s + deep} 40,${s - 27} Q0,${s - 20} -40,${s - 27}Z" fill="${skin}" ${stroke(LINE_FINE)}/>`
        + `<path d="M-72,${waistY} L72,${waistY}" stroke="${INK}" stroke-width="${18 + LINE * 2}" stroke-linecap="round"/>`
        + `<path d="M-72,${waistY} L72,${waistY}" stroke="${accent ?? shade(color, 0.25)}" stroke-width="18" stroke-linecap="round"/>`;
      break;
    }
    case 'tshirt':
      detail = fineLine(`M-30,${s - 27} Q0,${s + 2} 30,${s - 27}`)
        + (accent ? `<circle cx="0" cy="${s + 95}" r="34" fill="${accent}" ${stroke(LINE_FINE)}/>` : '');
      break;
    case 'polo':
      detail = `<path d="M-30,${s - 27} L-4,${s + 6} L-40,${s + 12}Z" fill="${shade(color, 0.08)}" ${stroke(LINE_FINE)}/>
        <path d="M30,${s - 27} L4,${s + 6} L40,${s + 12}Z" fill="${shade(color, 0.08)}" ${stroke(LINE_FINE)}/>`
        + fineLine(`M0,${s + 4} L0,${s + 60}`)
        + `<circle cx="0" cy="${s + 22}" r="4" fill="${INK}"/><circle cx="0" cy="${s + 44}" r="4" fill="${INK}"/>`;
      break;
    case 'hoodie':
      detail = fineLine(`M-34,${s - 24} Q0,${s + 10} 34,${s - 24}`)
        + fineLine(`M-16,${s - 6} L-20,${s + 56} M16,${s - 6} L20,${s + 56}`)
        + `<circle cx="-20" cy="${s + 60}" r="5" fill="${accent ?? '#ffffff'}" ${stroke(3)}/><circle cx="20" cy="${s + 60}" r="5" fill="${accent ?? '#ffffff'}" ${stroke(3)}/>`
        + `<path d="M-62,${hipY - 90} L62,${hipY - 90} L76,${hipY - 22} L-76,${hipY - 22}Z" fill="${shade(color, 0.06)}" ${stroke(LINE_FINE)}/>`
        + `<path d="M-84,${hipY - 14} L84,${hipY - 14}" stroke="${shade(color, 0.2)}" stroke-width="10" stroke-linecap="round"/>`;
      break;
    case 'blazer':
      detail = `<path d="M-34,${s - 26} L0,${s + 110} L34,${s - 26} Q0,${s - 14} -34,${s - 26}Z" fill="${accent ?? '#ffffff'}" ${stroke(LINE_FINE)}/>`
        + `<path d="M-34,${s - 26} L-64,${s + 40} L-36,${s + 46} L0,${s + 110}" fill="${shade(color, 0.1)}" ${stroke(LINE_FINE)}/>`
        + `<path d="M34,${s - 26} L64,${s + 40} L36,${s + 46} L0,${s + 110}" fill="${shade(color, 0.1)}" ${stroke(LINE_FINE)}/>`
        + fineLine(`M0,${s + 110} L0,${hipY}`)
        + `<circle cx="10" cy="${s + 150}" r="6" fill="${INK}"/><circle cx="10" cy="${s + 200}" r="6" fill="${INK}"/>`;
      break;
    case 'kurta':
      detail = fineLine(`M-26,${s - 26} Q0,${s - 4} 26,${s - 26}`)
        + `<path d="M-10,${s - 12} L-10,${s + 110} L10,${s + 110} L10,${s - 12}" fill="${shade(color, 0.08)}" ${stroke(LINE_FINE)}/>`
        + [0, 1, 2].map((i) => `<circle cx="0" cy="${s + 20 + i * 32}" r="4" fill="${accent ?? '#e9c46a'}" ${stroke(2)}/>`).join('')
        + fineLine(`M-118,${hipY + 70} Q0,${hipY + 84} 118,${hipY + 70}`, shade(color, 0.3));
      break;
    case 'sweater':
      detail = `<path d="M-32,${s - 27} Q0,${s + 6} 32,${s - 27}" fill="none" stroke="${shade(color, 0.18)}" stroke-width="12" stroke-linecap="round"/>`
        + fineLine(`M-32,${s - 27} Q0,${s + 6} 32,${s - 27}`)
        + `<path d="M-90,${hipY - 14} L90,${hipY - 14}" stroke="${shade(color, 0.18)}" stroke-width="12" stroke-linecap="round"/>`;
      break;
  }
  return body + detail;
}

// Legs run from the hips (which move with weight shift and breathing) to
// ankles that stay planted, so the body sways while the feet hold the floor.
// Ink first, then fills, so hips and legs join without seams.
export function legs({ pants, shoes, outfit, shift = 0, bob = 0, skin }) {
  const bare = Boolean(OUTFITS[outfit]?.skirt);
  const color = bare ? skin : pants;
  const width = bare ? 40 : 60;
  const hy = hipY + bob - 6;
  const segs = [-1, 1].map((side) => `M${side * RIG.hipX + shift},${hy} L${side * RIG.hipX},${RIG.ankleY}`);
  const pelvis = bare ? '' : `M${-RIG.hipX + shift},${hy} L${RIG.hipX + shift},${hy}`;
  const line = (d, w, c) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round"/>`;
  const ink = segs.map((d) => line(d, width + LINE * 2, INK)).join('') + (pelvis ? line(pelvis, width + LINE * 2, INK) : '');
  const fill = segs.map((d) => line(d, width, color)).join('') + (pelvis ? line(pelvis, width, color) : '');
  const crotch = bare || outfit === 'kurta' ? '' : fineLine(`M${shift},${hy + 24} L${shift * 0.8},${hy + 70}`, shade(pants, 0.35));
  const shoe = (side) => {
    const x = side * RIG.hipX + side * 6;
    return `<path d="M${x - 38},-4 Q${x - 40},-44 ${x},-44 Q${x + 44},-44 ${x + 46},-4Z" fill="${shoes}" ${stroke()}/>`;
  };
  return ink + fill + crotch + shoe(-1) + shoe(1);
}
