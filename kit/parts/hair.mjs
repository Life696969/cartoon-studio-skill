// Hair styles, drawn for a nominal head (rx 125, ry 128) and scaled to the
// actual head shape by the character composer. Each style has a back layer
// (drawn behind the head, and behind the body for long hair) and a front
// layer (drawn over the forehead).
import { stroke, shade, tint, LINE_FINE } from '../style.mjs';

export const NOMINAL = { rx: 125, ry: 128 };

const p = (d, fill, extra = '') => `<path d="${d}" fill="${fill}" ${stroke()} ${extra}/>`;
const strands = (d, color) => `<path d="${d}" fill="none" stroke="${shade(color, 0.3)}" stroke-width="${LINE_FINE}" stroke-linecap="round"/>`;
const shine = (d, color) => `<path d="${d}" fill="none" stroke="${tint(color, 0.35)}" stroke-width="7" stroke-linecap="round" opacity="0.8"/>`;

const DOME = 'M-136,40 C-150,-150 150,-150 136,40 Q0,10 -136,40Z';

const STYLES = {
  messy: (c) => ({
    back: p(DOME, shade(c, 0.12)),
    front: p('M-130,4 C-134,-96 -78,-152 0,-152 C78,-152 134,-96 130,4 L112,-40 L98,-18 L80,-60 L58,-38 L36,-72 L12,-46 L-14,-76 L-36,-46 L-60,-68 L-80,-36 L-100,-54 L-114,-20Z', c)
      + shine('M-70,-118 Q-30,-136 10,-130', c),
  }),
  sidepart: (c) => ({
    back: p(DOME, shade(c, 0.12)),
    front: p('M-130,8 C-136,-104 -62,-154 8,-152 C88,-150 136,-96 130,8 L120,-34 Q102,-74 42,-80 Q-18,-86 -46,-124 Q-78,-74 -112,-52Z', c)
      + strands('M-46,-124 Q-6,-100 60,-100', c) + shine('M20,-136 Q70,-130 100,-104', c),
  }),
  curly: (c) => {
    const back = [];
    for (let a = 150; a <= 390; a += 20) {
      const r = (a * Math.PI) / 180;
      back.push(`<circle cx="${(Math.cos(r) * 128).toFixed(1)}" cy="${(Math.sin(r) * 118 - 14).toFixed(1)}" r="44" fill="${shade(c, 0.1)}" ${stroke()}/>`);
    }
    const front = [];
    for (let i = 0; i < 7; i++) {
      const x = -96 + i * 32, y = -84 - Math.cos(((i - 3) / 3) * 1.2) * 34;
      front.push(`<circle cx="${x}" cy="${y.toFixed(1)}" r="${i % 2 ? 30 : 34}" fill="${c}" ${stroke()}/>`);
    }
    front.push(`<circle cx="-118" cy="-34" r="26" fill="${c}" ${stroke()}/>`, `<circle cx="118" cy="-34" r="26" fill="${c}" ${stroke()}/>`);
    return { back: back.join(''), front: front.join('') + shine('M-60,-128 Q-30,-140 0,-136', c) };
  },
  bob: (c) => ({
    back: p('M-152,104 C-170,-60 -110,-150 0,-150 C110,-150 170,-60 152,104 Q120,118 96,100 L-96,100 Q-120,118 -152,104Z', shade(c, 0.12)),
    front: p('M-132,0 C-138,-102 -72,-152 0,-152 C72,-152 138,-102 132,0 L120,-22 Q112,-52 96,-54 L-96,-54 Q-112,-52 -120,-22Z', c)
      + p('M-132,-14 L-144,98 Q-126,108 -108,94 L-106,-24Z', c) + p('M132,-14 L144,98 Q126,108 108,94 L106,-24Z', c)
      + shine('M-80,-122 Q-40,-140 0,-138', c),
  }),
  long: (c) => ({
    back: p('M-142,-30 C-156,-150 156,-150 142,-30 L164,300 Q0,334 -164,300Z', shade(c, 0.12)),
    front: p('M-130,10 C-136,-102 -70,-152 0,-152 C70,-152 136,-102 130,10 L134,150 Q118,162 104,148 L100,-30 Q62,-80 4,-112 Q-60,-80 -100,-30 L-104,148 Q-118,162 -134,150Z', c)
      + strands('M4,-112 Q-30,-70 -50,-40', c) + shine('M30,-132 Q70,-124 96,-96', c),
  }),
  ponytail: (c) => ({
    back: p('M84,-104 C204,-128 214,44 172,156 Q150,178 138,146 C160,64 150,-36 78,-76Z', shade(c, 0.12))
      + p(DOME, shade(c, 0.12)) + `<circle cx="96" cy="-98" r="16" fill="#e2534a" ${stroke()}/>`,
    front: p('M-130,8 C-136,-104 -62,-154 8,-152 C88,-150 136,-96 130,8 L118,-24 Q96,-66 50,-66 Q0,-70 -30,-112 Q-66,-62 -112,-46Z', c)
      + shine('M-30,-136 Q10,-146 50,-136', c),
  }),
  bun: (c) => ({
    back: `<circle cx="0" cy="-158" r="54" fill="${shade(c, 0.1)}" ${stroke()}/>` + p(DOME, shade(c, 0.12)),
    front: p('M-130,6 C-136,-110 -70,-152 0,-152 C70,-152 136,-110 130,6 L116,-20 Q92,-82 0,-90 Q-92,-82 -116,-20Z', c)
      + strands('M-40,-88 Q-30,-120 -10,-146 M40,-88 Q30,-120 10,-146', c),
  }),
  balding: (c) => ({
    back: '',
    front: p('M-110,-64 Q-150,-58 -148,-18 Q-154,22 -126,40 Q-120,12 -114,-10 Q-108,-40 -110,-64Z', c)
      + p('M110,-64 Q150,-58 148,-18 Q154,22 126,40 Q120,12 114,-10 Q108,-40 110,-64Z', c)
      + strands('M-138,-30 Q-128,-10 -134,12 M138,-30 Q128,-10 134,12', c),
  }),
  buzz: (c) => ({
    back: '',
    front: p('M-128,-6 C-132,-104 -70,-140 0,-140 C70,-140 132,-104 128,-6 Q116,-40 100,-62 Q0,-84 -100,-62 Q-116,-40 -128,-6Z', c),
  }),
};

export const HAIR_STYLES = Object.keys(STYLES);

export function hair(style, color) {
  return (STYLES[style] ?? STYLES.messy)(color);
}

// Facial hair sits on the face, under the mouth.
export function facialHair(kind, color) {
  if (kind === 'moustache') {
    return p('M-34,70 Q-18,56 0,64 Q18,56 34,70 Q18,74 0,70 Q-18,74 -34,70Z', color);
  }
  if (kind === 'beard') {
    return p('M-118,20 Q-112,150 0,158 Q112,150 118,20 Q104,92 54,96 Q30,70 0,70 Q-30,70 -54,96 Q-104,92 -118,20Z', color)
      + p('M-34,70 Q-18,58 0,64 Q18,58 34,70 Q18,74 0,70 Q-18,74 -34,70Z', color);
  }
  if (kind === 'stubble') {
    return `<path d="M-112,30 Q-104,146 0,154 Q104,146 112,30 Q90,110 0,118 Q-90,110 -112,30Z" fill="${color}" opacity="0.18"/>`;
  }
  return '';
}
