# BludBowl: shared notes

What's going on now, across all the sessions working on BludBowl (the owner's control-room chat, job sessions it starts, and
"BludBowl local" on the owner's PC, which does the AI work). **Read this first; before you finish, update it** (move your job
from "In progress" to "Recently done", note anything left open, drop entries that have gone stale). Keep it short: the
changelogs record every game change, `ai-training/README.md` holds the AI research in detail, and CLAUDE.md the standing rules.

## In progress
- (BludBowl local, 17 Nov afternoon) Look-ahead step 3: 288 real matches (`nn/look/lookmatch.js` on the PC), one side
  choosing a style (base / bash / safe) at each turn start by 6 play-outs each judged by the outcome predictor
  (`nn/look/value_server.py` on the GPU), the other the usual v5.12 AI. Plays its own snapshot of index.html. Restarted about
  15:05 after a runner fault (it kept clicking the hidden "Confirm Lineups" button, which restarts the match: 0-0 draws); about
  20 hours. The same fault skewed step 2's positions (almost all drive openers at 0-0): see `ai-training/README.md`, "Look-ahead".

## Recently done (newest first)
- v5.12 (BludBowl local): pick up and score on the last turn takes chances down to 2% (was 8%); level in 288 matches. Blocking
  first to clear the way for the pick-up / throw / receiver (`clearForScore`, the owner's idea) tried and left off (`pusClear` 0):
  fewer scores in the coaches' loose-ball turns (29% v 33%) and level in matches with more Turnovers. Most of the coaches'
  pick-up-and-pass scores (still about 2%) need a receiver far from the end zone to dodge or Rush in: long shots.
  `AI.debugPus()` shows what the check sees in a position (`nn/look/pusdebug.js` loads scoring-turn positions into it).
- v5.11 (BludBowl local): pick up and score (`pus1`): with the ball loose, pick up and hand off / pass to a team-mate who can run
  in, in one action (last turn: any odds; before: 70%+). Coaches' loose-ball scoring turns 29% -> 34% (hand-off ones 11% -> 21%);
  288 matches level (won 112, lost 110, touchdowns 272-253, more passes and hand-offs). Still 0% of the coaches' pick-up-and-pass
  scores (9 turns, mostly last-turn: 1-3 blocks first to free the receiver, then the throw; two are Throw Team-mate teams).
- (17 Nov, no version) Look-ahead, phase 1 step 2 (`nn/look/` on the PC): at 378 turn starts, 4 turn "styles" (the AI with
  different dials: base, bash, safe, score) each played to the end of the turn 6 times and judged by the outcome predictor.
  No style beats the usual play on average, but picking the best one per turn (chosen on half the play-outs, scored on the
  other half) gains +0.56 +- 0.36 points of win chance a turn. Next: real matches with the choice made live (about 6 hours of
  computer time for 288). Plan and details: `ai-training/README.md`, "Look-ahead".
- (17 Nov, no version) Tuning the AI's numeric settings all together by self-play overnight (SPSA, `nn/tune/spsa.js` on the PC):
  37 dials, 600 rounds of 48 matches (about 29,000). Nothing better found: the tuned set against the defaults over 11 checks
  won 361, drew 322, lost 373 (touchdowns 924-921), and in the final 288 won 92, drew 93, lost 103, touchdowns 240-240, with
  fewer blocks (38.8 v 44.8) and casualties. Not released. Per-dial effects from the logged matches: none clearly real. The
  dials are on a flat top; a step up needs new behaviour, not new numbers. Details: `ai-training/README.md`, "Tuning the dials".
- (16 Nov, no version) The 55% bar for a risky run in: not changed. The scoring-turn tester (`nn/tdturn.js`) had a fault - the
  play-outs after the first in one page were spoiled - so v5.09's "44% of coach-converted risky runs" was wrong: really 66% before
  `tdf1`, 69% with it. A 40% bar scored no more; 25% a little more in those positions but lost in matches (won 81, lost 111 of 288).
  Details and a fairer test design (all risky starts, not just the scored ones): `ai-training/README.md`, "Scoring turns".
  The harder scoring turns redone too: the AI scores 25% (not 12-15%): loose ball then run in 42%, then hand-off 14%, then pass
  0%; out of reach 18%. `pts1` (go in after a pick-up at 55%) barely helped there and lost in matches (won 93, lost 121): not kept.
- v5.09 (BludBowl local): scoring turns (`tdf1`), from replaying 365 FUMBBL scoring turns with the AI (`nn/tdturn.js`): it
  scores 99% of free walk-ins, but only 44% of coach-converted risky runs, 12-15% of turns needing a pick-up, hand-off or pass
  first. Most misses had no failed roll: it didn't try (a 55% bar for going in; blocks first; a stalling bug from v5.04, fixed).
  Re-roll use in those turns is about the coaches'. Open: the 55% bar, the carrier blocking instead of running, pick-up-and-score.
- v5.10: HD test, 1.5x (48x48) High Elves made from the originals (`?hd`); the 2x redraw moved to `?hd=64`.
- v5.08: HD White Lion redrawn (helm, lion head on the shoulder, clearer claws), owner's feedback.
- v5.07: HD High Elves redrawn after GW's 2026 miniatures so the positions tell apart at normal zoom (owner's feedback).
- v5.06 (BludBowl local): pick up and pass in one action (`pup1`), real throwers only: completions about 3x (56-17 over 288),
  results level. Passing now: last-turn passes (v5.03) and pick-up-and-pass (v5.06); open-play passes from a carrier still rare.
