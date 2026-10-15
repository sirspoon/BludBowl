# BludBowl

A Blood Bowl game in a single file, `index.html`, hosted on GitHub Pages at
https://sirspoon.github.io/BludBowl/ (served from `main`).

## Workflow
- Commit and push straight to `main` — no feature branches or pull requests.
  The owner tests changes on the live site, which updates a minute or two after a push.
- Every change to the game bumps the version by 0.01 (e.g. v2.01 → v2.02).
  The version is the `#app-version` text on the title screen in `index.html`.
  Changes that don't touch the game (like this file) don't bump it.
- With each version bump, add an entry at the top of `CHANGELOG.md` (version, date, what
  changed in plain words, linking any issue it closes). Pushing tags is blocked in cloud
  sessions, so the changelog is the version history.
- When a change fixes an issue, comment on it saying which version fixed it and what changed
  (`gh api -X POST repos/sirspoon/BludBowl/issues/N/comments -f body=...`). Leave the issue
  open: the owner checks the fix on the live site and closes it themselves.
- Use the GitHub REST API (`gh api repos/sirspoon/BludBowl/...`) for issues;
  `gh issue list` and other GraphQL-based commands are blocked in cloud sessions.

## Rules
- The game follows the Blood Bowl 2025 (Third Season) rules. The owner uses
  https://bloodbowlbase.ru/bb2025/ as the reference (e.g. `core_rules/league_play/`,
  `core_rules/rules_and_regulations/`). The WebFetch tool can't reach it, but `curl` from
  the shell can: fetch the page and strip the HTML to read it.

## Testing
- Two-device play (`NET` in `index.html`) uses PeerJS, which can't reach its server from a cloud session. Adding `?nettest`
  to the address swaps the network for a BroadcastChannel, so two tabs in one browser context can play each other.
  Add `&dev=A` (any letters) as well to give each tab its own saved data, like separate devices (needed to test shared leagues).
- AI testing: `?simtest` runs the game in test mode (the clock skips straight to the next event, there's almost no drawing,
  and background chores pause), so a computer-vs-computer match takes ~10s. `node tools/ai-match.js` plays batches of them in
  parallel and compares AI settings (the `AIX` switches): e.g. `--races orc,human --n 20 --new all --old rr,blitz --par 4`.
  It prints the touchdown and win splits with the chance each is just luck. Judge AI changes on a few hundred matches, not a few dozen.
- AI research: `ai-training/` compares the computer's play with strong human coaches on FUMBBL (300 of their matches,
  stats per team) and keeps the scripts to re-run it. Main finding so far: the AI throws about half as many blocks as
  good coaches (24 v 46 a match) and is too cautious generally (few 1-die blocks, hard dodges, rushes or re-rolls).
  Read `ai-training/README.md` before working on the AI.
