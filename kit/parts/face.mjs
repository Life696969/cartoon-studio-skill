// Eyes, brows, nose, cheeks, glasses and the 9 talking mouths.
// Mouth names follow Rhubarb Lip Sync so its output maps 1:1:
//   A = M/B/P closed   B = most consonants, teeth together   C = EH/AE open
//   D = AA wide        E = AO/ER rounded   F = OO/W puckered
//   G = F/V teeth on lip   H = L, tongue up   X = rest
import { INK, LINE, LINE_FINE, stroke, MOUTH, BLUSH, EYE_WHITE, shade } from '../style.mjs';

const EYE_X = 40, EYE_Y = 4, EYE_RX = 27, EYE_RY = 34;

// ---------- eyes ----------

// state: open | blink | happy | wide | half | sad
export function eyes({ state = 'open', gaze = [0, 0], style = 'classic', iris = '#5a3a26', skin, id }) {
  return [-1, 1].map((side) => eye({ side, state, gaze, style, iris, skin, id: `${id}-e${side}` })).join('');
}

function eye({ side, state, gaze, style, iris, skin, id }) {
  const x = side * EYE_X;
  if (state === 'blink') {
    return `<path d="M${x - 24},${EYE_Y + 4} Q${x},${EYE_Y + 16} ${x + 24},${EYE_Y + 4}" fill="none" ${stroke(LINE)}/>`;
  }
  if (state === 'happy') {
    return `<path d="M${x - 22},${EYE_Y + 10} Q${x},${EYE_Y - 16} ${x + 22},${EYE_Y + 10}" fill="none" ${stroke(LINE)}/>`;
  }
  const ry = state === 'wide' ? EYE_RY + 4 : EYE_RY;
  const [gx, gy] = gaze;
  const px = x + gx * 9, py = EYE_Y + 4 + gy * 10;
  const pupil = style === 'iris'
    ? `<ellipse cx="${px}" cy="${py}" rx="15" ry="19" fill="${iris}"/>
       <ellipse cx="${px}" cy="${py + 1}" rx="8" ry="10" fill="${INK}"/>`
    : `<ellipse cx="${px}" cy="${py}" rx="${state === 'wide' ? 8 : 11}" ry="${state === 'wide' ? 10 : 14}" fill="${INK}"/>`;
  const shine = `<circle cx="${px - 5}" cy="${py - 6}" r="4.5" fill="#fff"/><circle cx="${px + 4}" cy="${py + 5}" r="2" fill="#fff"/>`;
  // Lids: skin shapes clipped to the eye, then the lid line on top.
  let lid = '';
  if (state === 'half') {
    lid = `<rect x="${x - 40}" y="${EYE_Y - 50}" width="80" height="48" fill="${skin}"/>`;
  } else if (state === 'sad') {
    lid = `<path d="M${x - 40},${EYE_Y - 50} L${x + 40},${EYE_Y - 50} L${x + 40},${EYE_Y - 30 + side * 14} L${x - 40},${EYE_Y - 30 - side * 14}Z" fill="${skin}"/>`;
  }
  const lidLine = state === 'half'
    ? `<path d="M${x - 26},${EYE_Y - 2} L${x + 26},${EYE_Y - 2}" ${stroke(LINE)}/>`
    : state === 'sad'
      ? `<path d="M${x - 26},${EYE_Y - 30 - side * 12} L${x + 26},${EYE_Y - 30 + side * 12}" ${stroke(LINE_FINE)}/>`
      : '';
  return `<clipPath id="${id}"><ellipse cx="${x}" cy="${EYE_Y}" rx="${EYE_RX}" ry="${ry}"/></clipPath>
    <ellipse cx="${x}" cy="${EYE_Y}" rx="${EYE_RX}" ry="${ry}" fill="${EYE_WHITE}"/>
    <g clip-path="url(#${id})">${pupil}${shine}${lid}</g>
    <ellipse cx="${x}" cy="${EYE_Y}" rx="${EYE_RX}" ry="${ry}" fill="none" ${stroke(LINE_FINE + 1)}/>
    ${lidLine}`;
}

// ---------- brows ----------

// raise: px up; tilt: degrees, + lifts the inner ends (worried), - drops them (cross)
export function brows({ raise = 0, tilt = 0, color, thick = 9 }) {
  return [-1, 1].map((side) => {
    const x = side * EYE_X, y = EYE_Y - 52 - raise;
    // Inner end of the left brow is +x; SVG rotate(+) turns clockwise, which
    // drops that end, so the left brow turns by -tilt and the right by +tilt.
    const rot = side * tilt;
    return `<path transform="translate(${x},${y}) rotate(${rot})" d="M-19,3 Q0,-6 19,3" fill="none" stroke="${color}" stroke-width="${thick}" stroke-linecap="round"/>`;
  }).join('');
}

// ---------- nose, cheeks, glasses ----------

export function nose(style = 'button', skin) {
  if (style === 'dot') return `<ellipse cx="0" cy="44" rx="7" ry="5" fill="${shade(skin, 0.28)}"/>`;
  if (style === 'line') return `<path d="M2,26 Q10,44 -2,48" fill="none" ${stroke(LINE_FINE)}/>`;
  return `<path d="M-8,44 Q0,52 8,44" fill="none" ${stroke(LINE_FINE)}/>`;
}

