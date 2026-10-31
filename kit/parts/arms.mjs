// Arms and hands. Each arm is a chain: shoulder -> elbow -> wrist, drawn in
// nested groups so a pose only sets three angles. Capsules are drawn as a
// fat ink stroke under a thinner colour stroke, which gives clean outlines
// and seamless elbows on long sleeves.
import { INK, LINE, stroke, shade } from '../style.mjs';
import { RIG } from '../rig.mjs';

const { upperArm, foreArm, armWidth, foreWidth } = RIG;

const capsule = (len, width, color) =>
  `<path d="M0,0 L0,${len}" stroke="${color}" stroke-width="${width}" stroke-linecap="round"/>`;
const capsuleInk = (len, width) => capsule(len, width + LINE * 2, INK);

// Hands in wrist-local space: wrist at origin, fingers toward +y.
// `inner` is the direction (+1/-1 on x) of the thumb.
// `upright` is the rotation that cancels the arm's angles, for props such as
// a phone that should stay upright whatever the arm is doing.
function hand(kind, skin, inner, upright = 0) {
  const t = inner;
  const palm = (cy = 26, rx = 24, ry = 27) => `<ellipse cx="0" cy="${cy}" rx="${rx}" ry="${ry}" fill="${skin}" ${stroke()}/>`;
  const thumb = (x, y, rot) => `<ellipse cx="${x}" cy="${y}" rx="9" ry="17" transform="rotate(${rot} ${x} ${y})" fill="${skin}" ${stroke()}/>`;
  const finger = (x, y, rot, len = 26) =>
    `<g transform="translate(${x},${y}) rotate(${rot})">${capsuleInk(len, 14)}${capsule(len, 14, skin)}</g>`;
  const knuckles = `<path d="M${-12},34 Q0,40 12,34" fill="none" stroke="${shade(skin, 0.35)}" stroke-width="3" stroke-linecap="round"/>`;
  switch (kind) {
    case 'fist':
      return thumb(t * 16, 14, t * -30) + palm(24, 25, 24) + knuckles;
    case 'point':
      return finger(t * 6, 34, 0, 34) + thumb(t * 16, 14, t * -30) + palm(22, 24, 22) + knuckles;
    case 'thumbsup':
      return palm(24, 25, 24) + knuckles + `<g transform="translate(${t * 18},18) rotate(${t * -95})">${capsuleInk(30, 16)}${capsule(30, 16, skin)}</g>`;
    case 'wave':
      return [-24, -8, 8, 24].map((a, i) => finger(t * (-12 + i * 8), 40, a * t * -1, 30)).join('')
        + thumb(t * 24, 18, t * -55) + palm(24, 25, 25);
    case 'phone':
      return `<g transform="translate(0,30) rotate(${upright})">
          <rect x="-26" y="-50" width="52" height="92" rx="9" fill="#2b2f3a" ${stroke()}/>
          <rect x="-19" y="-42" width="38" height="70" rx="4" fill="#8fd3ff"/>
          <rect x="-12" y="-30" width="24" height="34" rx="3" fill="#ffffff" opacity="0.85"/>
        </g>` + palm(24, 22, 20) + thumb(t * 14, 6, t * -60);
    case 'hip':
      return `<ellipse cx="0" cy="22" rx="21" ry="25" fill="${skin}" ${stroke()}/>`;
    case 'open':
    default:
      return palm() + thumb(t * 22, 18, t * -28);
  }
}

// side: -1 viewer-left, +1 viewer-right. The shoulder joint sits just inside
// the torso outline, so the top of the arm reads as a sleeve seam.
// Drawing order: both ink capsules first, then both fills, so the elbow is
// one smooth limb at any angle; the short sleeve and the hand go on top.
// sleeveStyle: long | short | puff | none
export function arm({ side, shoulder, elbow, hand: handKind = 'open', sleeve, skin, sleeveStyle = 'short', cuff }) {
  const longSleeve = sleeveStyle === 'long';
  const sx = side * RIG.shoulderX;
  const a1 = -side * shoulder;  // outward = away from x=0
  const a2 = -side * elbow;
  const inner = -side;          // thumbs point toward the body centre
  const chain = (upper, fore) =>
    `<g transform="translate(${sx},${RIG.shoulderY + 30}) rotate(${a1})">${upper}
      <g transform="translate(0,${upperArm}) rotate(${a2})">${fore}</g>
    </g>`;

  const upperColor = longSleeve ? sleeve : skin;
  const upperW = longSleeve ? armWidth : armWidth - 8;
  const foreW = longSleeve ? foreWidth + 2 : foreWidth - 4;

  const ink = chain(capsuleInk(upperArm, upperW), capsuleInk(foreArm, foreW));
  const sleeveCap = (len, width) =>
    `<path d="M0,-4 L0,${len}" stroke="${INK}" stroke-width="${width + LINE * 2}" stroke-linecap="round"/>`
    + `<path d="M0,-4 L0,${len}" stroke="${sleeve}" stroke-width="${width}" stroke-linecap="round"/>`;
  const sleeveTop = sleeveStyle === 'short' ? sleeveCap(upperArm * 0.5, armWidth + 6)
    : sleeveStyle === 'puff' ? sleeveCap(upperArm * 0.28, armWidth + 22)
      : '';
  const cuffBand = longSleeve
    ? `<path d="M0,${foreArm - 7} L0,${foreArm}" stroke="${cuff ?? shade(sleeve, 0.2)}" stroke-width="${foreW}" stroke-linecap="butt"/>`
    : '';
  const fill = chain(
    capsule(upperArm, upperW, upperColor),
    capsule(foreArm, foreW, upperColor) + cuffBand + `<g transform="translate(0,${foreArm})">${hand(handKind, skin, inner, -(a1 + a2))}</g>`,
  );
  // Short sleeve goes over the arm fill. Known limit: a hand raised back over
  // its own upper arm would sit under the sleeve; no current gesture does that.
  return ink + fill + (sleeveTop ? chain(sleeveTop, '') : '');
}
