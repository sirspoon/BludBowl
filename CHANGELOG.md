# Changelog

Every change to BludBowl, newest first. The version number is shown in the bottom-right corner of the title screen.

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
