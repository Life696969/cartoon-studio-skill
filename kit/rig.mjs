// The rig: where every joint sits on a standing character, and how a pose
// (a set of joint angles) is described. Parts hang off these joints; poses
// and animation only ever change angles and offsets, never part artwork.
//
// Character space: x centred, y = 0 at the ground, up is negative.
// Angle convention for arms: degrees away from hanging straight down,
// positive = outward (away from the body), for both arms. The composer
// mirrors the right arm, so poses read the same on either side.

export const RIG = {
  hipY: -280,
  waistY: -330,
  shoulderY: -548,
  neckTop: -600,
  shoulderX: 84,
  hipX: 40,        // leg joints, either side of centre
  ankleY: -34,     // feet stay planted here; legs stretch from the hips
  upperArm: 132,
  foreArm: 120,
  armWidth: 46,
  foreWidth: 40,
};

// A pose is plain data. Missing keys fall back to IDLE.
//   head.turn: -1..1, fakes a three-quarter head turn (features slide sideways)
//   body.shift: hips sideways in px (weight shift; feet stay planted)
export const IDLE = {
  armL: { shoulder: 8, elbow: -6, hand: 'open' },   // viewer-left arm
  armR: { shoulder: 8, elbow: -6, hand: 'open' },   // viewer-right arm
  head: { tilt: 0, nod: 0, turn: 0 },               // degrees, px, -1..1
  body: { lean: 0, bob: 0, shift: 0 },              // degrees, px, px
};

export function withDefaults(pose = {}) {
  return {
    armL: { ...IDLE.armL, ...pose.armL },
    armR: { ...IDLE.armR, ...pose.armR },
    head: { ...IDLE.head, ...pose.head },
    body: { ...IDLE.body, ...pose.body },
  };
}

// The numeric channels animation drives, as [group, key] pairs.
export const CHANNELS = [
  ['armL', 'shoulder'], ['armL', 'elbow'], ['armR', 'shoulder'], ['armR', 'elbow'],
  ['head', 'tilt'], ['head', 'nod'], ['head', 'turn'],
  ['body', 'lean'], ['body', 'bob'], ['body', 'shift'],
];
