// Character composer: character data (who they are) + state (what they are
// doing this frame) -> one SVG <g>. Pure function, no I/O, so the same call
// serves still sheets, previews and every frame of a final render.
import { SKIN, HAIR, pick, shade } from './style.mjs';
import { RIG, withDefaults } from './rig.mjs';
import { EXPRESSIONS, GESTURES } from './presets.mjs';
import { headGeometry, ears, face } from './parts/head.mjs';
import { eyes, brows, nose, cheeks, glasses, mouth, MOUTH_Y } from './parts/face.mjs';
import { hair, facialHair, NOMINAL } from './parts/hair.mjs';
import { neck, behindNeck, torso, legs, skirt, fabric, OUTFITS } from './parts/body.mjs';
import { arm } from './parts/arms.mjs';

export const CHARACTER_SCHEMA = 'cartoon-studio/character@1';

let instance = 0;

// state: {
//   gesture | pose          named gesture, or a full pose (see rig.mjs)
//   expression              name, or { eyes, brows, mouth }
//   mouth, blink, gaze      lip-sync shape, blink now, [x, y] -1..1
//   outfit                  overrides look.outfit (try-on, costume changes)
//   spin                    -1..1 horizontal squash for turns (1 = facing us)
//   fx: { hairSway, hemSway, flare }   secondary motion from the timeline
// }
export function drawCharacter(character, state = {}) {
  const look = character.look;
  const id = `${character.id}-${instance++}`;
  const skin = pick(SKIN, look.skin);
  const hairColor = pick(HAIR, look.hair?.color ?? 'black');
  const outfit = state.outfit ?? look.outfit ?? {};
  const top = outfit.top ?? 'tshirt';
  const color = outfit.color ?? '#5b8def';
  const fx = state.fx ?? {};

  const pose = withDefaults(state.pose ?? GESTURES[state.gesture ?? 'idle'] ?? {});
  const expr = typeof state.expression === 'object'
    ? state.expression
    : EXPRESSIONS[state.expression ?? 'neutral'] ?? EXPRESSIONS.neutral;
  const eyeState = state.blink ? 'blink' : expr.eyes;
  const mouthName = state.mouth ?? expr.mouth;
  const gaze = state.gaze ?? expr.gaze ?? [0, 0];

  // Head placement: chin rests just over the neck top.
  const g = headGeometry(look.head);
  const headY = RIG.neckTop - (g.ry + g.chin) + 22;
  const hairScale = `scale(${(g.rx / NOMINAL.rx).toFixed(3)},${(g.ry / NOMINAL.ry).toFixed(3)})`;
  const headT = `translate(0,${RIG.neckTop + pose.head.nod}) rotate(${pose.head.tilt}) translate(0,${headY - RIG.neckTop})`;
  const { shift, bob, lean } = pose.body;
  const bodyT = `translate(${shift},${bob}) rotate(${lean} 0 ${RIG.hipY})`;
  const turnX = pose.head.turn * 26;   // features slide toward where the head faces
  const hairSway = `rotate(${(fx.hairSway ?? 0).toFixed(2)} 0 -110)`;

  const h = hair(look.hair?.style ?? 'messy', hairColor);
  const browColor = shade(hairColor, 0.15);
  const cloth = fabric(outfit.pattern, color, outfit.accent, id);
  const sleeveStyle = OUTFITS[top]?.sleeve ?? 'short';
  const armArgs = (side, a) => ({
    side, ...a, skin, sleeveStyle, sleeve: color,
    cuff: top === 'blazer' ? (outfit.accent ?? '#ffffff') : undefined,
  });
  const bald = ['balding', 'none'].includes(look.hair?.style);

  const headGroup = `<g transform="${headT}">
      ${ears(look.head, skin)}
      ${face(look.head, skin, bald)}
      <g transform="translate(${turnX.toFixed(1)},0)">
        ${facialHair(look.facialHair, hairColor)}
        ${cheeks(look.cheeks !== false)}
        ${nose(look.nose, skin)}
        <g transform="translate(0,${MOUTH_Y}) scale(1.25)">${mouth(mouthName, `${id}-m`)}</g>
        ${eyes({ state: eyeState, gaze, style: look.eyes?.style, iris: look.eyes?.iris, skin, id })}
        ${brows({ ...expr.brows, color: browColor, thick: look.brows?.thick ?? 9 })}
      </g>
      <g transform="translate(${(turnX * 0.35).toFixed(1)},0) ${hairScale}">${h.front}</g>
      <g transform="translate(${turnX.toFixed(1)},0)">${glasses(look.glasses)}</g>
    </g>`;

  const spin = state.spin ?? 1;
  return `<g transform="scale(${(look.scale ?? 1) * spin},${look.scale ?? 1})">
    <defs>${cloth.defs}</defs>
    <g transform="${bodyT}"><g transform="${headT}"><g transform="${hairSway} ${hairScale}">${h.back}</g></g></g>
    ${legs({ pants: outfit.pants ?? '#34405a', shoes: outfit.shoes ?? '#f4f1ea', outfit: top, shift, bob, skin })}
    <g transform="${bodyT}">
      ${skirt(top, cloth.fill, color, fx, id)}
      ${behindNeck(top, color)}
      ${neck(skin)}
      ${torso(top, { color, accent: outfit.accent, fill: cloth.fill, skin }, id)}
      ${arm(armArgs(-1, pose.armL))}${arm(armArgs(1, pose.armR))}
      ${headGroup}
    </g>
  </g>`;
}

// Wrap a drawing in a standalone SVG document.
export function svgDoc(width, height, body, background = 'none') {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    ${background === 'none' ? '' : `<rect width="100%" height="100%" fill="${background}"/>`}
    ${body}
  </svg>`;
}
