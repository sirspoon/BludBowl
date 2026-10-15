# Changelog

Every change to BludBowl, newest first. The version number is shown in the bottom-right corner of the title screen.

## v2.64 (15 Oct 2026)
- **Changed:** the Rosters panel during a match also lists a saved team's players in their Team Builder roster order, within each group (in play, reserves, knocked out, out of the match). Before, they were in starting-formation order.

## v2.63 (15 Oct 2026)
- **Fixed:** when picking your starting team (or your team for the next drive), a saved team's players are now listed in the same order as its roster in the Team Builder. Before, they came in the order they're placed in the starting formation (strongest on the line, quickest at the back). Star Players, Mercenaries and Journeymen, who aren't on the saved roster, come after. Where players start on the pitch hasn't changed.

## v2.62 (15 Oct 2026)
- **Added:** elegant music for the High Elf pitch. It has the same seven sections as the other match music and follows the match's mood, from about 72 to 100 bpm.
  - **Main groove:** a harp flowing in triplets over held strings, with a plucked bass and a soft hand drum.
  - **Stab hook:** short, stately string chords.
  - **Half-time drive:** low strings pulsing, with timpani.
  - **Breakdown:** an airy choir and a solo flute.
  - **Chorus:** a flute tune with the choir and sparkling bells.
  - **Between sections:** a harp glissando leads into each new one.

## v2.61 (15 Oct 2026)
- **Changed:** the jungle music's quiet-beat drums now overlap the sections either side. They creep in quietly under the last bar of the section before and fade out through the first bar of the next, so the change is smoother.

## v2.60 (15 Oct 2026)
- **Changed:** the jungle music's quiet-beat section now follows the drums in the example track more closely. It plays quick triplets, "duh da (gap) duh da (gap)", at the music's normal tempo. It swells in at the start and fades away at the end.

## v2.59 (15 Oct 2026)
- **Changed:** the jungle music's quiet-beat section is now just the far-off drums: a steady, slightly quicker low-high "duh da duh da" beat, with the odd bird call.

## v2.58 (15 Oct 2026)
- **Added:** jungle music for the Jungle Temple pitch. It has the same seven sections as the usual match music (calm, quiet beat, main groove, breakdown, stab hook, half-time drive and chorus), and it follows the match's mood in the same way, from about 78 to 98 bpm.
  - **Instruments:** tribal drums that sound far away across the jungle (no deep boom, lots of echo), a shaker, a log-drum riff, a low drone, short brassy horn stabs and a pan-flute tune.
  - **Calm sections:** birds and buzzing insects.
  - Every other pitch keeps the usual music.
- **Found:** the usual match music has only ever played its drums. A missing piece of code silently stopped its bass, pads, arpeggios, chorus tune and stabs. The jungle music has the fix. The usual music still plays just its drums, as before, until we decide whether to switch the rest on.

## v2.57 (14 Oct 2026)
- **Added:** team calls. Picking a team to play can now play a short sound of its own. The Ogres are the first: choosing them (or a saved Ogre team) in the match picker or the two-device lobby plays "Ogres, my lord!". If you flick through the list, only the latest call plays. More teams can get their own calls later.

## v2.56 (14 Oct 2026)
- **Added:** in the block and blitz clash animation (the picture above the block dice), whoever has the ball is shown holding it at their front hand. It moves, leans and falls with them. If the carrier is knocked down, or a push with Strip Ball knocks it out of their hands, the ball pops loose at the moment of impact and bounces away past them.

## v2.55 (14 Oct 2026)
- **Fixed:** in a Throw Team-mate replay, a thrown player who crash-lands on someone, bounces off and lands on someone else (and so on) now shows every crash. Each player landed on goes down and bleeds if they were hurt, and the thrown player tumbles on from one to the next before falling. The camera follows them. Before, only the first player landed on was shown. If a bounce sends them into the crowd, the replay now shows the crashes first and then "INTO THE CROWD!". Before, it showed them flying straight into the crowd.

## v2.54 (14 Oct 2026)
- **Added:** blood in Throw Team-mate replays. When a thrown player crash-lands on someone and hurts them, or is hurt themselves (a failed landing or a crash), a burst of chunky pixel blood sprays out with a wet squelch. The drops fly up and splat on the ground. A worse injury means a bigger burst. A Knocked Out or Casualty result then gets its own word: "KNOCKED OUT!" or "CASUALTY!", in gold or red depending on whose player it was.

