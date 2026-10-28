# A turn planner for the computer (design sketch, Oct 2026)

Not built yet. Background: `README.md`, "Turn order", "Team re-rolls" and "The receivers' first turn".

## The problem
The computer decides one player at a time. Whenever it's ready for the next activation, `choose()` (in the `AI` block
of `index.html`) runs down a fixed list (score; blocks with almost no risk; pick up a loose ball; blitz their carrier;
line up an assist; other good blocks; move the carrier; cage; foul; screens; the rest) and does the first thing that
applies. That list mixes up two questions: **what is worth doing this turn**, and **in what order to do it**. Because
the order is the priority order, the ball is handled mid-turn and dice-free moves are often left until after something
risky, so a turnover costs about 3.3 players' actions (coaches: 2.2). And habits that depend on good ordering, like
saving re-rolls early in a half, don't pay: copied on their own they made things worse (`rerolls.patch`,
`turn-order2.patch`).

Strong coaches do it the other way round: they decide the whole turn first, then play it safest-first, with the dice
(dodges, Rushes, the pick-up, the hand-off, the foul) at the end.

## The idea
Split each turn into **plan**, **order** and **play**, and re-plan whenever a result changes the picture.

### 1. Plan: what we want this turn
At the start of the turn (and after any surprise), collect every action worth doing, as *tasks*. The existing step
functions already find them; instead of returning the first, each adds what it finds:
- blocks (`blocks`, with `blockEval`'s chances), the blitz (`carrierBlitz`, `laneBlitz`, `blitzPlan`), assists
  (`assistPlan`)
- the ball: the pick-up, the hand-off or pass (`switchPlay`, `throwToScore`), the carrier's move (`carrierPick`)
- the shape: cage, screen and marker squares (`formationTargets` / `formationPlan`), fouls (`foulPlan`), the rest

Each task records:
- **who** does it
- **value**: what it's worth if it works (the scores those functions already use)
- **risk**: the chance it ends the turn (the dodge, Rush and pick-up odds from `movesFor`, and `pTurn` for blocks)
- **needs**: tasks that must happen first. For example, an assist before the block it helps; a block that knocks a
  marker over before that marked player walks away; the cage squares before the carrier steps in.
- **conflicts**: one player can do only one thing, and there's one blitz, one pass, one hand-off and one foul a turn.

Picking which tasks to keep is the same judgement the computer makes now (it just stops at one).

### 2. Order: safest first
Sort the chosen tasks, respecting `needs`:
1. dice-free moves that nothing else is waiting on (screens, markers, players getting out of the way)
2. assists, then blocks from the safest up (a 3-dice block before a 2-dice one, Block before no Block), and the moves
   those blocks free up
3. **cage first**: the cage players go to the squares round where the carrier *will* stop (worked out up front with
   `carrierPick` on the planned position), without dice where possible
4. the risky part: dodges, Rushes, the pick-up, the hand-off or pass, the carrier's own move (into the waiting cage)
5. the foul, then anything left

Within a group, one known rule for "each step may end the sequence" does well: put first the task with the highest
`value x chance of success / chance of failure`. A sure thing goes first, and a long shot that ends the turn goes last.

### 3. Play, and re-plan
Each task becomes the same kind of plan object `runPlan()` already carries out (`{ pid, kind, pick, target }`), so the
way moves, blocks and throws are actually made doesn't change. After every activation, check the result. If it went
as expected, carry on down the list. If not (a push instead of a knockdown, the ball bouncing, a player down), plan
again from step 1 with the new positions.

### 4. Re-rolls
With the turn planned, `rrWorth` can see what's still to come: how many players haven't acted, what's left of the
plan, and how much rides on this roll. A failure early in a well-ordered turn costs little (only the risky tasks come
after it), so saving re-rolls early in the half becomes affordable, as it is for coaches. A failure in the middle of
the key sequence (the pick-up, the hand-off, the last Rush in) is the one to spend it on.

## Building it in stages (each one testable on its own)
1. **Gather and order, without new judgement.** Inside `choose()`, collect what each step would return (instead of the
   first) and play the safest-first one, using the existing scores. Measure with `bb-turnorder.js`: ball actions and
   dice late, team-mates left when a turnover happens (target about 2.2), then the usual results check.
2. **Cage first.** Work out the carrier's stopping square before the cage moves (anchored there, as `anchor` already
   does for a carrier deep in its own half), move the cage, then the carrier.
3. **Re-rolls that know the plan.** Feed what's left of the plan into `rrWorth`, then try the re-roll habits again
   (`rerolls.patch`: saving early, Rushes, blocks on their carrier).
4. **More risk where it's cheap.** Coaches end 30% of turns in a turnover (the computer 20%), because their risky
   actions come last. With the turn ordered, the computer can take more of the 1-die blocks, hard dodges and Rushes
   that `ai-training` found it too timid about, because they'll only be tried at the end.

## Costs and risks
- **Time to think:** the steps already work out their candidates, so gathering them all costs a few times the
  current work for each decision, not a search. Re-planning happens only after a surprise.
