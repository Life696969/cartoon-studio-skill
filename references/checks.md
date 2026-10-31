# Checks before they see anything

Look at every picture yourself (read the PNG) before showing it to them. Fix
anything below first, then show it. Never show them a picture with a known
fault.

## Character pictures (takes and sheet)

- Arms, hands and legs connect at the joints; nothing floats or detaches.
- Hair doesn't cover the eyes. Glasses sit on the eyes.
- Outfit colours are distinct from the skin and from each other. Patterns
  are visible on the dress.
- The three takes really differ within their description. If they fixed the
  hair, vary hair colour, skin, eyes, nose, head shape, outfit colour and
  pattern instead.
- The close-up shows the whole hairstyle (buns, curls).

## Stills (after `make stills`)

- `make stills` reported no `warnings` (nobody past the frame edge).
- The first still is a good cover: the opening pose and props are in
  place, and the face is clear.
- Every line has a still. Each bubble or caption shows the right words, fully
  inside the frame, with no word cut off.
- Bubbles don't cover a face. The tail points at the speaker.
- Characters don't overlap in a way that hides a face or hand. If they do,
  widen their x positions.
- Expressions fit the line (no smiling while saying something sad).
- Outfit changes appear at the right moments, and the twirl or swap still
  shows the change mid-way.
- Vertical: no text in the top 220 px or the bottom 420 px (the app's own
  buttons cover them). Bubbles sit at about 250 px, which is fine.

## Preview (after `make preview`)

- The `make` result shows loudness near -14 and true peak at or below -1.
  Report it as "volume is right" or "too quiet/loud".
- Watch for:
  - a gesture that should appear but doesn't
  - a line that starts before the previous one ends (gap too small)
  - an action that overlaps a line
  - a bubble that stays on screen too long
  - long silence

  Fix these in scene.json and re-run.
