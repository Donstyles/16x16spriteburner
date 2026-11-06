# Ashen Mandate

A first-person party dungeon crawler in the spirit of **Might and Magic VI** and **Dark Souls**, built entirely from 16x16 pixel art and playable in a phone browser or installed to the Home Screen.

- **Might and Magic VI**: free first-person movement, a party of four with portraits along the bottom, real-time combat where every companion attacks when ready, per-character abilities, a minimap, lore tablets, and a Keeper who sells wares.
- **Dark Souls**: bonfires (rest, level up, travel), souls as the only currency, dropped on death and recoverable at your bloodstain, stamina for attacks and dodges, bosses behind white fog gates, shortcuts opened from the far side, estus flasks, embers, keys and a long interconnected descent.

Five zones: The Undercroft, Mossgrave Catacombs, The Frozen Reliquary, The Molten Gallery and The Cosmic Sanctum, plus the Chapel of the Hollow Crown and the Sunken Cistern. Five bosses, 36 enemy types, and a hollow king at the end of it all.

## Play

Open `index.html` from any static host (GitHub Pages works: Settings → Pages → deploy from this branch, root). Everything is plain HTML, CSS and JavaScript with no build dependencies at runtime.

`dist/index.html` is a single self-contained file with every asset inlined, for hosts that can only serve one file.

### iPhone (iPhone 14 Pro Max and others)

1. Open the game's URL in Safari.
2. Tap Share → **Add to Home Screen**.
3. Launch it from the Home Screen and turn the phone sideways. It runs full screen with the Dynamic Island area kept clear.

### Android

1. Open the URL in Chrome.
2. Tap the menu → **Install app** (or **Add to Home screen**).
3. Launch from the Home Screen; it opens full screen and locks to landscape.

The service worker caches everything, so it keeps working offline after the first load. Progress is saved in the browser at every bonfire.

## Controls

**Touch**: left half of the screen is a virtual stick (press anywhere and drag). Drag on the right half to look. ATTACK, DODGE and FLASK buttons on the right. Tap a portrait to use that companion's ability. Tap the prompt in the centre (or tap the right half without dragging) to interact.

**Keyboard and mouse**: click the view to capture the mouse. WASD to move, mouse to look, SPACE to attack, SHIFT to dodge, F for the flask, E to interact, 1–4 for abilities, ESC for the menu.

## The party

| Companion | Class | Attack | Ability |
|---|---|---|---|
| Roderick | Knight | sword, close range, may block hits | **Bulwark**: the party takes 70% less damage for 4s |
| Sable | Archer | bow, long range | **Volley**: five arrows in quick succession |
| Mira | Cleric | mace, close range | **Heal**: mend every living companion |
| Vesper | Sorcerer | arcane spark, long range | **Fire Bolt**: a bursting bolt of flame |

Companions who fall stay down until you rest at a bonfire. If all four fall, you die, lose your souls where you stood, and wake at the last bonfire with the enemies restored.

## Project layout

- `src/` – game modules, concatenated in order by `tools/build.js` into `game.js`
- `assets/` – the packed tileset and creature sheet (`tools/pack_assets.py` builds them from the original asset packs)
- `icons/`, `manifest.webmanifest`, `sw.js` – installable web app files
- `tools/` – build script, asset packer, world sanity check, Playwright screenshot and soak tests

```
node tools/build.js          # rebuild game.js, index.html and dist/index.html
node tools/check_world.js    # verify every room, chest and boss is reachable
```

## Credits

Dungeon tileset: *Huge 16x16 Dungeon Tileset* by RunninBlood. Creature sprites: the Basic, Premium and Supporter magical/humanoid asset packs supplied with the project. Everything else (engine, fire, glows, audio, writing) was made for this game.
