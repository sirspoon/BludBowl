# Changelog

Every change to BludBowl, newest first. The version number is shown in the bottom-right corner of the title screen.

## v3.1 (v3.01 to v3.38, 15–16 Oct 2026)
Everything since v3.00, rolled into one update.

**New pitches**
- **Brimstone:** for Khorne, the Chaos Renegades and Chaos Chosen. Cracked basalt with lava glowing through the joints, lava pools, skulls and embers, with volcanoes and a brass throne on a pyramid of skulls behind the block clashes.
- **Woodland:** for the Wood Elves and Gnomes. A forest glade with dappled sunlight, moss, ferns, bluebells, toadstools and a fairy ring, with sunbeams, toadstool houses and a great oak behind the block clashes.
- **Warped Flagstones:** for the Skaven. Dark, filthy flagstones with warpstone glowing green between the stones and slowly pulsing, in front of a ramshackle wooden stadium lit by warpstone lanterns.
- **Home pitches:** more teams play on one that suits them. Necromantic Horror, Vampires and Tomb Kings play in the Graveyard, and Underworld Denizens on the Mossy Flagstones. Every pitch can also be picked from the Pitch menu.

**Music** ([#7](https://github.com/sirspoon/BludBowl/issues/7))
- **Every pitch has its own music,** which changes section as the match goes on and speeds up when the game gets tense:
  - **Graveyard:** haunting pipe organ, bells, a ghostly choir and a theremin.
  - **Mossy Flagstones:** echoing cave drums, an anvil, a kalimba, a choir and dripping water.
  - **Muddy Grass:** the supporters' band and crowd, singing When the Saints Go Marching In and "There's only one…" for a touchdown scorer.
  - **Brimstone:** epic rock with war drums, brass and a choir chanting "Blood for the Blood God!"
  - **Woodland:** a folk jig with a tin whistle, fiddle and birdsong.
  - **Warped Flagstones:** the cave music, with big rats squealing, chattering and scurrying all around.
- **Referee taunt:** when a player is sent off, every pitch's music gives the referee the terraces' two-note taunt in its own style. It comes in on the beat and blends in with the music.
- **Fixes:**
  - The music was too quiet at the start of a match.
  - It could fail to start properly on phones until it was turned off and on.
  - The Brimstone music could cut out.

**Fouls and the referee** ([#11](https://github.com/sirspoon/BludBowl/issues/11))
- **The referee jumps out:** when a foul gets a player sent off, a big pixel-art referee appears as the whistle blows. He wears a striped shirt, black shorts and a cap, has the whistle in his mouth and holds up a red card, and shakes against the darkened pitch.
- **Five referees,** picked at random: a halfling, a goblin, a dwarf, an elf and a troll (so big he goes off the top of the screen).
- **Nothing gives it away first:** the injury, the "ref spotted" message and the send-off only come once he's gone.

**The computer coach** ([#19](https://github.com/sirspoon/BludBowl/issues/19))
- **Plays much better:** each change was tested over dozens to hundreds of computer-vs-computer matches against the version before.
  - **Re-rolls:** it uses team re-rolls when a failed roll would cost a touchdown or the rest of its turn.
  - **Attacking:** it blitzes a ball carrier who could score, clears opponents away from a loose ball before a hard pickup, and sends two quick players down the wings for the carrier to pass to.
  - **Defending:** it follows up on the ball carrier and spreads its defenders into a proper screen.
  - **Skills:** it uses its players' skills, such as Wrestle, Mighty Blow, Frenzy crowd-surfs, Projectile Vomit, Hypnotic Gaze, Bloodlust and Throw Team-mate.
  - **Careless moves:** it makes fewer, moving players with safe moves before anyone dodges.
  - **Speed:** it works out its moves about twice as fast.
- **Level-ups:** its league teams pick skills like a real coach. Each position gets skills that suit it, with no doubling up, elite skills mostly going to positionals, and some random skills for variety.

**Fixes and smaller changes**
- **Block banner:** declaring a Block shows a banner at the top of the pitch, like the ones for Blitz, Foul, Pass and Hand-off.
- **Freezes:** several ways a match could freeze were fixed: after a Throw Team-mate, a push that knocked the ball loose, the Taunt question, or a bomb in flight. A safety net now hands control back if the game is ever left waiting with nothing happening.
- **Move odds:** they now count Diving Tackle and Sure Feet.
- **Version number:** it no longer sits on top of the main menu on phones.
- **Test mode:** a mode for fast computer-vs-computer test matches (`?simtest`).

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