- v5.05: HD sprite test, High Elves only, behind `?hd` / Settings > HD sprites (test). See `tools/hd-test/README.md`.
- v5.04 (BludBowl local): the AI plans risky plays counting on a team re-roll when it would spend one (`rrp1`, the owner's
  idea): route odds with a re-roll for Blitzes, pick-ups and scoring. More risky plays attempted, results level-to-positive.
  Still open: the general caution (formation moves only at 80-100% odds, `okProb`) is untouched.
- v5.03 (BludBowl local): AI passing. Why it hardly threw: `switchPlay` treats a dropped pass as a 12-point loss, so ordinary
  passes never beat walking the ball up (2 passes in 12 matches between passing teams). Strong coaches pass ~0.31 times a team a
  match (from the replays' decisions), half on the last turn of a half: short throws that rarely score (SPP in league play). v5.03
  adds those last-turn passes (`pas8`): completions up (19-11 over 288 matches, 8-0 v BotBowl's bot), results level. Short passes
  to open team-mates in turns 1-7 and receivers-first (`pas1`, `rcv1`) barely changed passing and are left out
  (`ai-training/passing-2026-11.patch`): open receivers in safe range are rare. Pick-up-and-pass in one action (what coaches often
  do where the AI picks up and runs) isn't tried yet.
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
- **HD sprites (v5.05-v5.10 test, waiting on the owner's verdict).** v5.10: the owner felt the 2x redraws lost the
  originals' character, so `?hd` is now the originals at 1.5x (48x48), upscaled by `tools/hd-test/x15.js` with light shading
  (+~10 KB raw per 4 sprites, any team in seconds); the 2x redraw stays at `?hd=64`. Lesson from v5.07: draw from the real miniatures (GW's
  Warhammer Community article has clean photos) and give each position its own silhouette and colour mass; fine detail alone
  doesn't tell players apart at normal zoom. The High Elves on a 64x64 grid (`SPRITES_HD`, `?hd`). The code
  already scaled sprites from their grid, so it took only a switch, a cache key, crouch scaling and 16 palette letters. Close up
  and on a phone (where a 64 grid is about one pixel per screen pixel) the extra detail shows; at 1x desktop it's slightly
  softer. Cost: +18.9 KB raw / +3.5 KB gzipped per 4 sprites; all ~214 sprites about +0.9 MB raw, +140 KB over the wire.
  Painting is ~4x slower but cached. A full redraw is roughly 40-50 hours of sessions with the drawing kit in `tools/hd-test/`
  (sprites as shaded shapes in code). If it goes ahead: load HD from a separate file only when on, or keep the art as code and
  draw at start-up; indexed PNG sheets are the other option. Details: `tools/hd-test/README.md`.
- AI: it rolls far fewer risky dice than strong coaches (failed dodges and Rushes with a re-roll available: about 0.6 a team a
  match against 3.2), so it spends half as many re-rolls on rolls. That's the general caution, a bigger topic.
- AI: at the end of its turn the AI leaves about one defender a free path to its ball carrier (strong coaches about 0.3), and
  loses the ball more often for it. Two screen attempts made little difference (see `ai-training/README.md`).
- AI, from the race-strength results: Vampires' Bloodlust handling (7 turnovers a match); Snotling and Ogre negative traits
  (re-rolls, the `rr3` work) and Snotling swarm tricks; breaking down armoured teams.
- **AI passing (partly done in v5.03, see above).** The owner is worried about it: the AI essentially never throws a pass. Measured 15 Nov: 0 pass
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