## v2.53 (14 Oct 2026)
- **Fixed:** a replay could get stuck panning over empty pitch, with no players or ball, and never finish. This happened in any match where the computer's turns had been sped up (4×), even when the replay was of your own throw. It could also happen on the second device in a two-device match. Replays now always run in real time.

## v2.52 (14 Oct 2026)
- **Added:** replays. Once all the dice for a pass, Throw Team-mate or bomb are done, a close-up replay plays from low down behind the thrower. The camera follows the ball (or the thrown player, or the bomb) past the other players, in the style of an old 16-bit console.
  - **Passes:** catches, drops, interception attempts, inaccurate passes, passes into the crowd and fumbles.
  - **Throw Team-mate:** the thrown player somersaults through the air and lands on their feet, crash-lands, lands on someone or goes into the crowd.
  - **Bombs:** interceptions and catches (with the throw on), and a pixel-art explosion that knocks down whoever was hit.
  - **The moment itself:** a successful catch, interception or landing gets a brief slow-down, a flash and a golden glow.
  - **The words** ("CAUGHT!", "INTERCEPTED!", "BOOM!") pop up like the skill pops: gold and white when it's good for your team, red when it's bad, and fiery for a bomb. In a two-device match each device colours them for its own team.
  - **Settings → Replays** turns them on or off. They're skipped with Quick animations and in computer-v-computer matches. Tap a replay to skip it.

## v2.51 (14 Oct 2026)
- **Fixed:** the panels at the bottom of the screen (such as the team re-roll question) no longer slip off the bottom on a phone when the browser's address bar is showing. Pop-ups now fit the part of the screen you can actually see, and a tall panel scrolls instead.
- **Changed:** questions during a match, such as Taunt, now use the smaller panel at the bottom of the screen (like the Dodge roll) instead of covering the pitch. For Taunt, the camera also brings the player into view. Questions before and after the match still appear in the middle.
- **Added:** while a block is being decided, a faint dashed circle (with an arrow) shows where each pushed player is going, since they stay in their old square until the block plays out.

## v2.50 (14 Oct 2026)
- **Changed:** a block now plays out on the pitch in one go, once every choice has been made. While the push square, Stand Firm, Taunt and following up are being chosen, the players stay where they were. Then the attacker lunges in and the defender rocks back, everyone pushed (and the attacker, if they follow up) slides to their new square, and anyone knocked down topples over once they've arrived. Before, the lunge came first, then pauses while things were chosen, then players moved one at a time.

## v2.49 (14 Oct 2026)
- **Changed:** players now topple over when they're knocked down or fall, turning onto their side over about a quarter of a second instead of snapping flat. Standing back up turns them upright the same way. With Animations set to Quick, they still change straight away.

## v2.48 (14 Oct 2026)
- **Added:** blocks and blitzes now play out on the pitch too, instead of the players just appearing in their new squares.
  - **The clash:** once the block dice are decided, the attacker lunges into the defender and the defender rocks back.
  - **The push:** a pushed player slides to the square chosen for them (a knocked-down player slides, then lies there).
  - **The follow-up:** an attacker who follows up slides into the empty square, including a Frenzy, Ball & Chain or Taunt follow-up.
  - **Turning it off:** with Animations set to Quick in Settings, the players move straight away as before.

## v2.47 (14 Oct 2026)
- **Fixed:** the version number no longer sits on top of the buttons in Settings or on the exhibition team screen. It now shows only on the title screen and the main menu.

## v2.46 (14 Oct 2026)
- **Added:** against the computer, the faint pulsing waiting banner now shows too: **Computer's turn** during its turn and set-up, and **Computer is choosing…** when it has a choice to make during yours (such as picking the block dice). It doesn't show when the computer plays both teams, or when two people share one device.
- **Changed:** the waiting banner (in two-device matches too) is hidden while a big announcement such as "ORCS SETUP" is on screen, which already says whose turn it is.

