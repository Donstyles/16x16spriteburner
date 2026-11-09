# Cellar of Ruin

A dungeon battle that plays itself. Four heroes fight their way down an endless cellar, floor by floor, while you watch.

The party starts at level 1 and earns its spellbook: low spells first, then medium, then the high spells and ultimates. Spells take turns, each with a wind-up and its name over the caster.

| Hero | Low (levels 1-4) | Medium (5-9) | High (10-15) |
|---|---|---|---|
| Brandt, melee | Slash, Shield Bash, Lunge, Rising Slash | Blade Flurry, Sword Wave, Ground Pound, Charge | Crushing Blow, Whirlwind, Shockwave Blows, Thousand Cuts, CATACLYSM |
| Ignis, fire | Ember Bolt, Cinder Spray, Immolate, Blazing Darts | Flame Wall, Heat Ray (laser), Fire Serpents, Magma Pools | Fireball, Flame Nova, METEOR STORM |
| Voltaire, storm | Spark, Static Charge, Shock Orb, Gust | Lightning Lance, Tesla Coil, Arc Field | Chain Lightning, Ball Lightning, Arc Cannon (laser), THUNDERSTORM |
| Mossa, earth | Pebble, Mend, Thorn Lash, Rejuvenate, Entangle | Stone Fist, Insect Swarm, Boulder Roll | Stone Spikes, Mass Heal, Resurrection, EARTHQUAKE |

Every fourth floor a boss rises. When a floor is cleared it collapses and the party drops to the next one. If the party falls, a new run starts.

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
