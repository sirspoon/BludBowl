# Race strength: FUMBBL coaches v BludBowl's AI

How often each race wins on FUMBBL (people playing) against how often it wins when BludBowl's AI plays itself. A race the AI
wins with much less than FUMBBL coaches do is one it plays badly; much more, one whose style suits the AI (or whose opponents
the AI struggles against).

## How to re-run
1. `python3 pull_fumbbl.py` (writes `matches.json`; stop it once it reaches the dates you want). It reads FUMBBL's public
   match list (`/api/match/list`): date, division, each side's race, team value and score. No replays. The comparison uses the
   Competitive division (BB2025 rules, our 30 races).
2. A full AI round robin (every pairing, home and away; about an hour on 4 cores):
   `node tools/ai-match.js --pairs <all 435 pairs> --n 2 --new all --old all --par 4 --out ai-rr.jsonl`
   (make the pair list with `itertools.combinations` over the 30 race keys).
3. `python3 compare.py matches.json ai-rr.jsonl --md results.md`

## v5.01 results (15 Nov 2026)
Full table: `results-v5.01.md`. FUMBBL: 31,541 Competitive matches, 1 May to 15 Nov 2026. AI: 870 matches, 58 per race
(about ±6-7 points each), starting rosters, the AI as released on both sides.

- The two rankings agree only moderately (Spearman 0.55; 0.57 against FUMBBL matches between near-starting teams). The AI's
  spread from best to worst race is much wider: 53 points against FUMBBL's 31.
- **The AI plays these much worse than coaches:** Snotlings 22% (FUMBBL 51-54%), Vampires 25% (47%), Ogres 28% (40%),
  Nurgle 44% (52%), Halflings 26% (32-35%), and a little worse with Humans and Orcs (about -5).
- **Better than coaches (the style suits AI-v-AI):** Dwarfs 69% (45%), Old World Alliance 75% (56%), Bretonnians 62% (45%),
  Shambling Undead 69% (58%), Khorne 51% (41%). These teams concede very few touchdowns to the AI (0.4-0.5 a match against
  0.8 on average): the AI struggles to break down well-armoured teams.
- Per-race match stats behind the outliers (per team per match; all races: 4.35 turnovers, 2.5 negative-trait failures):
  - Vampires: 7.07 turnovers and 0.38 touchdowns. Bloodlust handling looks like the problem: worth checking what the AI
    does with a failed Bloodlust and whether it causes needless turnovers.
  - Snotlings 14.4 and Ogres 11.6 negative-trait failures a match (Bone Head, Really Stupid and the like), and both lose
    many players (Snotlings suffer 4.7 casualties a match). Re-rolling those failures (the `rr3` work) should help; Snotlings
    probably also need their swarm tricks (Pump Wagon, Fun-hoppa, Stilty Runners, fouls).
  - Passing: completed passes are about 0.01 per team per match for every race, so pass-reliant teams can't play their game.
- FUMBBL alone (see the control-room analysis): Humans 61%, Orcs 60%, Undead 58% on top; Goblins 29%, Halflings 32%, Gnomes
  33% at the bottom; elves improve a lot as teams develop (High Elves 48% at starting value, 61% above 1,500k).
