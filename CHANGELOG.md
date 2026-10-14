# Changelog

Every change to BludBowl, newest first. The version number is shown in the bottom-right corner of the title screen.

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