export function cheeks(on = true) {
  if (!on) return '';
  return [-1, 1].map((s) => `<ellipse cx="${s * 76}" cy="54" rx="17" ry="9" fill="${BLUSH}" opacity="0.42"/>`).join('');
}

export function glasses(kind) {
  if (!kind) return '';
  const r = kind === 'round' ? 37 : 0;
  const frame = (side) => kind === 'round'
    ? `<circle cx="${side * EYE_X}" cy="${EYE_Y}" r="${r}" fill="#ffffff" fill-opacity="0.12" ${stroke(LINE)}/>`
    : `<rect x="${side * EYE_X - 38}" y="${EYE_Y - 28}" width="76" height="58" rx="16" fill="#ffffff" fill-opacity="0.12" ${stroke(LINE)}/>`;
  return `${frame(-1)}${frame(1)}
    <path d="M-${EYE_X - 34},${EYE_Y - 4} Q0,${EYE_Y - 12} ${EYE_X - 34},${EYE_Y - 4}" fill="none" ${stroke(LINE)}/>
    <path d="M-${EYE_X + 37},${EYE_Y - 4} L-118,${EYE_Y - 10}" ${stroke(LINE)}/>
    <path d="M${EYE_X + 37},${EYE_Y - 4} L118,${EYE_Y - 10}" ${stroke(LINE)}/>`;
}

// ---------- mouths ----------

// Opening = upper lip apex t above 0, lower lip b below. Teeth and tongue are
// clipped to the opening so they never spill outside the lips.
function opening({ id, w, t, b, upperTeeth = 0, lowerTeeth = 0, tongue = 0, tongueUp = false, clenched = false }) {
  const d = `M${-w},0 Q0,${-2 * t} ${w},0 Q0,${2 * b} ${-w},0Z`;
  const inner = [
    `<rect x="${-w - 4}" y="${-t - 6}" width="${2 * w + 8}" height="${t + b + 12}" fill="${clenched ? MOUTH.teeth : MOUTH.inside}"/>`,
    tongue ? `<ellipse cx="0" cy="${tongueUp ? -t + 4 : b + 2}" rx="${w * 0.6}" ry="${tongue}" fill="${MOUTH.tongue}"/>` : '',
    upperTeeth ? `<rect x="${-w}" y="${-t - 6}" width="${2 * w}" height="${upperTeeth + 6}" fill="${MOUTH.teeth}"/>` : '',
    lowerTeeth ? `<rect x="${-w}" y="${b - lowerTeeth}" width="${2 * w}" height="${lowerTeeth + 6}" fill="${MOUTH.teeth}"/>` : '',
    clenched ? `<path d="M${-w},1 L${w},1" stroke="${INK}" stroke-width="2.5" opacity="0.5"/>` : '',
  ].join('');
  return `<clipPath id="${id}"><path d="${d}"/></clipPath>
    <g clip-path="url(#${id})">${inner}</g>
    <path d="${d}" fill="none" ${stroke(LINE_FINE + 1)}/>`;
}

const line = (d, w = LINE_FINE + 1) => `<path d="${d}" fill="none" ${stroke(w)}/>`;

export const MOUTH_NAMES = ['X', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
export const REST_MOUTHS = ['smile', 'grin', 'flat', 'frown', 'o', 'smirk'];

export function mouth(name, id) {
  switch (name) {
    case 'A': return line('M-21,0 Q0,4 21,0') + line('M-8,9 Q0,11 8,9', LINE_FINE - 1);
    case 'B': return opening({ id, w: 22, t: 3, b: 8, clenched: true });
    case 'C': return opening({ id, w: 24, t: 6, b: 17, upperTeeth: 6, tongue: 7 });
    case 'D': return opening({ id, w: 27, t: 9, b: 29, upperTeeth: 7, tongue: 11 });
    case 'E': return opening({ id, w: 17, t: 12, b: 18, upperTeeth: 5, tongue: 7 });
    case 'F': return opening({ id, w: 10, t: 8, b: 10 }) + line('M-15,-2 Q-17,4 -14,10', LINE_FINE - 1) + line('M15,-2 Q17,4 14,10', LINE_FINE - 1);
    case 'G': return `<rect x="-12" y="-1" width="24" height="9" rx="3" fill="${MOUTH.teeth}" ${stroke(LINE_FINE - 1)}/>`
      + line('M-21,-2 Q0,-7 21,-2') + line('M-15,9 Q0,15 15,9');
    case 'H': return opening({ id, w: 23, t: 7, b: 17, upperTeeth: 6, tongue: 8, tongueUp: true });
    // rest / expression mouths
    case 'grin': return opening({ id, w: 28, t: 2, b: 22, upperTeeth: 8, tongue: 8 });
    case 'flat': return line('M-16,2 L16,2');
    case 'frown': return line('M-19,8 Q0,-5 19,8');
    case 'o': return opening({ id, w: 11, t: 11, b: 13 });
    case 'smirk': return line('M-17,3 Q5,6 21,-7');
    case 'smile':
    case 'X':
    default: return line('M-21,-3 Q0,11 21,-3');
  }
}

export const MOUTH_Y = 82;
