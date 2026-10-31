# File formats: character, lines, scene

Every value below is exactly what the kit understands; the tools reject
anything else and list the problems. If they ask for something not listed,
say it isn't in the kit yet.

## Character — `<studio>/characters/<id>.json`

```json
{
  "schema": "cartoon-studio/character@1",
  "id": "tara",
  "name": "Tara",
  "role": "Customer, can't pick a dress",
  "look": {
    "skin": "wheat",
    "head": "oval",
    "hair": { "style": "long", "color": "darkbrown" },
    "eyes": { "style": "iris", "iris": "#4a2c1a" },
    "nose": "button",
    "glasses": null,
    "facialHair": null,
    "cheeks": true,
    "scale": 1,
    "outfit": { "top": "sundress", "color": "#f2c14e", "accent": "#e76f51", "pattern": "plain", "pants": "#34405a", "shoes": "#e76f51" }
  }
}
```

| Field | Options |
|---|---|
| name, role | shown under the character pictures; keep `role` under about 28 characters |
| skin | porcelain, light, wheat, tan, brown, deep, or any `#hex` |
| head | round, oval, soft, square |
| hair.style | messy, sidepart, curly, bob, long, ponytail, bun, balding, buzz |
| hair.color | black, darkbrown, brown, auburn, blonde, grey, white, blue, or `#hex` |
| eyes.style | classic (big white eyes, small pupils, Doraemon-like), iris (coloured iris, anime-like); `iris` = `#hex` |
| nose | button, dot, line |
| glasses | null, round, square |
| facialHair | null, moustache, beard, stubble |
| cheeks | true (pink blush) / false |
| scale | 1 = adult; 0.85 = shorter or teen; 0.7 = child |
| outfit.top | tshirt, polo, hoodie, blazer, kurta, sweater, dress, gown, sundress |
| outfit.pattern | plain, dots, stripes, checks, floral (patterns show on dress, gown, sundress, and on any top) |
| outfit.color / accent | `#hex`. accent = print, belt, shirt under blazer, buttons, pattern colour |
| outfit.pants / shoes | `#hex`. pants are ignored under dress, gown and sundress (bare legs) |

Sleeves follow the top: dress has puff sleeves; gown and sundress are sleeveless; tshirt and polo are short; the rest are long.

## Lines — `<video>/lines.json`

```json
[
  { "id": "01-tara", "who": "tara", "text": "I have a party tonight, and nothing feels right.", "voice": "af_bella", "lang": "en-us" },
  { "id": "02-founder", "who": "founder", "text": "Try them all on in the app.", "voice": "own" }
]
```

- `id`: two-digit order plus the speaker; it's also the recording's file name.
- `voice: "own"`: they record it as `<video>/recordings/<id>.<m4a|wav|mp3|...>`.
- Otherwise a free Kokoro voice. Women: af_heart (warm, default), af_bella (bright), af_nicole (soft), af_sarah, af_sky, bf_emma (British), bf_isabella (British), hf_alpha and hf_beta (Indian; best with `"lang": "hi"` Hindi text). Men: am_michael (default), am_puck (playful), am_adam, am_fenrir (deep), bm_george (British), bm_lewis (British), hm_omega and hm_psi (Indian; Hindi text).
- `lang`: en-us, en-gb or hi. Optional `speed`: 0.8 to 1.2.
- Keep each line short: at most about 14 words fits one speech bubble well.

## Scene — `<video>/scene.json`

```json
{
  "schema": "cartoon-studio/scene@1",
  "title": "Try-on launch",
  "format": "vertical",
  "fps": 60,
  "background": { "name": "studio", "options": { "color": "#ffe3ec", "accent": "#ff8fab" } },
  "cast": [
    { "id": "tara", "x": 0.3, "start": { "gesture": "holdPhone", "expression": "worried" } },
    { "id": "founder", "x": 0.74 }
  ],
  "beats": [
    { "line": "01-tara", "at": 0.4, "hold": true,
      "speaker": { "gesture": "holdPhone", "expression": "worried" },
      "listeners": { "founder": { "expression": "thinking" } } },
    { "line": "02-founder", "gap": 0.35,
      "speaker": { "gesture": "showPhone", "expression": "cheerful" },
      "listeners": { "tara": { "gesture": "idle", "expression": "surprised" } },
      "caption": "Try them all on in the app." }
  ],
  "moments": [
    { "who": "tara", "after": "02-founder", "plus": 0.25, "action": "twirl", "dur": 1.2, "expression": "happy",
      "outfit": { "top": "gown", "color": "#c1121f", "accent": "#ffd6a5", "pattern": "floral", "shoes": "#c1121f" } }
  ],
  "tail": 1.4
}
```

| Field | Meaning |
|---|---|
| format | `vertical` (9:16, Reels, Shorts) or `wide` (16:9, website, YouTube) |
| fps | 60 for try-on and fashion (smoothest); 30 renders twice as fast |
| background.name | `office` (options: wall, floor, accent as `#hex`; `board` = short text on the whiteboard, e.g. their brand) or `studio` (options: color, accent) |
| cast[].id | a saved character id (loads `<studio>/characters/<id>.json`); optional `character` = explicit path |
| cast[].x | 0 to 1 across the frame. Two people: 0.3 and 0.74. One person: 0.5 |
| cast[].start | gesture and expression before anything happens |
| beat.line | a line id. `at` = seconds from the start (first line), or `gap` = seconds after the previous line ends (default 0.3) |
| beat.speaker / listeners | `gesture`, `expression`, and optional `turn` (-1 to 1: face left or right) and `shift` (hips, px, -20 to 20) |
| beat.hold | true = the speaker keeps the gesture after the line (otherwise they relax to idle) |
| beat.caption | text in the bubble if it differs from the spoken words; `false` = no bubble |
| moments | actions between lines: `who`, `after` (line id) + `plus` seconds, or `at` seconds; plus any of action, dur, outfit, gesture, expression, turn, shift |
| action | `twirl` (spin; the outfit changes mid-spin) or `swap` (sparkle line sweeps down, revealing the new outfit). Both need `outfit` |
| tail | seconds of picture after the last line |
| sfx | optional; `false` turns off the automatic whoosh (twirl) and chime (swap) |

Leave enough `gap` after a line for any moment that follows it (twirl dur + 0.5 s).

**Expressions:** neutral, happy (eyes closed smile), cheerful (open-eyed smile; use while talking), laughing, surprised, thinking, worried, annoyed, confident.

**Gestures:**
- Everyday: idle, wave, point, pointUp, explain, clasp, shrug, thumbsUp, think, present.
- Fashion and app: handOnHip, pose, holdPhone (looks at the phone), showPhone (holds the phone out), twirl (arms out; the `twirl` action uses it by itself).

Mouths, blinks, breathing, weight shift, hair and hem sway are automatic.
