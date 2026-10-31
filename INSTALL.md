# Installing Cartoon Studio

You need [Claude Code](https://claude.com/claude-code). Claude can help you
install the other two things if they're missing: Node.js 20 or newer (free,
from nodejs.org) and git.

## Install

Open Claude Code and send it this message:

> Install the Cartoon Studio skill from
> https://github.com/Life696969/cartoon-studio-skill
> Clone it into my Claude skills folder as `~/.claude/skills/cartoon-studio`
> (that exact folder name), then tell me how to use it.

Then start a new Claude Code chat and say **"make a cartoon video"**.

The first time, it checks your computer and asks before setting up the free
tools it needs: about 90 MB, plus about 400 MB if you want free AI voices.

## Update

Say **"update the Cartoon Studio skill"**. Claude runs `git pull` in that
folder. Your characters and videos live in `~/CartoonStudio`, outside the
skill, so updates never touch them.

## Remove

Delete the `~/.claude/skills/cartoon-studio` folder. Your videos in
`~/CartoonStudio` stay until you delete them yourself.
