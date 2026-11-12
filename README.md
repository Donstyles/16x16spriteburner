# Cellar of Ruin

One hero fights down an endless cellar, floor by floor. Steer it yourself, leave it on autopilot and watch, or bring up to three friends.

The main menu offers PLAY SOLO, WATCH (autopilot from the first wave), HOST CO-OP and JOIN CO-OP. Your first solo game starts with a short hands-on tutorial (move, automatic attacks, casting, dashing, growing stronger, auto modes); each step ends when you do it, SKIP ends it at any time, and HOW TO PLAY on the menu replays it. Enemies take it easy on you while the tutorial runs.

Before the first wave you pick a hero (Brandt the battlemage, Ignis the pyromancer, Voltaire the stormcaller or Mossa the druid), its basic attack and a first skill (or press AUTO-DRAFT). After that, every cleared floor (or slain boss) offers three cards: a new spell or an upgrade. Level-ups make the hero stronger and unlock the next tier of spells. Each spell has three upgrades. You hold four skills plus an ultimate; once all four buttons are full, a new spell replaces the weakest one (the card says which). Open the SPELLBOOK (button, the hero frame, or B) to see every skill and upgrade; the battle pauses while it is open.

The hero starts at level 1 and earns its spellbook: low spells first, then medium, then the high spells and the ultimate.

## Controls
The game is always landscape. On a phone held upright it is drawn sideways, so just turn the phone (this works with rotation lock on).

| | Touch | Keyboard | Gamepad |
|---|---|---|---|
| Move | touch anywhere and drag (the stick is invisible) | WASD / arrows | left stick |
| Dash (dodges damage) | » button | Space / Shift | A |
| Skills 1-4 | the four round buttons | 1-4 | X, Y, B, RB |
| Ultimate (when the ring is full) | big corner button | R or Q | RT / LB |
| Spellbook | SPELLBOOK or the hero frame | B | Start |
| Auto mode | MANUAL / AUTO-CAST / AUTOPILOT button | T | Select |

Basic attacks fire on their own at the nearest foe, and skills auto-aim. AUTO-CAST casts the skills for you while you steer; AUTOPILOT plays the whole game. If you don't touch anything for 10 seconds during a fight, autopilot takes over until you do.

| Hero | Low (levels 1-4) | Medium (5-9) | High (10-15) |
|---|---|---|---|
| Brandt, melee | Slash / Cleave / Quick Stab, Shield Bash, Lunge, Rising Slash | Blade Flurry, Sword Wave, Ground Pound, Charge | Crushing Blow, Whirlwind, Shockwave Blows, Thousand Cuts, CATACLYSM |
| Ignis, fire | Ember Bolt / Fire Orb / Flame Jet, Cinder Spray, Immolate, Blazing Darts | Flame Wall, Heat Ray (laser), Fire Serpents, Magma Pools | Fireball, Flame Nova, METEOR STORM |
| Voltaire, storm | Spark / Arc Whip / Storm Bolt, Static Charge, Shock Orb, Gust | Lightning Lance, Tesla Coil, Arc Field | Chain Lightning, Ball Lightning, Arc Cannon (laser), THUNDERSTORM |
| Mossa, earth | Pebble / Thorn Dart / Mud Ball, Mend, Thorn Lash, Rejuvenate, Entangle | Stone Fist, Insect Swarm, Boulder Roll | Stone Spikes, Mass Heal, Resurrection, EARTHQUAKE |

Every fourth floor a boss rises. When a floor is cleared it collapses and the hero drops to the next one. If the hero falls, the floor starts over.

Tap once for sound. On Android the game also goes fullscreen and big hits vibrate.

## Co-op (up to 4 heroes)
Choose **HOST CO-OP** on the menu to open **The Cellar Door**, the lobby: a 4-letter room code, **SEND INVITE LINK**, and four seats that fill as friends arrive, each showing the hero that player picked. Friends tap the invite link, or **JOIN CO-OP** and type the code on the letter pad. When everyone is ready the host taps **DESCEND**; each player then picks a basic attack and a first spell. Friends who arrive later drop straight into the fight. A room can also be opened mid-run from the **CO-OP** button.

- Levels are shared; each player gets their own three cards every level-up, floor and boss, and picking never pauses the fight.
- A fallen hero comes back after 9 seconds while anyone is still standing.
- If a guest's connection drops, their hero fights on by itself and they get it back when the page reconnects. The host's phone runs the game, so it must stay open in the foreground.
- Matchmaking uses the free public PeerJS server; phones then talk directly (or through PeerJS's public relay when a network blocks direct connections). Co-op runs on the GitHub Pages / Home Screen version, not inside claude.ai.

## Run it
Open `index.html` (it is self-contained), or add the GitHub Pages site to your Home Screen.

## Build
```
python3 -I tools/pack.py <extracted cellar tileset zip> <extracted creature packs> .
node tools/build.js
```
`src/*.js` is concatenated into `index.html` (Pages / Home Screen) and `dist/artifact.html`.
Checks: `node tools/shots.js`, `node tools/scenes.js`, `node tools/soak.js` against a local server on port 8787.

Art: Farm Game Dungeon Cellar tileset (rooms and props) and the earlier creature packs (heroes and monsters).
