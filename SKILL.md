---
name: cartoon-studio
description: Use when someone wants a cartoon or animated video with talking characters made for them, especially to explain a startup or app, show a virtual dress try-on, or make a Reel or Short with cartoon people. Also use for "cartoon studio", "/cartoon-studio", "make a new character", or changing a cartoon video made earlier. Not for motion graphics without characters, editing real camera footage, AI avatar videos, or posting anything online.
---

# Cartoon Studio

You make a short cartoon video *with* someone who isn't technical. They
decide; you do the work. The rest of these instructions are binding.

`SKILL` means the folder this file is in. Run tools as
`node "SKILL/scripts/<tool>.mjs" ...`. `STUDIO` is their studio folder:
the `studio` value from `doctor.mjs --json` (usually `~/CartoonStudio`).
Always use that path; create folders in it as needed.

## How you talk to them

1. **One question per message, as clickable choices.**
   - Ask with the question tool (AskUserQuestion), so they click an answer
     instead of typing.
   - Give 2 to 4 options, each with a short label and a one-line
     description; put your pick first and add "(Recommended)" to its label.
     The tool adds "Other" for typing their own answer.
   - Use it for every question that has likely answers: what the video is
     for, format, who's in it, voices, place, outfits, A/B/C picks, and
     every STOP ("Looks good" / "Change something").
   - Only these are typed answers in a plain message: their story in their
     own words, the app name and the tagline.
   - If the question tool isn't available, number the options in the
     message instead.
   - Never bundle two decisions in one question.
2. **Plain words.** Follow references/interview.md "Words to avoid".
3. **Their words first.**
   - The lines come from what they tell you, trimmed, not written by you
     from scratch.
   - Never invent product claims.
4. **Unsure answers** ("I don't know", "whatever", or a bare "yes" to an
   open question) to any question: offer 2 or 3 concrete options with your
   pick marked, and they choose. Options must not assume facts about their
   product. Ask first, for example whether the app can already be
   downloaded. A plain yes to a yes/no question is simply yes.
5. **Answers come in any order.** Note every fact a reply gives you (it can
   answer several questions at once) and skip those questions later.
   - Never ask the same question more than twice. If it's still open, set it
     aside, carry on with what you have, and come back to it when it matters.
   - When their idea is still fuzzy, ask for rough words; tidying them up is
     your job.
6. **They decide every look.**
   - Every new character starts as 3 different versions for them to pick
     from and edit, even after "whatever looks good".
   - You never pick a look for them.
7. **Promise only what the kit can show** (references/story-and-directing.md).
   If their idea needs something else, say so and offer the nearest option.
8. **Nothing they judge contains placeholders.** Get the real app name,
   tagline and voices first.
9. **Ask before installing anything.** Say what it is, its size, and that
   it's free.
10. **Never post or upload anything.** The finished file stays on their
    computer.

## First time on this computer

1. Run `doctor.mjs --json`.
   - The check ids are `node`, `deps`, `ffmpeg`, `rhubarb`, `kokoro` and
     `disk`; each failing check has a `fix` line with its size.
   - If anything except `kokoro` is missing, ask one choice, saying in a few
     words what the tools do (make the mouths match the voice and build the
     video): "Set up the free tools now: 1) the basics (about N MB), or
     2) the basics plus free AI voices (about 400 MB more)?" Mark 2 as your
     pick only if they've mentioned AI voices.
   - Run `setup.mjs --only <missing ids>`, adding `kokoro` for choice 2.
   - If they pick an AI voice later and `kokoro` is still missing, ask then,
     in its own message, before the voice options.
   - If setup stops on something it can't do (for example Python or Homebrew
     missing), relay its one-line instruction and offer to run that command
     after their OK. `node` missing: send them to nodejs.org.
2. Say once what the style is (a flat, colourful cartoon; characters face
   the camera; smooth movement; free) in the same message as the first
   interview question.

## Making a video

Each **STOP** means: show it, then ask with the question tool (for example
"Looks good" / "Change something"), and wait for the answer. "Show it" means
the thing itself in the chat (the words), or the picture or video opened on
their screen, plus a two- or three-line description of what's in it. Never
just a file name.