## v2.45 (14 Oct 2026)
- **Added:** in a shared league, the commissioner can settle a match a player hasn't played. Each unplayed match in the current round that involves another player's team has a **Resolve…** button on the commissioner's device. ([#18](https://github.com/sirspoon/BludBowl/issues/18))
  - **Against a computer team:** after a warning, **Sim it now** quick-sims the match, with the computer coaching the player's team. The sim's SPP, injuries and winnings go on both teams.
  - **Between two players:** the commissioner decides who is holding it up. Either **Sim it**, or one side forfeits: "Bob didn't play: Cara Dwarfs win" records a 2–0 win (3 points) for the other team, with no SPP, injuries or winnings for either.
  - **The player's money is safe:** in a commissioner's sim, the computer doesn't spend a player's treasury on inducements.
  - **Shown in the results:** results show "quick sim by the commissioner" or "forfeit: Bob Orcs didn't play", and they sync to everyone like any other result. If the match had in fact been played and just hadn't synced yet, the result that was played first counts.

## v2.44 (14 Oct 2026)
- **Added:** shared leagues for any number of players, each on their own device. ([#18](https://github.com/sirspoon/BludBowl/issues/18))
  - **Creating one:** when creating a league, choose **Players: Several players, each on their own device** and how many places to leave for other players. You become the commissioner.
  - **Joining:** the league starts in a setup stage. Tap **Invite players** for a room code. Each player goes to **Two Devices → Join** on their own device, types the code and picks one of their saved teams to bring. When everyone is in, the commissioner taps **Start the season**; any places left go to computer teams.
  - **Everyone keeps a copy:** results, teams and the table sync whenever two players connect, either with **Connect to sync** on the league screen or during any Two Devices match. Changes made while connected (a result, a team saved after its post-match) reach the other device straight away.
  - **Who plays what:** each player plays their own team's matches. Against a computer team they play on their own device. Against another player they tap **Play (two devices)** and the other player joins; only the coach of that team can join. Each player fills in their own team's post-match report on their own device. Only the commissioner runs computer-v-computer games and moves the league on, once every result is in. Each player re-drafts their own team in the off-season.
  - **Showing who's who:** the league shows each team's coach by name, and a Players card lists everyone and their teams. Other players' teams are kept on your device as copies for the league, but don't appear in your own team lists.

## v2.43 (14 Oct 2026)
- **Added:** league teams can be coached by the **Other player**, as well as by You or the Computer (set it when creating the league, or on the league's Teams tab). The other player's team is always coached on their device, whether it plays at home or away. A fixture between your team and theirs, or between their team and a computer team, offers **Play on two devices →** on the pre-match screen. For a computer opponent, the host's device runs the computer side. **Play on this device** still plays the match on one device. ([#18](https://github.com/sirspoon/BludBowl/issues/18))
- **Added:** in a two-device league match, the other player fills in their own team's post-match report (MVP, SPP, advancements) on their own device, with a copy of the team sent from the host's device. When they finish, the updated team goes back and is saved in the league. The host's report waits for it, with a **Do it on this device instead** button in case the other player has dropped out or would rather not.
- **Added:** in a two-device league match, the other player's device has a **📋 League** button (in the lobby and in the top bar) showing the league table, this round's matches and all the fixtures, as they stand on the host's device.

## v2.42 (14 Oct 2026)
- **Added:** career teams in two-device matches. When you pick one of your saved teams in the Two Devices lobby, tick **Record this match in my team's career** to keep its SPP, injuries and winnings. Each player decides for their own team, and each team is recorded on its own device. After the final whistle, each device fills in its own team's post-match report (MVP, SPP, advancements, winnings, Expensive Mistakes) and saves it to the team there. Expensive Mistakes left over from the guest team's last match are settled when the match starts, and shown in the log. ([#18](https://github.com/sirspoon/BludBowl/issues/18))
- **Added:** league fixtures on two devices. On a league's pre-match screen, **Play on two devices** opens a room. The other player joins with the code and coaches the away team, and the host coaches the home team. The league's inducements are chosen on the pre-match screen as before. The league, both teams and both post-match reports stay on the host's device, as in a normal league match. This needs both teams to be coached by people in the league, not the computer.
- **Changed:** in a two-device match, only the host can open the match summary from the final whistle.

## v2.41 (14 Oct 2026)
- **Added:** a name for two-device matches. Type it in **Your name** at the top of the Two Devices screen; it's remembered on that device. The other player sees it in the lobby ("Connected to Sam", "Sam's team: Orcs"), in the connection chip ("⇄ vs Sam"), and in the waiting banner ("Sam's turn", "Sam is choosing…"). ([#18](https://github.com/sirspoon/BludBowl/issues/18))
- **Added:** chat in two-device matches. Double-tap (or double-click) the match log, type a message and press Enter or Send. It appears in both players' logs with the sender's name, in a different colour for each player, with a sound for the one receiving it.

## v2.40 (14 Oct 2026)
- **Added:** reconnecting in two-device matches. ([#18](https://github.com/sirspoon/BludBowl/issues/18))
  - **The guest's connection drops** (bad signal, or the phone's screen went off): the guest's device shows "Reconnecting…" and keeps trying by itself. When it gets back, it picks up the match exactly where the host is, including any question waiting for that player. The host can keep playing its own turn meanwhile.
  - **The guest's page is closed or reloaded:** open **Two Devices** again and tap **Rejoin match** with its code.
  - **The host's page is closed or reloaded:** a two-device match is now saved on the host's device at each quiet moment (in its own slot, so any saved one-device match is left alone). Open **Two Devices** and tap **Resume hosted match**. The same room code opens again, and the guest's device, which waits with "Reconnecting…", joins back by itself.
  - Only the same guest device can rejoin a match in progress. The host's ⚠ Disconnected chip still offers to let the computer take over the other team instead.

## v2.39 (14 Oct 2026)
- **Changed:** in a two-device match, the starting-eleven screen is now separate on each device. Each player sees only their own team, ticks their own players, and taps **Ready**. The button shows whether the other player is ready, and both devices go on to the next screen once both players are. The same applies when picking players between drives. ([#18](https://github.com/sirspoon/BludBowl/issues/18))

## v2.38 (14 Oct 2026)
- **Added:** saved formations. While you set up for a kick-off, a **Formations** column on the left has five slots. Tap **Save** then a slot to keep your current set-up there. Tap a filled slot to set your team up that way: players go back to their own squares by name and position, or to the same position if someone is missing. Each team has its own five slots, separately for Blood Bowl and Sevens. A saved team keeps them with the rest of its details, including backups; a default team keeps them in this browser. In a two-device match, each player has their own slots on their own device. The column goes away once the set-up is confirmed.
- **Changed:** when the computer is the receiving team, it now reacts to how the kicking team has set up. It puts its three line players where they face the most of the kicking team's line (steering away from hard hitters). It leans its flankers and backfield towards the side the kicking team has left thinnest, and sends a flanker right out wide if a wide zone has been left empty. Its kicking set-up is unchanged.

## v2.37 (14 Oct 2026)
- **Changed:** while the kicking team sets up, the receiving team's players are hidden. They appear when the receiving team starts its own set-up, as in a real game, so the kicking team can't set up against a formation that isn't there yet. This applies to every match, including two-device matches. Set-ups during kick-off events (such as Solid Defence or Dwarven Wisdom) still show both teams.

## v2.36 (14 Oct 2026)
- **Added:** in a two-device match, each player now makes their own pre-match choices on their own device. ([#18](https://github.com/sirspoon/BludBowl/issues/18))
  - **Inducements:** when either team has gold to spend, both devices show the inducements screen, each opening on its own team. You can look at the other team's tab but only buy for your own. The host sets the gold option. When you're done, tap **Ready**; the match starts once both players are ready.
  - **Starting eleven:** each player ticks their own team's players, then taps **Confirm My Team**. The button shows whether the other player has confirmed, and the match carries on once both have. The same applies when picking players between drives.
  - **Inducement panels:** each team's inducement panel before kick-off (and any picks that come with it, such as You Dope!) is answered by that team's player.
- **Note:** the guest can already play with a team saved on their own device: pick it in the second drop-down in the Two Devices lobby.

## v2.35 (14 Oct 2026)
- **Added:** in a two-device match, a faint pulsing banner shows on your device whenever you're waiting for the other player. It says **Opponent's turn** during their turn, and **Opponent is choosing…** when they have a choice to make in your turn (such as picking the block dice). It sits just above the match log, or under the panel they're choosing on, and never blocks a tap. ([#18](https://github.com/sirspoon/BludBowl/issues/18))

## v2.34 (14 Oct 2026)
- **Changed:** in a two-device match, buttons that are the other player's to press are greyed out on your device: the action buttons and End Turn during their turn, the block dice when they're choosing, and their re-roll and question panels. ([#18](https://github.com/sirspoon/BludBowl/issues/18))
- **Fixed:** in a two-device match, the block dice panel is red ("DANGER!") only on the device whose player isn't choosing. The player who picks the die sees it in the normal colours. ([#18](https://github.com/sirspoon/BludBowl/issues/18))

## v2.33 (14 Oct 2026)
- **Added (early test):** **Two Devices** on the main menu lets you play a friend on another phone, tablet or computer, for exhibition matches. One player taps **Host a game** and gets a room code such as ORC-4821. The other taps Join and types it in. Each picks their own team (a default team or one of their saved teams), then the host taps **Start match**. The host plays the left-hand team, and the host's device runs the match and rolls all the dice. The other device shows the same pitch, panels, log and sounds, and its taps are sent to the host for its own team: moving, blocking, ending the turn, choosing block dice, re-rolls and other questions for that team. Neither player can answer the other's questions. A chip in the top bar shows the connection and its delay. If the other device drops out, the host can tap it to let the computer play their team. Two-device matches aren't saved, and no SPP or injuries are kept. Both devices need an internet connection to find each other. ([#18](https://github.com/sirspoon/BludBowl/issues/18))

## v2.32 (14 Oct 2026)
- **Added:** a new **High Elven** pitch. It has lush, neatly striped emerald grass, white-and-gold lines and an elven circle inlaid at the centre. Choose it in Settings or before a match; with Pitch set to Home Team, High Elves now play at home on it. Its block clash backdrop is an elven stadium: tiers of white marble with arches and a crowd, slender white towers with pointed roofs and pennants (a great tower over the halfway line), and snowy peaks and waterfalls beyond. This replaces the elven valley from v2.31, so grass pitches show the normal stadium again.

## v2.31 (14 Oct 2026)
- **Added:** when High Elves are the home team on a grass pitch, the block clash backdrop becomes an elven valley: a soft golden sky, snowy mountains, waterfalls down the cliffs, slender white towers with pointed roofs and an arched bridge, mist and pale trees. Other home teams keep the stadium.

## v2.30 (14 Oct 2026)
- **Changed:** the Jungle Temple's block clash backdrop is now properly jungly: misty green air, two layers of trees with tall palms, the temple overgrown with vines, hanging vines with leaves and big fern leaves curling in from the sides.

## v2.29 (14 Oct 2026)
- **Changed:** the grass pitches' sky in the block clash animation is now a daytime blue, with a grey grandstand, a colourful crowd and the floodlights switched off.

## v2.28 (14 Oct 2026)
- **Changed:** in the block clash animation, the grass pitches (Grass and Muddy Grass) now have an evening-blue sky, with the grandstand in a matching blue-grey.

## v2.27 (14 Oct 2026)
- **Changed:** the pitch under the players in the block clash animation is now laid flat in perspective, so it looks like ground stretching away behind them rather than a flat picture. ([#9](https://github.com/sirspoon/BludBowl/issues/9))

## v2.26 (14 Oct 2026)
- **Changed:** the block clash animation now matches the pitch being played on. The players stand on a strip of the actual pitch (grass, muddy grass, flagstones, temple stones or graveyard grass), the sky takes the pitch's colours, and the scenery behind them fits: a grandstand of fans under floodlights for grass pitches, a castle wall for Mossy Flagstones, a stepped temple with vines for the Jungle Temple, and tombstones, crosses, a bare tree and the moon for the Graveyard. ([#9](https://github.com/sirspoon/BludBowl/issues/9))

## v2.25 (14 Oct 2026)
- **Changed:** the match log starts shorter (about a fifth of the screen on a phone held upright, a third on a wider screen). Drag the grip on its top edge up to make it taller or down to make it shorter. The size you choose is remembered (separately for upright and sideways), and double-tapping the grip puts it back to the default. ([#4](https://github.com/sirspoon/BludBowl/issues/4))

## v2.24 (14 Oct 2026)
- **Fixed:** with **Speed up** on, the computer's blocks (the dice panel, the clash animation and the computer picking its die) now run at the faster speed too. They were dropping back to normal speed because the game treated every dice panel as a question for you, even when the computer was the one choosing. The same applied to the computer's own re-roll and choice panels. Panels that really are for you still slow down.

## v2.23 (14 Oct 2026)
- **Fixed:** the pitch could go completely black at the start of your turn after a sped-up computer turn. A camera glide (the one that brings a player into view for a roll) mixed up the game's clock with real time, and once a turn had been sped up it threw the camera millions of pixels off the pitch.
- **Changed:** **Speed up** now stays on for the computer's later turns too, until you tap it off. Your own turns, and anything you're asked to answer, still run at normal speed. Each new match starts with it off.

## v2.22 (14 Oct 2026)
- **Added:** when you play against the computer, a **▶▶ Speed up** button appears next to End Turn during the computer's turn. Tap it to run that turn at 4× speed (tap again to go back to normal). It switches itself off as soon as your turn comes round, and drops back to normal speed whenever you have something to answer during the computer's turn (such as choosing block dice or a re-roll), then carries on fast. ([#1](https://github.com/sirspoon/BludBowl/issues/1))

## v2.21 (14 Oct 2026)
- **Changed:** Zap! now only lets you pick (and highlights) opposition players.

## v2.20 (14 Oct 2026)
- **Changed:** the Sports-Wizard's spells are now aimed on the pitch instead of from a list. Choose Zap! or Fireball, then tap a player or square: the choices glow (the best bets brighter), a banner shows what would happen (the Fireball's blast area and who's in it, or the chance to Zap! a player) and you tap Confirm or tap it again. Cancel goes back. Fireball can now target any square and Zap! any player, as the rules allow. ([#5](https://github.com/sirspoon/BludBowl/issues/5))
- **Changed:** Star Player abilities that pick a player (such as Black Ink, Vicious Vines and Baleful Hex) work the same way: tap the highlighted player on the pitch.

## v2.19 (14 Oct 2026)
- **Changed:** the top bar is tidier on narrow screens. The weather symbol now sits in the score row next to the half, and the smaller status chips (inducements, bribes, the kick-off message) have their own centred row under the buttons instead of being squeezed beside them. That row only appears when one of them is showing.

## v2.18 (14 Oct 2026)
- **Fixed:** after reading an inducement's description, the panel's OK button now works on the first tap. Before, the first tap only closed the description and taps straight after were ignored.

## v2.17 (14 Oct 2026)
- **Changed:** before kick-off, each team's inducements now get their own panel, one team at a time, and stay up until you press **OK**. Any choices that team has to make (such as picking a player for You Dope! or a skill for Intensive Training) come straight after its own panel, before the other team's.
- **Added:** tap any inducement on the panel to see what it does, including each Prayer to Nuffle, Desperate Measure and Star Player's special rule. The wording follows the 2025 rules.

## v2.16 (14 Oct 2026)
- **Changed:** the weather in the top bar now shows just its symbol, so it no longer gets cut off on narrow screens. Tap it to see the weather's name and what it does.

## v2.15 (14 Oct 2026)
- **Changed:** the camera now follows the action when it's off screen: the ball in the air (so a kick-off is followed to where it lands, as are passes and bounces), a player setting off on a move, both players in a block, and the ball at the start of each turn. It only moves when something is actually out of view, never zooms in, and leaves the camera alone for a few seconds after you've dragged or zoomed it yourself. ([#24](https://github.com/sirspoon/BludBowl/issues/24))

## v2.14 (14 Oct 2026)
- **Changed:** a Journeyman you hire after a match (and a player Raised from the dead who joins) now gets a proper random name for their race instead of keeping "Journeyman 1". A name you've already changed is kept. ([#10](https://github.com/sirspoon/BludBowl/issues/10))

## v2.13 (14 Oct 2026)
- **Changed:** after rolling the D8 for a Characteristic Improvement, you can take a Primary or Secondary skill instead of the rolled characteristic. The SPP for the characteristic is still spent.
- **Changed:** a player with enough SPP for a Characteristic Improvement must now take an advancement before the post-game can be finished, as the rules require. Their row says "must advance".
- **Changed:** in a team that has played, you can no longer release a player if it would leave fewer than 11 players able to play the next game.

## v2.12 (14 Oct 2026)
- **Changed:** after a league or career match, Expensive Mistakes is no longer rolled as soon as you finish. The post-game screen now lets you spend your treasury first (Open Team Builder), then roll for Expensive Mistakes on what's left. If you leave without rolling, it's rolled before that team's next match. The computer team spends and rolls on its own as before. ([#27](https://github.com/sirspoon/BludBowl/issues/27))

## v2.11 (14 Oct 2026)
- **Fixed:** skill descriptions are now found even when a skill was saved with different capitals, spacing or punctuation (for example by an older version of the game), so learned skills such as Sure Feet show their description.
- **Changed:** tapping a skill that has no description now says so, showing the exact skill name, instead of doing nothing.

## v2.10 (14 Oct 2026)
- **Fixed:** tapping the Sure Feet skill tag now shows its description. It was the only skill missing one.

## v2.09 (14 Oct 2026)
- **Changed:** the "Roll Required" and "Roll Failed" (team re-roll) panels, and the team re-roll question for skill rolls, are now a smaller panel at the bottom of the screen that no longer darkens or blurs the pitch. If the player making the roll would be hidden behind the panel or near the edge of the screen, the camera glides them into the middle of the pitch above it. ([#3](https://github.com/sirspoon/BludBowl/issues/3))

## v2.08 (14 Oct 2026)
- **Added:** a failed Foul Appearance, Projectile Vomit, Breathe Fire, Hypnotic Gaze or Chomp (Monstrous Mouth) roll now offers a team re-roll too. If a re-rolled Foul Appearance passes, the block or special action carries on. ([#29](https://github.com/sirspoon/BludBowl/issues/29))

## v2.07 (14 Oct 2026)
- **Added:** ▲ and ▼ buttons on each player in the Team Builder roster to move them up or down, and a **Positionals first** button that puts the most expensive positions at the top and Linemen at the bottom. ([#2](https://github.com/sirspoon/BludBowl/issues/2))
- **Added:** a failed Dauntless, Bone Head, Really Stupid, Animal Savagery, Unchannelled Fury, Bloodlust or Take Root roll now offers a team re-roll if you have one left. ([#29](https://github.com/sirspoon/BludBowl/issues/29))
- **Changed:** you can now use more than one team re-roll in a turn, as long as each one is on a different roll (the 2025 rules). The computer still uses at most one a turn. ([#20](https://github.com/sirspoon/BludBowl/issues/20))

## v2.06 (14 Oct 2026)
- **Added:** each weather now shows on the pitch. Blizzard has snow drifts and falling snow, Pouring Rain has wet grass, puddles and rain, Very Sunny has brighter grass and moving beams of light, Sweltering Heat has an orange glow and a heat shimmer, and Perfect Conditions has the odd cloud shadow. When the weather changes mid-match, the new weather blends in. ([#23](https://github.com/sirspoon/BludBowl/issues/23))
- **Added:** a Weather effects option in Settings (Full, Light or Off). The moving effects fade back while you're choosing a move or a target.

## v2.05 (14 Oct 2026)
- **Changed:** Glart's Frenzied Rush, Roxanna's Slashing Nails and the Desperate Measure for a second foul are now only used up once the player commits (takes a step or picks a target). Cancelling before then keeps them for later.
- **Fixed:** cancelling a second foul no longer frees up a foul that had already been used that turn.

## v2.04 (14 Oct 2026)
- **Changed:** rolls like Bone Head, Really Stupid, Animal Savagery, Unchannelled Fury, Bloodlust and Take Root now happen when the player first does something (takes a step or picks a target), not as soon as you choose the action. Until then, Cancel undoes a mis-click with nothing rolled. Once the roll is made, the result stands for the rest of the turn, even if you cancel. ([#6](https://github.com/sirspoon/BludBowl/issues/6))
- **Fixed:** cancelling a Punt now lets the team punt again that turn.

## v2.03 (14 Oct 2026)
- **Fixed:** the Cancel button now shows for Block and Chomp actions, so you can back out and pick a different action before any dice are rolled. Cancel isn't offered after a Jump Up into a block, because the player has already stood up for free. ([#6](https://github.com/sirspoon/BludBowl/issues/6))

## v2.02 (14 Oct 2026)
- **Added:** click the version number on the title screen to see this list of changes. The number is now highlighted so it's clear you can click it.

## v2.01 (14 Oct 2026)
- **Fixed:** scoring a touchdown when both teams have used all their turns no longer starts a new drive. The game goes straight to half time or full time. ([#28](https://github.com/sirspoon/BludBowl/issues/28))
- **Fixed:** the MVP roll now needs six nominees, or everyone who played if fewer than six did. Any missing nominees are filled in at random when the roll happens automatically. ([#8](https://github.com/sirspoon/BludBowl/issues/8))
- **Added:** the version number on the title screen.

## v2.00 (12 Oct 2026)
- Starting point for version numbering.
