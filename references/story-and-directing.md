# Story and directing

## What the kit can show (promise nothing else)

- Up to 2 characters, standing and facing us, in an office or a plain studio.
- They talk with lip-sync, change expression, and use the gestures in
  references/formats.md.
- They hold or show a phone, put a hand on the hip, pose, twirl, and change
  outfit with a twirl or a sparkle swap.
- Words appear in speech bubbles (vertical) or a caption bar (wide), and the
  office whiteboard can carry a short brand word.

It cannot show:

- walking, sitting, or lying down
- other props (wardrobes, mirrors, shopping bags, food)
- crowds, close-ups, camera moves, or side and back views
- the phone screen's contents
- their real app screenshots or logo artwork (not yet)

If their idea needs one of these, say so plainly and offer the nearest thing
the kit can do. For example: "We can't show a wardrobe yet, but she can hold
her phone and look worried while she says it."

## Startup story shape (vertical, 20 to 45 s, 4 to 7 lines)

| Beat | Job | Typical direction |
|---|---|---|
| Hook (first line, starts at 0.3 to 0.5 s) | The problem, out loud, in the first 3 s | worried or annoyed, holdPhone or shrug |
| Reaction | A friend or the founder notices | thinking, then cheerful |
| Reveal | The app's name and what it does, in one line | showPhone, cheerful |
| Show it | The try-on itself: a twirl or swap into a new outfit | twirl or swap moment, then pose or handOnHip, happy |
| Payoff | How it feels, what it saves | cheerful or laughing, thumbsUp |
| Call to action (last line) | One clear ask: download, follow, link in bio | wave or present |

Wide videos (60 to 120 s) repeat Show it for 2 to 3 outfits and may add a
line on how it works.

**Lines:**
- Use their words. Trim them to at most about 14 words a line; split longer
  thoughts into two lines.
- Keep their phrasing even when it's informal.
- Never invent claims about their product (prices, numbers, features) they
  didn't say.

## Directing rules

- Speaker: one gesture per line that matches the words.
  - Asking or explaining: explain.
  - Showing the app: showPhone.
  - Confidence: handOnHip or pose.
  - Agreement: thumbsUp.
  - Greeting or goodbye: wave.
- Use `hold: true` when the next line continues the same action.
- Listener: an expression change (surprised, thinking, happy) is usually
  enough. Change a listener's gesture at most every other line.
- Expressions while talking: prefer `cheerful` over `happy`, because `happy`
  has closed eyes.
- One big action (twirl or swap) every 5 to 8 seconds at most. Leave
  `gap` = action duration + 0.5 s on the line after it.
- Two characters: x 0.3 and 0.74.
- If one twirls, put the twirler at 0.34 and the other at 0.82, so the
  twirling hands don't touch the other person. The other should avoid wave
  and point (they reach past the edge); thumbsUp, clasp and present are
  fine.
- `make stills` warns about anyone going past the edge; fix every warning.
- Vertical try-on videos: fps 60, studio background in their brand colour.
- First line at `at: 0.4`, so something moves and speaks immediately.
- `tail` 1.2 to 1.6 s, ending on a held pose.
