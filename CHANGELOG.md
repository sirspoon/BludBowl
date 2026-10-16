# Changelog

Every change to BludBowl, newest first. The version number is shown in the bottom-right corner of the title screen.

## v3.21 (16 Oct 2026)
- **Added:** the Brimstone pitch has its own music ([#7](https://github.com/sirspoon/BludBowl/issues/7)): epic rock, with distorted guitars galloping and crashing out power chords, a rock kit with double kick drums, a bass guitar, war drums, low brass and a war horn, a deep choir chanting "Blood for the Blood God!", an anvil and bubbling lava.

## v3.20 (16 Oct 2026)
- **Added:** a new pitch, **Brimstone**, the home ground of Khorne and the Chaos Renegades. It's cracked basalt columns with lava glowing up through the joints, pools of lava along the sidelines, skulls and bones, scorch marks and embers, with lines of pale ash. Behind the block clashes and replays stands its own scenery: smoking volcanoes, basalt spires and a brass throne on a pyramid of skulls under a red-black sky. It can also be picked from the Pitch menu.

## v3.19 (16 Oct 2026)
- **Added:** the Muddy Grass pitch, home ground of most teams, has its own music ([#7](https://github.com/sirspoon/BludBowl/issues/7)): the supporters' band in the stands, with a big bass drum, a snare, a trumpet and an oom-pah brass bass, and the crowd clapping, roaring, shouting "Oi!" and singing along. The chorus is *When the Saints Go Marching In*.
  - **After a touchdown** the crowd sings "There's only one…" for the scorer, and the match log shows who.
  - **When the referee sends someone off** the band drops back and the crowd lets the referee know what they think of him, with the classic two-note taunt.

## v3.18 (16 Oct 2026)
- **Added:** the Mossy Flagstones pitch, home of the underground teams (Skaven, Goblins, Dwarfs and Chaos Dwarfs), has its own music ([#7](https://github.com/sirspoon/BludBowl/issues/7)). It's set deep in a cave: booming frame drums, a dwarf-forge anvil, knocking stones and gravel, a kalimba, an earth drone, a chanting choir, a low horn and an ocarina, all echoing off the walls, with water dripping and the odd rockfall.

## v3.17 (16 Oct 2026)
- **Added:** the Graveyard pitch has its own music ([#7](https://github.com/sirspoon/BludBowl/issues/7)): haunting pipe organ in D minor over a deep beat, with a ticking clock, rattling bones, a tolling church bell, a ghostly choir and a theremin carrying the tune. Like the Jungle and Elven music, it changes section as the match goes on, and speeds up when the game gets tense.
- **Fixed:** the music was very quiet at the start of a match. During the line-up, set-up and kick-off it plays its calm section, which was only about a quarter as loud as the main beat; it's now about twice as loud. Also, a match resumed after reloading the page, or joined from another device, could start with no music at all until the screen was switched away and back; it now starts at the first tap.

## v3.16 (16 Oct 2026)
- **Fixed:** two ways a match could get stuck, both found in computer-vs-computer testing.
  - **Bombs:** a bomb in flight only landed when the pitch was redrawn. In a background tab, or while a missed bomb scattered three times (about 2 seconds), the freeze safety net could hand control back with the bomb still in the air. Bombs now always land, and the safety net waits for them. Over 40 test matches with bomb and Frenzy teams, stuck games went from 3 to none.
  - **A push that knocks the ball loose:** the block carried straight on while the ball was still bouncing. With Frenzy, the second block could start while a player was rolling to catch the bouncing ball, and the game was left waiting. The follow-up and any Frenzy block now wait for the ball to stop.

## v3.15 (16 Oct 2026)
- **Changed:** the computer's linemen sometimes level up with a random skill ([#19](https://github.com/sirspoon/BludBowl/issues/19)). About a third of their advancements are now random primary skills, which cost fewer SPP. Like a coach, the computer rolls two skills (from General if the lineman has it) and keeps the more useful one, so its teams end up with more varied, less predictable skills.

## v3.14 (16 Oct 2026)
- **Changed:** the computer's league teams pick level-up skills more like a real coach ([#19](https://github.com/sirspoon/BludBowl/issues/19)).
  - **No doubling up:** a player with Block doesn't take Wrestle, and the other way round, since they do much the same job.
  - **Elite skills:** Block, Dodge, Guard and Mighty Blow add 10k more to a player's value, so they now go mostly to positionals. Linemen take them only when nothing else useful is left. Once three players on a team have gained one, the rest of the team moves on to other skills.
  - **Variety:** it doesn't always take its first choice, so its teams don't all end up the same. Most big guys save up for Block, and the rest take Guard or another primary skill.

## v3.13 (16 Oct 2026)
- **Changed:** the computer's league teams now pick level-up skills to suit each position ([#19](https://github.com/sirspoon/BludBowl/issues/19)), using the skills it was found to play best with in test matches. Big guys take Block first (in tests it beat Guard 59 touchdowns to 36), catchers, runners and throwers take Block or Sure Hands, and linemen take Wrestle. Before, every player picked from the same list.

## v3.12 (16 Oct 2026)
- **Fixed:** the odds shown for a move now count an opponent's Diving Tackle (−2 on a dodge out of their tackle zone) and the moving player's Sure Feet (a free Rush re-roll). The computer plans with the same odds, and it no longer values pushing a player with Stand Firm, who can't be moved.

## v3.11 (16 Oct 2026)
- **Changed:** the computer now makes use of its players' skills ([#19](https://github.com/sirspoon/BludBowl/issues/19)). Over 96 test matches against v3.10 it scored 25 more touchdowns and won 41 to 30, with most of the gain for teams that have these skills.
  - **Blocking:** it values Wrestle properly (a Both Down becomes a safe knockdown, not a Turnover), aims Mighty Blow and Claws at players whose armour they can break, and works out the real odds of a Dauntless block.
  - **Crowd surfing:** it looks for blocks that push an opponent off the pitch. With Frenzy, the forced second block can push them out from one square in.
  - **Projectile Vomit:** Trolls with no good block now use it on an adjacent opponent.
  - **Hypnotic Gaze:** a Vampire next to whoever is marking the ball carrier stares them down, so the carrier can walk away without a dodge.

## v3.10 (16 Oct 2026)
- **Changed:** when the computer has the ball, two of its quicker players now work down the wings into the space behind the opposing line ([#19](https://github.com/sirspoon/BludBowl/issues/19)), one on each side, on unmarked squares few opponents can reach. That gives the carrier someone to hand off or pass to, and two more threats the defence has to cover. Over 96 test matches against v3.09 it scored 19 more touchdowns and won 37 to 23.

## v3.09 (15 Oct 2026)
- **Changed:** the computer uses its team re-rolls to save a turn ([#19](https://github.com/sirspoon/BludBowl/issues/19)). When a failed dodge, rush, pick-up or block would end the turn and three or more team-mates still have to act, it re-rolls. Before, it often kept the re-roll and lost the rest of the turn. Early in a half it keeps its last re-roll back unless five or more players would lose their go. Over 96 test matches against v3.08 it scored 92 touchdowns to 56, won 41 to 18, and had about 20% fewer turnovers.

## v3.08 (15 Oct 2026)
- **Fixed:** when the computer's ball carrier was deep in its own half with no opponent nearby, the whole team ran back to stand round them on their own goal line. Now two players stay with the carrier as an escort, and the rest set up further up the pitch, where the carrier is heading. It only does this when no opponent could reach the carrier with a blitz. Over 192 test matches it played as well as v3.07.

## v3.07 (15 Oct 2026)
- **Fixed:** a match could freeze when a push knocked the ball loose onto a player while the Taunt question was showing. The catch roll then put the game back into its waiting state after the block had already finished. Taunt is now asked once the ball has settled.
- **Added:** a safety net for freezes like these. If the game is ever waiting with nothing left to happen (no question or roll on screen, nothing moving), after 2 seconds the coach whose turn it is gets control back. It's not used in two-device play.

## v3.06 (15 Oct 2026)
- **Fixed:** a match could freeze after a Throw Team-mate. If the thrown player crash-landed onto the loose ball and someone then caught it, the game handed back control before the catch was rolled, and the catch left the game locked with nobody able to act. It now waits for the ball to settle first.

## v3.05 (15 Oct 2026)
- **Changed:** the computer defends better and makes fewer careless turnovers ([#19](https://github.com/sirspoon/BludBowl/issues/19)). Over 240 test matches against v3.04 it scored 214 touchdowns to 173 and won 93 to 66, with 12% fewer turnovers.
  - **Staying on the ball carrier:** after pushing back an opposing ball carrier who stays on their feet, it follows up, so they're still marked and have to dodge away.
  - **Defensive screen:** each defender now goes to a different spot. Before, everyone could be sent towards the same far-off square, leaving gaps for the carrier to run through.
  - **Safe moves first:** players get into position with moves that need no dice before anyone dodges, and nobody rushes just to reach a formation square.

## v3.04 (15 Oct 2026)
- **Changed:** the computer works out its moves about twice as fast, so its turns are snappier, especially on phones.
- **Added:** a test mode for automated computer-vs-computer matches (add `?simtest` to the address). The game clock skips straight to the next event instead of waiting, the pitch is only redrawn once a second, and autosave, music and other background chores pause. The rules and dice are untouched. A match takes about 10 seconds instead of 90, so AI changes can be checked over hundreds of matches. It doesn't affect normal play.

## v3.03 (15 Oct 2026)
- **Changed:** two more computer-coach fixes, found by watching the AI play itself in 64 test matches ([#19](https://github.com/sirspoon/BludBowl/issues/19)).
  - **Loose ball:** before trying a hard pickup, it first blocks (or blitzes) away the opponents standing next to the ball. Failed 5+ and 6+ pickups dropped from 18 to 6 over 24 matches.
  - **Vampires:** it now knows about Bloodlust. A thirsty Vampire finishes its move next to a Thrall to feed, after it has made its blitz, foul or hand-off. Bloodlust turnovers dropped from 7 to 2.

## v3.02 (15 Oct 2026)
- **Changed:** the computer can hand off or pass backwards again. A team-mate further back who is better placed to carry the ball forward is a fine choice. The v3.01 rule that stopped it is gone, and the touchback fix stays.

## v3.01 (15 Oct 2026)
- **Changed:** the computer plays smarter ([#19](https://github.com/sirspoon/BludBowl/issues/19)). In test matches against the old version it scored 22 touchdowns to 14.
  - **Re-rolls:** it always re-rolls a roll that decides a touchdown, whether that's its carrier going in or stopping a carrier who could score next turn. It spends spare re-rolls late in a half.
  - **Blitzing the carrier:** it treats a ball carrier who could score next turn as urgent, and will blitz them at worse odds.
  - **Holding ground:** with the carrier deep and safe, players up the pitch hold their ground instead of all running back.
  - **Touchbacks:** it gives the ball to an unmarked player well up the pitch who handles it well, rather than whoever is furthest back.
  - **Really Stupid players:** it moves a team-mate next to its Trolls, and other Really Stupid players, before activating them.
  - **Passing teams:** they pass more.
  - **Throw Team-mate:** it hands the ball to a Goblin or Gnoblar next to a thrower to throw them in. Throw Team-mate teams fling team-mates up the pitch into space.

## v3.00 (15 Oct 2026)
Everything since version numbering began (v2.00), rolled into one update.

**Teams and Star Players**
- **All 30 teams:** every team from the 2025 rules is in the game. The 15 newest are Halflings, Imperial Nobility, Norse, Elven Union, Old World Alliance, Gnomes, Chaos Chosen, Chaos Renegades, Khorne, Nurgle, Snotlings, Tomb Kings, Necromantic Horror, Vampires and Underworld Denizens.
- **What each team has:** a default team, a Sevens squad, names and kits, and sprites drawn to look like the official models. Every team can be used in exhibition matches, the Team Builder, leagues, two-device play and Sevens.
- **New league:** the Chaos Clash.
- **Big Guy limits:** applied where the rules set them.
- **Favoured of...:** some teams are dedicated to a Chaos god. The Chaos Chosen and Renegades choose theirs in the Team Builder.
- **New skills and rules:**
  - Pick-me-up, Trickster, Animosity, Decay and Plague Ridden.
  - Swarming, which you place by tapping the pitch, and Insignificant.
  - Thrall bites for Bloodlust, and Raise the Dead raising each team's own Lineman.
- **Star Players:** every 2025 Star Player is in, including the god-specific Chaos stars ([#16](https://github.com/sirspoon/BludBowl/issues/16)). Their choices, and those of Trickster and the Sports-Wizard, are made by tapping the pitch.
- **Team Builder:**
  - Players can be moved up and down, with a "Positionals first" button ([#2](https://github.com/sirspoon/BludBowl/issues/2)).
  - Changing race switches to that race's colours.
  - Every list of teams is alphabetical.
  - Lineups follow the roster order.

**Two-device play** ([#18](https://github.com/sirspoon/BludBowl/issues/18))
- **Play a friend:** use another phone, tablet or computer with a room code.
- **Your own choices:** each player makes their own pre-match choices, starting eleven and post-match report on their own device.
- **While playing:** names and chat, waiting banners, other players' buttons greyed out, and reconnecting or resuming after a dropped connection.
- **League play:** career teams, league fixtures, and shared leagues for any number of players, with a commissioner who can settle unplayed matches.

**On the pitch**
- **Blocks:** they play out on the pitch: the clash, the push, the follow-up and players toppling over. There's a clash animation set against each pitch's own scenery, with the ball shown in the carrier's hand.
- **Replays:** passes, Throw Team-mates and bombs get close-up 16-bit replays, with slow-motion highlights and blood. They can be turned off in Settings.
- **Camera:** it follows the action.
- **Weather:** it shows on the pitch.
- **New pitch:** a High Elven pitch.
- **Speed up:** the computer's turns can be sped up.
- **Set-up:** saved formations for kick-offs, and the receiving team stays hidden while the kicking team sets up.

**Rules and fixes**
- **Team re-rolls:** they can be used on more rolls ([#20](https://github.com/sirspoon/BludBowl/issues/20), [#29](https://github.com/sirspoon/BludBowl/issues/29)).
- **Activation rolls:** these, such as Bone Head, happen when the player first acts, so an action can still be cancelled until then ([#6](https://github.com/sirspoon/BludBowl/issues/6)).
- **Post-game:** you can spend your treasury before Expensive Mistakes is rolled, and advancements follow the rules. Journeymen get proper names ([#10](https://github.com/sirspoon/BludBowl/issues/10)).
- **Fixes:** a touchdown on the last turn no longer starts a new drive ([#28](https://github.com/sirspoon/BludBowl/issues/28)), and MVP nominations now follow the rules ([#8](https://github.com/sirspoon/BludBowl/issues/8)).

**Look and sound**
- **Inducements:** each team's inducements get their own panel, and you can tap any of them to see what it does.
- **Interface:** smaller roll and question panels at the bottom of the screen, a tidier top bar, and a resizable match log.
- **Music:** the Jungle Temple and High Elf pitches have their own.
- **Team calls:** picking a team can play a call of its own ("Ogres, my lord!").
- **Changelog:** click the version number on the title screen to see this list.
