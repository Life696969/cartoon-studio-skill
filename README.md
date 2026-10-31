# Cartoon Studio

A Claude Code skill that makes short cartoon videos with talking characters,
for free. You describe the video you want; Claude asks simple questions,
shows you the characters, the words and a preview, and makes the final MP4.

It's built for startup explainers and fashion or try-on stories:

- **Characters you design.** For each one, Claude draws 3 versions to choose
  from, and you can change anything. Saved characters come back the same in
  every video.
- **They talk and move.** Lip-sync to the voice, blinks, expressions,
  gestures, and smooth spring-based movement at 60 fps.
- **Try-on moves.** Dresses, gowns and sundresses with patterns and swinging
  hems, a twirl that changes the outfit mid-spin, and a sparkle "try-on"
  swap.
- **Voices.** Your own recordings (any phone format), free AI voices that
  run on your computer, or both.
- **Ready for Reels and Shorts.** Tall or wide, speech bubbles kept out of
  the app's button areas, and sound levelled to -14 LUFS.
- **Safe for your computer.** No browser is ever opened to draw, nothing is
  installed without asking, and nothing is posted anywhere.

## Install

See [INSTALL.md](INSTALL.md). In short, give Claude Code this repo's link and
ask it to install the skill.

## How a video gets made

1. **Interview.** One question at a time, as clickable choices.
2. **The words.** Shown in the chat for your OK.
3. **Characters.** 3 versions each; you pick and edit.
4. **Pictures of every moment.** For your OK.
5. **A quick preview video.** For your OK.
6. **The final video.** On your computer, ready to upload.

Your characters and videos live in `~/CartoonStudio`, outside the skill, so
updates never touch them.

## What it can't do (yet)

- **Movement and props:** no walking, sitting, other props, camera moves, or
  side and back views.
- **Turning:** characters face the camera, and the twirl is a classic
  cartoon squash-and-flip.
- **Cast size:** up to 2 characters per video.

## Under the hood

The parts:

- `kit/`: an SVG character kit.
- `engine/`: the motion, lip-sync, audio and render pipeline.
- `scripts/`: laptop check, setup, make, character pictures and voice
  samples.
- `references/`: the rules the skill follows.

Frames are drawn with resvg and piped into ffmpeg.

```bash
node scripts/doctor.mjs                                  # what this computer has / lacks
node scripts/setup.mjs --only deps,ffmpeg,rhubarb,kokoro # install only what's missing
node scripts/make.mjs <video-folder> voice|stills|preview|final
```

## Licences

| What | Licence | How it's included |
|---|---|---|
| This project's code and docs | MIT, see [LICENSE](LICENSE) | In this repo |
| Nunito font | SIL Open Font License, see `kit/fonts/OFL.txt` | Bundled |
| resvg (`@resvg/resvg-js`) | MPL-2.0 | Installed from npm by setup |
| Rhubarb Lip Sync | MIT | Downloaded from its official release by setup, only with your OK |
| Kokoro-82M voices | Apache-2.0 | Downloaded by setup, only with your OK |
| kokoro-onnx | MIT | Downloaded by setup, only with your OK |
| ffmpeg | Its own licence | Installed by setup, only with your OK |
