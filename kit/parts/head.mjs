// Head shapes and ears. Head-local space: origin at the centre of the face,
// +y down. Every face feature is placed relative to this origin.
import { stroke, shade } from '../style.mjs';

const K = 0.5523; // circle-to-bezier constant

export const HEAD_SHAPES = {
  round:  { rx: 128, ry: 124, chin: 6,  jaw: 0.62 },
  oval:   { rx: 114, ry: 134, chin: 10, jaw: 0.50 },
  soft:   { rx: 122, ry: 128, chin: 14, jaw: 0.42 },
  square: { rx: 126, ry: 122, chin: 4,  jaw: 0.80 },
};

export function headGeometry(shape = 'round') {
  return HEAD_SHAPES[shape] ?? HEAD_SHAPES.round;
}

export function headPath(shape = 'round') {
  const { rx, ry, chin, jaw } = headGeometry(shape);
  return [
    `M0,${-ry}`,
    `C${K * rx},${-ry} ${rx},${-K * ry} ${rx},0`,
    `C${rx},${ry * 0.55} ${jaw * rx},${ry + chin} 0,${ry + chin}`,
    `C${-jaw * rx},${ry + chin} ${-rx},${ry * 0.55} ${-rx},0`,
    `C${-rx},${-K * ry} ${-K * rx},${-ry} 0,${-ry}Z`,
  ].join(' ');
}

export function ears(shape, skin) {
  const { rx } = headGeometry(shape);
  const one = (side) => {
    const x = side * (rx - 6);
    return `<g transform="translate(${x},14)">
      <ellipse cx="${side * 8}" cy="0" rx="21" ry="28" fill="${skin}" ${stroke()}/>
      <path d="M${side * 4},-12 Q${side * 18},-4 ${side * 6},12" fill="none" stroke="${shade(skin, 0.3)}" stroke-width="4" stroke-linecap="round"/>
    </g>`;
  };
  return one(-1) + one(1);
}

// Flat face fill. `shine` adds a highlight on top of the skull for bald heads.
export function face(shape, skin, shine = false) {
  const d = headPath(shape);
  const { ry } = headGeometry(shape);
  const top = shine
    ? `<path d="M-50,${-ry + 26} Q-10,${-ry + 8} 34,${-ry + 18}" fill="none" stroke="#ffffff" stroke-width="9" stroke-linecap="round" opacity="0.45"/>`
    : '';
  return `<path d="${d}" fill="${skin}" ${stroke()}/>${top}`;
}
