# BludBowl: shared notes

What's going on now, across all the sessions working on BludBowl (the owner's control-room chat, job sessions it starts, and
"BludBowl local" on the owner's PC, which does the AI work). **Read this first; before you finish, update it** (move your job
from "In progress" to "Recently done", note anything left open, drop entries that have gone stale). Keep it short: the
changelogs record every game change, `ai-training/README.md` holds the AI research in detail, and CLAUDE.md the standing rules.

## In progress
- **AI re-rolls** (BludBowl local, 15 Nov): comparing the AI's re-roll use with 288 strong-coach FUMBBL replays. First gap
  found: the AI never re-rolls Bone Head-type failures (Bone Head, Really Stupid...). Trying an `rr3` switch for that. Will
  likely release as the next version (v5.02).
- **Race strength: FUMBBL v BludBowl's AI** (control room, 15 Nov): `ai-training/race-strength/`. FUMBBL Competitive results
  (31,541 matches, May-Nov 2026) are in; a full AI round robin (all 435 pairings, home and away, v5.01) is running. Findings
  go into `ai-training/race-strength/README.md` and get passed to BludBowl local.

## Recently done (newest first)
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
- AI: at the end of its turn the AI leaves about one defender a free path to its ball carrier (strong coaches about 0.3), and
  loses the ball more often for it. Two screen attempts made little difference (see `ai-training/README.md`).
- AI: use the race-strength results to find races the AI plays notably worse than FUMBBL coaches do.
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