- **Tuning:** the current steps were tuned for their fixed order, so some thresholds will need adjusting; each stage
  gets a results check.
- **Dependencies:** a missed one (say, a player moving away before giving the assist its block needs) would show up
  as worse results; the turn-order numbers and a few drawn-out turns would catch it.
- **The game itself:** nothing changes outside the AI, so two-device play, replays and the game rules aren't touched.

## Stage 1 (Oct 2026): done, not released (`turn-planner-stage1.patch`)
`choose()` became a layer over the old one (now `choose0()`): when the top choice is risky (`planRisk`: a dodge or
Rush on the way, a pick-up, pass, hand-off, foul and the like), it asks again with that player set aside (up to four
times, `tplanTries`) and does the first block or dice-free move first; moves to within 2 of our carrier wait while
the carrier (or a hand-off or pass) is the risky thing. Switch: `tplan`.
- `bb-turnorder.js`: dodges and Rushes 0.80 -> 0.87 of the way through the turn (coaches 0.79), pick-ups 0.40 -> 0.56
  (0.80), free moves still to come after the first risky action 53 -> 40% (34%), team-mates left when a turnover
  happens 3.3 -> 3.0 (2.2). No extra thinking time to speak of.
- Results against v3.65: 34-37 touchdowns, 13-15 wins over 48, then 84-82, 29-33 over 96: 118-119, 42-48 in all;
  casualties 233-192, turnovers 556-568. Level, as expected for a reorder with no new judgement.
- What's left: much of the remaining gap is the cage, which can only form after the carrier moves (stage 2).

## Stage 2 (Oct 2026): done, not released (`turn-planner-stage2.patch`, which includes stage 1)
`cagefirst`: when our carrier is about to move (step 7 of `choose0()`), its stopping square (`carrierPick`) is worked
out once and kept for the turn (`cageDest`); free, unmarked team-mates step without dice into the diagonal squares
round it (not across the carrier's route), and the carrier comes in last. Not for a touchdown run or the last turn.
- `bb-turnorder.js`: free moves still to come after the first risky action 40 -> 37% (coaches 34%), team-mates left
  when a turnover happens 3.0 -> 2.9 (2.2). `bb-cages.js`: team-mates next to the carrier at the end of the turn
  1.8 -> 2.0 (corners 1.38), the ball lost by the end of their next turn 26%.
- Results against v3.65 (stages 1 and 2): 42-43 touchdowns, 15-14 wins, turnovers 178-171 over 48. Level.
- So far the reordering makes the play look more like the coaches' without making it stronger. The pay-off the plan
  is meant to unlock is stage 3 (re-rolls that know what's left of the turn) and stage 4 (more risk at the end).

## Stage 3 (Oct 2026): released in v3.66
The re-roll changes from `rerolls.patch` (`rr2`), now on top of stages 1 and 2. They had been level or worse on the
old turn order; with the turn ordered they pay:
- All four (blocks on their carrier, Rushes critical, catches only from our own pass, no turn-ending or big-stock
  re-rolls in turns 1-2): 35-33, 16-11 over 48, then 70-73, 29-31 over 96: 105-106, 45-42 in all. Level (without the
  turn planner this was 46-52, 15-22).
- Blocks on their carrier and Rushes only: 43-29, 19-14 over 48, then 91-70, 38-25 over 96: **134-99 touchdowns,
  57-39 wins over 144** (about a 2% chance by luck), turnovers 586-599, casualties up (206-162). Released: `tplan`,
  `cagefirst`, `rr2` with `rrSave` and `rrCatch` off (AIP 1 to switch them on).
- Still to try: re-roll decisions that look at the rest of the planned turn directly (stage 3 proper), and stage 4.

## Stage 4 (Oct 2026): tried, not released (`turn-planner-stage4.patch`)
`risk4`: in `blockOK`, with no more than two others left to act (`lateN`), blocks up to pTurn 0.34 (`lateLim`) and
worth 1.5 or more (`lateV`, normally 2.5) are allowed; `planRisk` counts a block with pTurn over 0.2 as risky, so the
planner keeps those till last.
- Blocks 34.4 -> 37.5 per team per match, 1-die blocks 1.5 -> 2.0 (`follow-ups.js`; note its FLAGS argument takes a
  list of switches, so pass '' for all on, not 'all').
- Against v3.66: 36-47 touchdowns, 13-22 wins, turnovers 222-177 over 48. Worse. A failed block late in the turn
  doesn't cost actions, but it leaves the attacker on the floor (out of position, an armour roll, open to a foul) for the
  whole of their turn.
- Stricter (`lateLim` 0.2, `lateV` 2.5: only 1-die blocks with Block, and the usual value): 37-40, 16-17 over 48, and
  no more blocks than before (34.6 v 35.3). Level, and barely different.
- So the extra risk coaches take isn't simply "more blocks at the end of the turn". Their 1-die blocks and hard dodges
  are probably chosen for what they win (a carrier, a sideline push, a lane), which the existing scores already try to
  weigh. Left here.
