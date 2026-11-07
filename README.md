# Harrowmere

A top-down party role-playing game in the spirit of **Might and Magic VI**, built from 16x16 pixel art and playable in a phone browser or installed to the Home Screen.

- A party of four from six classes (Knight, Paladin, Archer, Cleric, Sorcerer, Druid) with the seven classic stats, hit and spell points, skills with Novice, Expert and Master ranks, equipment in seven slots and enchanted loot.
- Real-time combat with a turn-based toggle, recovery times, to-hit versus armor class, monster resistances, ranged attackers, casters, bosses.
- 28 spells across seven schools (Fire, Air, Water, Earth, Spirit, Mind, Body) sold by two guilds in the town square, including Town Portal.
- The town of Harrowmere: weapon and armor shops, an alchemist, a temple, an inn, a training hall where levels are bought with experience and gold, Lord Harrow's hall and townsfolk with quests.
- An overworld with roads, lakes, forests, marsh and monster camps, and five themed dungeons (Goblin Warrens, Mossgrave Barrow, Frozen Reliquary, Molten Gallery, the Sanctum) generated from seeds with boss chambers and quest relics.
- A day and night clock, resting with rations, fog of war in dungeons, a world map, a quest log, autosave.

## Play

Serve the repository root from any static host and open `index.html`. `dist/index.html` is a single self-contained file.

**iPhone**: open the URL in Safari, Share, Add to Home Screen, then launch from the Home Screen in landscape. **Android**: Chrome, menu, Install app.

**Touch**: press and drag on the left half to move; ATTACK, CAST, PARTY and REST buttons on the right; tap a monster to attack it; tap the prompt to interact; tap a portrait to select a companion, twice to open their sheet.

**Keyboard**: WASD to move, SPACE to attack, F to cast, E to interact, C for the party sheet, I for the pack, M map, Q quests, R rest, ENTER toggles turn-based mode, 1 to 4 select a companion, ESC for the menu. Click a monster to attack it.

## Project layout

- `src/` – modules concatenated in order by `tools/build.js` into `game.js`
- `assets/` – packed tileset and creature sheet (`tools/pack.py` builds them from the asset packs)
- `tools/` – build, asset packer, map sanity check (`node tools/mapcheck.js`), Playwright tests

## Credits

Dungeon tileset: *Huge 16x16 Dungeon Tileset* by RunninBlood. Creature sprites: the Basic, Premium and Supporter asset packs supplied with the project.
