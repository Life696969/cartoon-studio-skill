// Named expressions and gestures. These are plain data so the skill (and
// later, an animation timeline) can refer to them by name; adding a new one
// is a new entry here, never a change to the parts.

export const EXPRESSIONS = {
  neutral:   { eyes: 'open',  brows: { raise: 0,  tilt: 0 },   mouth: 'smile' },
  happy:     { eyes: 'happy', brows: { raise: 8,  tilt: 0 },   mouth: 'grin' },
  cheerful:  { eyes: 'open',  brows: { raise: 8,  tilt: 2 },   mouth: 'grin' },  // happy, but eyes open: use while talking
  laughing:  { eyes: 'happy', brows: { raise: 12, tilt: 4 },   mouth: 'D' },
  surprised: { eyes: 'wide',  brows: { raise: 20, tilt: 0 },   mouth: 'o' },
  thinking:  { eyes: 'open',  brows: { raise: 6,  tilt: -4 },  mouth: 'smirk', gaze: [0.7, -0.7] },
  worried:   { eyes: 'sad',   brows: { raise: 6,  tilt: 16 },  mouth: 'frown' },
  annoyed:   { eyes: 'half',  brows: { raise: -2, tilt: -14 }, mouth: 'flat' },
  confident: { eyes: 'open',  brows: { raise: 2,  tilt: -8 },  mouth: 'smirk' },
};

export const GESTURES = {
  idle:     {},
  wave:     { armR: { shoulder: 48, elbow: 104, hand: 'wave' }, head: { tilt: -4 } },
  point:    { armR: { shoulder: 84, elbow: 6, hand: 'point' } },
  pointUp:  { armR: { shoulder: 30, elbow: 128, hand: 'point' } },
  explain:  { armL: { shoulder: 22, elbow: -62, hand: 'open' }, armR: { shoulder: 30, elbow: 64, hand: 'open' } },
  clasp:    { armL: { shoulder: 18, elbow: -96, hand: 'open' }, armR: { shoulder: 18, elbow: -96, hand: 'open' } },
  shrug:    { armL: { shoulder: 40, elbow: 78, hand: 'open' }, armR: { shoulder: 40, elbow: 78, hand: 'open' }, head: { tilt: 6 } },
  thumbsUp: { armR: { shoulder: 16, elbow: -118, hand: 'thumbsup' } },
  think:    { armR: { shoulder: -14, elbow: -158, hand: 'fist' }, head: { tilt: 5 } },
  present:  { armL: { shoulder: 30, elbow: 20, hand: 'open' }, body: { lean: -2 } },
  // Fashion / try-on poses
  handOnHip: { armR: { shoulder: 50, elbow: -94, hand: 'hip' }, body: { shift: 14, lean: 1.5 }, head: { tilt: -4 } },
  pose:      { armR: { shoulder: 50, elbow: -94, hand: 'hip' }, armL: { shoulder: 26, elbow: 30, hand: 'open' }, body: { shift: 16, lean: 2 }, head: { tilt: -6, turn: 0.25 } },
  holdPhone: { armL: { shoulder: 12, elbow: -130, hand: 'phone' }, head: { tilt: 4, turn: -0.2 }, body: { shift: -6 } },
  showPhone: { armL: { shoulder: 70, elbow: 40, hand: 'phone' }, body: { shift: -10, lean: -2 } },
  twirl:     { armL: { shoulder: 58, elbow: 24, hand: 'open' }, armR: { shoulder: 58, elbow: 24, hand: 'open' }, head: { tilt: 6 } },
};
