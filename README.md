# Cellar of Ruin

A dungeon battle that plays itself. Four heroes fight their way down an endless cellar, floor by floor, while you watch.

- **Brandt, Battlemage**: sword combos, whirlwind, and CATACLYSM, a leaping slam that splits the floor.
- **Ignis, Pyromancer**: fireballs, flame nova, and METEOR STORM.
- **Voltaire, Stormcaller**: chain lightning, ball lightning, and THUNDERSTORM.
- **Mossa, Earthshaper**: stone spikes, heals, revives, and EARTHQUAKE.

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
