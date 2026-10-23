# Changelog

Every change to BludBowl, newest first. The version number is shown at the bottom of the title screen.

## v3.19 (23 Oct 2026)
- **Added:** voice chat in two-device play ([#18](https://github.com/sirspoon/BludBowl/issues/18)). Tap **🎤 Mic** next to the connection chip at the top. The browser asks for the microphone the first time, and then it's an open mic: tap again to mute (🔇) or unmute (🎙️).
  - A 🔊 on the button shows when the other player's microphone is on, and the match log says when they switch it on or off.
  - The sound goes straight between the two devices, with the browser's echo cancellation and noise suppression.
  - After a dropped connection the voice link comes back by itself.

## v3.18 (23 Oct 2026)
- **Fixed:** dragging the pitch with the mouse to look around also counted as a click where you let go, so it could move a player. A press that moves more than a few pixels now just moves the view. The same goes for dragging or pinching on a touch screen, and for the joining player in two-device play.
- **Added:** W A S D or the arrow keys move the view around the pitch while held. They do nothing while you're typing in a box, such as the chat.

## v3.17 (21 Oct 2026)
- **Changed:** on a phone held upright, the main action buttons are two to a row, as in landscape, instead of one per row, so the bigger buttons take up about half the space.

## v3.16 (21 Oct 2026)
- **Changed:** the action buttons (Move, Block, Blitz, Pass and the rest) are bigger and further apart, so they're harder to mis-tap: about half as tall again, with larger text.

## v3.15 (21 Oct 2026)
- **Fixed:** league and tournament matches followed the Pitch setting from Exhibition and Settings, so once it had been set to a particular pitch (the Jungle Temple, say), every league match was played there. They're now always at the home team's ground, whatever the setting. Exhibition matches still use the setting.

## v3.14 (17 Oct 2026)
- **Fixed:** before kick-off, the panel showing the computer's inducements couldn't be closed: its OK button counted as the computer's to press, and the computer never pressed it, so the match was stuck. You can now close it. In two-device play, each team's panel is closed by the other player, who's the one reading it.

## v3.13 (16 Oct 2026)
- **Improved:** dropped connections in two-device play ([#18](https://github.com/sirspoon/BludBowl/issues/18)).
  - **Host:** when the other player drops, the banner says the game is waiting for them to reconnect. If it's been their move for 20 seconds, a panel gives the code to rejoin with and offers Keep waiting or Computer takes over. It asks again every couple of minutes, and goes away when they're back. It no longer uses the game's question panel, so a question the other player still has to answer isn't lost.
  - **Joining player:** after 10 minutes of trying to reach the host, the game stops and offers Try again or Leave the match, instead of trying forever.
  - **Host's page closed during the inducements:** Two Devices now offers to reopen the same room. The other player's device rejoins it, and both go back to the lobby to start again.

## v3.12 (16 Oct 2026)
- **Added:** the two-device lobby has the same match settings as an exhibition. The host picks the **game** (11 a side or Sevens), the **pitch** and the **inducements**, and the other player sees what's been chosen. For Sevens, both players pick from their saved Sevens teams (or a standard Sevens squad). ([#18](https://github.com/sirspoon/BludBowl/issues/18))

## v3.11 (16 Oct 2026)
- **Fixed:** in two-device play the ball could vanish after an interception or a pass. A thrown ball only landed when the screen was redrawn, which stops while the host's phone is asleep or switched to another app. Thrown balls and players now always land on time. ([#18](https://github.com/sirspoon/BludBowl/issues/18))
- **Changed:** the "Interception possible!" message now says which team chooses. Only the defending player's taps count, on either device.

## v3.1 (16 Oct 2026)
Everything since v3.00 (the updates numbered v3.01 to v3.38), rolled into one update.

**New pitches**
- **Brimstone** (Khorne and Chaos), **Woodland** (Wood Elves and Gnomes) and **Warped Flagstones** (Skaven, with a pulsing warpstone glow), each with its own scenery behind the block clashes.
- More teams get a home pitch that suits them. Any pitch can be picked from the Pitch menu.

**Music** ([#7](https://github.com/sirspoon/BludBowl/issues/7))
- **Every pitch has its own music:** organ in the Graveyard, echoing drums in the caves, the supporters' band on Muddy Grass, epic rock on Brimstone, a folk jig in the Woodland, and squealing rats on the Warped Flagstones.
- **Referee taunt:** a sending-off gets the terraces' two-note taunt, in each pitch's own style.
- **Fixes:** the music was too quiet at the start of a match, could fail to start on phones, and cut out on Brimstone.

**Fouls** ([#11](https://github.com/sirspoon/BludBowl/issues/11))
- **Sent off:** a big pixel-art referee jumps out as the whistle blows, red card held high. He's a halfling, goblin, dwarf, elf or troll, picked at random.

**The computer coach** ([#19](https://github.com/sirspoon/BludBowl/issues/19))
- **Plays much better:** smarter re-rolls, attacks and defence, use of its players' skills, and fewer careless moves. It also thinks about twice as fast.
- **Level-ups:** its league teams pick skills that suit each position.

**Fixes and smaller changes**
- **Block banner:** declaring a Block shows a banner, like Blitz and Pass do.
- **Freezes:** several ways a match could freeze are fixed, with a safety net for any others.
- **Move odds:** they count Diving Tackle and Sure Feet.
- **Version number:** it no longer covers the menu on phones.

## v3.00 (15 Oct 2026)
Everything since version numbering began (v2.00), rolled into one update.

**Teams and Star Players**
- **All 30 teams from the 2025 rules,** each with a default team, a Sevens squad, kits and sprites. Every team works in exhibitions, the Team Builder, leagues, two-device play and Sevens.
- **Star Players:** every 2025 Star Player is in ([#16](https://github.com/sirspoon/BludBowl/issues/16)).
- **Rules:** new skills and rules for the new teams, Chaos gods, Big Guy limits, and a new league, the Chaos Clash.
- **Team Builder:** players can be reordered ([#2](https://github.com/sirspoon/BludBowl/issues/2)) and team lists are alphabetical.

**Two-device play** ([#18](https://github.com/sirspoon/BludBowl/issues/18))
- **Play a friend** on another phone, tablet or computer with a room code, with chat and reconnecting.
- **Leagues:** career teams and shared leagues work across devices.

**On the pitch**
- **Blocks and replays:** blocks play out on the pitch, and passes, throws and bombs get slow-motion 16-bit replays.
- **Camera and weather:** the camera follows the action and the weather shows on the pitch.
- **High Elven pitch:** new.
- **Kick-offs:** you can save formations, and the computer's turns can be sped up.

**Rules and fixes**
- **Team re-rolls:** they work on more rolls ([#20](https://github.com/sirspoon/BludBowl/issues/20), [#29](https://github.com/sirspoon/BludBowl/issues/29)).
- **Activation rolls:** these, like Bone Head, wait until the player acts ([#6](https://github.com/sirspoon/BludBowl/issues/6)).
- **Post-game:** spending and advancements follow the rules, and Journeymen get names ([#10](https://github.com/sirspoon/BludBowl/issues/10)).
- **Fixes:** a last-turn touchdown no longer starts a new drive ([#28](https://github.com/sirspoon/BludBowl/issues/28)), and MVPs follow the rules ([#8](https://github.com/sirspoon/BludBowl/issues/8)).

**Look and sound**
- **Inducements:** each team's get their own panel.
- **Interface:** tidier panels, a tidier top bar and a resizable match log.
- **Music:** the Jungle Temple and High Elf pitches have their own.
- **Team calls:** picking a team can play its own call.
- **This list:** tap the version number to see it.
