# BludBowl: shared notes

What's going on now, across all the sessions working on BludBowl (the owner's control-room chat, job sessions it starts, and
"BludBowl local" on the owner's PC, which does the AI work). **Read this first; before you finish, update it** (move your job
from "In progress" to "Recently done", note anything left open, drop entries that have gone stale). Keep it short: the
changelogs record every game change, `ai-training/README.md` holds the AI research in detail, and CLAUDE.md the standing rules.

## In progress
- (nothing right now)

## Recently done (newest first)
- v5.02 (BludBowl local): the AI re-rolls Bone Head / Really Stupid / Animal Savagery failures when the player's action
  matters (it never did; coaches 19%, now 17%). The choosier one-die block re-rolls are in the code but off (level alone, a
  little negative together). `tools/ai-match.js` now runs on the PC's installed Chrome, ~3x the jsdom runner, and takes `--oldp`.
- Race strength, FUMBBL v BludBowl's AI (control room, 15 Nov; `ai-training/race-strength/README.md`): the AI plays
  Snotlings (22% v FUMBBL 51%), Vampires (25% v 47%; 7 turnovers a match) and Ogres (28% v 40%) much worse than coaches, and
  hardly ever completes a pass; well-armoured teams (Dwarfs, Old World Alliance, Bretonnians, Undead) do far better against it.
- v5.01: Squigmobile sprite right edge fixed. v5.00: Star Player Da Red Gobbo's Squigmobile (Exhibition Play only; extra
  Bribe each half; Hail Mary bombs added to the engine); "What's new" rolled up for the major version.
- v4.96-v4.99: Chaos Wastes weather table and Chaos Wastes pitch (with its own music and crowd taunt). The weather choice is
  only offered for the Glory on the Gridiron 2 tournament, which is always played on the Chaos Wastes pitch.
- v4.94-v4.95: replays: a thrown team-mate carrying the ball keeps it (our own saved matches and FUMBBL replays).
- v4.75-v4.93: Rulesets (tournament packs, GW Matched Play, examples, your own; league/Sevens GW rules shown read-only),
  tournaments using rulesets, roster PDF with a ruleset check, Teams screen filter, Team Builder on tabs, styled menus
  everywhere, phone fixes (landscape summary, skill-tag taps).
- v4.32-v4.34 (BludBowl local): AI keeps the ball better (carrier routes, defensive screen, two safeties). v. BotBowl's
  scripted bot: about 60% wins, up from 55% at v4.24.

## Ideas and open threads
- AI: it rolls far fewer risky dice than strong coaches (failed dodges and Rushes with a re-roll available: about 0.6 a team a
  match against 3.2), so it spends half as many re-rolls on rolls. That's the general caution, a bigger topic.
- AI: at the end of its turn the AI leaves about one defender a free path to its ball carrier (strong coaches about 0.3), and
  loses the ball more often for it. Two screen attempts made little difference (see `ai-training/README.md`).
- AI, from the race-strength results: Vampires' Bloodlust handling (7 turnovers a match); Snotling and Ogre negative traits
  (re-rolls, the `rr3` work) and Snotling swarm tricks; breaking down armoured teams.
- **AI passing: next job for BludBowl local, after v5.02 (the owner's choice, 15 Nov).** The owner is worried about it: the AI essentially never throws a pass. Measured 15 Nov: 0 pass
  attempts in 8 matches with pass-friendly teams (Humans, High/Wood/Dark Elves, Skaven, Elven Union) on v5.01 and on v4.31,
  1 in 8 on v4.11; 19 completions in the whole 870-match round robin (0.01 per team per match). It hands off about as often
  as coaches (0.6-0.75 v 0.46 a team a match). Strong FUMBBL coaches pass in about half their matches (at least 0.59
  passers per team per match). Long-standing, not a recent regression; the October attempts (`passing-experiments.patch`:
  `passv`, `recvfirst`) raised hand-offs and passes a little but didn't win more. See "Passing" in `ai-training/README.md`.
- Inducements the Glory on the Gridiron pack allows but the game lacks: Mortuary Assistants, Plague Doctors.
- Editable league and Sevens rulesets (only GW's are shown now); worth doing once there's a real league pack to copy.
- Teams screen filters: by league or tournament entered, team value, a name search.
- Installable app (PWA) for phones.

## Decisions to keep
- Rulesets: GW Matched Play is the default and can't be deleted; the two packs are examples (deletable = hidden, restorable).
  A team stores `t.rules`; a tournament stores `cp.rules`; computer teams are drafted to the tournament's rules.
- Star Players that are Exhibition-only use their own flag (not `secret`, which is for the chest-menu Stars) and never
  appear for league or tournament teams.
- "What's new" (CHANGELOG.md) is rolled up into one entry at each major version (v4.00, v5.00); CHANGELOG-FULL.md keeps all.
- Several sessions can push to `main`: pull and rebase first, and take the next free version number.