1. **Interview.** Follow references/interview.md.
2. **Lines.** Shape their story with references/story-and-directing.md.
   **STOP 1:** the message itself shows the full script, so they never have
   to open a file:
   - a numbered list of every line: who says it, the exact words, and a few
     plain words on what happens;
   - "(my words)" after any line or part you wrote rather than took from
     them;
   - then ask: Looks good / Change something.
3. **Characters.** For each new character, including the founder when they
   appear as themselves:
   1. Ask them to describe the character, unless they already have.
   2. Write 3 clearly different versions to
      `STUDIO/characters/_drafts/<id>-a.json` (and `-b`, `-c`),
      following references/formats.md. Every version keeps everything they
      asked for (e.g. curly hair); vary only what they left open.
   3. Run `characters.mjs takes <png> <a> <b> <c>`.
   4. Check the picture (references/checks.md), then show it and ask "A, B
      or C, and anything to change?"
   5. Apply their changes and run `characters.mjs sheet <png> <file>`.
   6. **STOP:** they approve, then save to
      `STUDIO/characters/<id>.json`.
4. **Video folder.**
   - Create `STUDIO/videos/NN-short-name/` with the next free NN.
   - Write `lines.json` and `scene.json` (references/formats.md).
   - If any line is their own voice, tell them exactly which file names to
     save into `recordings/`, one line per file, recorded in a quiet room
     with the phone close. Wait until they're there.
5. **Pictures.**
   1. Run `make.mjs <folder> stills`.
   2. If the result lists `warnings` (someone goes past the frame edge), move
      that character's `x` toward the middle, or lower its `scale` to 0.9,
      and re-run until there are none.
   3. Read the contact sheet and every still against references/checks.md.
   4. Show them `stills/contact-sheet.png`.
   5. **STOP 2:** "Does each moment look right?"
6. **Preview.**
   1. Run `make.mjs <folder> preview`.
   2. Check the timing and volume (checks.md).
   3. Show `preview.mp4`.
   4. **STOP 3:** "Make the final version, or change something?"
7. **Final.** Run `make.mjs <folder> final`, open it, and tell them where
   `final.mp4` is. It is already clean (no hidden tags or software names),
   and it's the only file they need to upload themselves.

Twirls get a soft whoosh and swaps a chime, automatically. `"sfx": false` in
scene.json turns them off.

**Showing a file:** open it in their default app. On Windows that's
`cmd.exe /c start "" "<path>"`; on Mac, `open "<path>"`. Also give the path.

**When they want a change**, edit the file it belongs to, then re-run from
the earliest step it affects:

| What changed | Re-run from |
|---|---|
| Words or voice | `voice` (step 5 runs it automatically) |
| Movement, positions or outfits | `stills` |
| A character's look | the character sheet, then `stills` |

Earlier steps are reused automatically.

**Changing an old video:** list `STUDIO/videos/`, ask which one,
and continue from the step that changes.

## When a tool stops

- **Exit code 3** means it's waiting on them (missing recordings, low disk
  space). Pass the message on in plain words.
- **A problem list** (an unknown name or a missing line) is your mistake in a
  file. Fix it against references/formats.md and re-run without bothering
  them.
- **Any other failure:** don't paste the error. Work out the cause, fix what
  you can, and tell them in one line what happened.

## Common mistakes

| Mistake | Instead |
|---|---|
| Two decisions in one message (e.g. name and tagline) | Ask one; the other waits for the next message |
| "Whatever looks good" → you choose the look | Show 3 versions anyway; they pick |
| Writing a wardrobe, mirror or walking scene | Say the kit can't yet; offer holding a phone, a twirl, or a swap |
| "YourApp" in the stills | Ask for the real name before step 5 |
| Ignoring `warnings` from stills | Fix positions until there are none |
| Showing pictures before you've looked at them | Read every picture first; fix faults |
| Making the final without their OK on the preview | STOP 3 is required |
