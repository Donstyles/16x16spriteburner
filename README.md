# Cellar of Ruin

One hero fights down an endless cellar, floor by floor. Steer it yourself, or leave it on autopilot and watch.

Before the first wave you pick a hero (Brandt the battlemage, Ignis the pyromancer, Voltaire the stormcaller or Mossa the druid), its basic attack and a first skill (or press AUTO-DRAFT). Every level-up, cleared floor and boss then offers three cards: a new spell or an upgrade. Each spell has three upgrades. You hold four skills plus an ultimate; once all four buttons are full, a new spell replaces the weakest one (the card says which). Open the SPELLBOOK (button, the hero frame, or B) to see every skill and upgrade; the battle pauses while it is open.

The hero starts at level 1 and earns its spellbook: low spells first, then medium, then the high spells and the ultimate.

## Controls
The game is always landscape. On a phone held upright it is drawn sideways, so just turn the phone (this works with rotation lock on).

| | Touch | Keyboard | Gamepad |
|---|---|---|---|
| Move | thumb-stick anywhere on the left half | WASD / arrows | left stick |
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
