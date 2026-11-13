# Cellar of Ruin

One hero fights down an endless cellar, floor by floor. Steer it yourself, hand parts of the job to the hero, or bring up to three friends.

The main menu offers **PLAY SOLO**, **HOST CO-OP** and **JOIN CO-OP**, plus **HOW TO PLAY**. Your first solo game starts with a short hands-on tutorial (move, automatic attacks, casting, dodging, growing stronger); each step ends when you do it, SKIP ends it at any time, and HOW TO PLAY replays it. Enemies take it easy on you while the tutorial runs.

## Spells and progression
Every hero holds **one basic attack, one Low, one Medium and one High spell, and one Ultimate**. Each is chosen once, from every spell of that tier, and kept for the whole run; nothing is ever replaced.

- **Before the first wave** you pick a hero, its basic attack (it fires by itself at the nearest foe) and its Low spell (button 1).
- **Levels 5, 9 and 12** open the Medium, High and Ultimate tiers. When that floor is cleared, the cards show every spell of the new tier: Medium goes on button 2, High on button 3, the Ultimate on its own button.
- **Every other cleared floor** (on boss floors: after the boss) offers three upgrades for spells you hold, basic attack included. Each spell has three upgrades; damage, size and duration upgrades multiply, extra projectiles or targets add up. Unpicked cards pick themselves after 18 seconds.
- **Levels** heal 35% and raise health and damage. Ignis, Kazimir, Seraphine and Nerida take a new form at level 10, Voltaire at 12; Brandt and Mossa keep theirs.
- Once learned, the ultimate's ring fills as you fight, and a full ring casts it.
- The SPELLBOOK (button, the hero frame, or B) shows all five tiers with every spell of the hero: yours lit with its upgrades, the rest dimmed, locked tiers with the level they open at. Tap a spell for details. The battle pauses while it is open.

| Hero | Basic attack (pick one) | Low (pick one at the start) | Medium (level 5) | High (level 9) | Ultimate (level 12) |
|---|---|---|---|---|---|
| Brandt, steel, melee | Slash, Cleave, Quick Stab | Shield Bash, Lunge, Rising Slash | Blade Flurry, Sword Wave, Ground Pound, Charge | Whirlwind, Thousand Cuts | CATACLYSM |
| Ignis, fire, ranged | Ember Bolt, Fire Orb, Flame Jet | Cinder Spray, Immolate, Blazing Darts | Flame Wall, Heat Ray, Fire Serpents, Magma Pools | Fireball, Flame Nova | METEOR STORM |
| Voltaire, lightning, ranged | Spark, Arc Whip, Storm Bolt | Static Charge, Shock Orb, Gust | Lightning Lance, Tesla Coil, Arc Field | Chain Lightning, Ball Lightning, Arc Cannon | THUNDERSTORM |
| Mossa, earth, support | Pebble, Thorn Dart, Mud Ball | Mend, Thorn Lash, Rejuvenate, Entangle | Stone Fist, Insect Swarm, Boulder Roll | Stone Spikes, Mass Heal, Resurrection | EARTHQUAKE |
| Kazimir, blood, hit and run, heals from every hit | Claw, Blood Whip, Bat Bite | Bat Swarm, Hemorrhage, Shadow Step, Blood Mist | Crimson Lance, Blood Nova, Bat Cloud, Drain Life | Abduction, Vampiric Frenzy, Night Wings, Exsanguinate | CRIMSON MOON |
| Seraphine, holy, support | Smite, Holy Bolt, Censer | Lay On Hands, Blessing, Consecrate, Radiant Spear | Holy Nova, Guardian Angel, Chains Of Light, Sacred Flame | Divine Beam, Sanctuary, Miracle | JUDGMENT |
| Nerida, ice and water, ranged: waves sweep foes to the far wall, frost freezes them into ice blocks | Frost Shard, Water Whip, Bubble | Frost Nova, Tidal Push, Ice Lance, Chilling Mist | Flash Freeze, Riptide, Glacial Spikes, Hail | Great Wave, Deep Freeze, Frozen Tomb | TSUNAMI |

Every fourth floor a boss rises. When a floor is cleared it collapses and the hero drops to the next one. If the hero falls, the floor starts over.

## Controls
The game is always landscape. On a phone held upright it is drawn sideways, so just turn the phone (this works with rotation lock on).

| | Touch | Keyboard | Gamepad |
|---|---|---|---|
| Move | depends on CONTROLS: **tap to move** (the default: tap a spot, hold and drag to steer), **drag anywhere** (invisible stick) or a **fixed stick** at the bottom left | WASD / arrows (or click to move) | left stick |
| Dodge (untouchable mid-dodge, then 15 s to recover) | » button | Space / Shift | A |
| Spells (Low, Medium, High) | the three round buttons; they work in every mode, autopilot included | 1-3 | X, Y, B |
| Ultimate (when the ring is full) | big corner button | R or Q | RT / LB |
| MOVEMENT: MANUAL / AUTO MOVE / AUTOPILOT | top bar | T | Select |
| SPELLS: MANUAL / AUTO | top bar | G | L3 |
| CONTROLS: DRAG / TAP TO MOVE / STICK | top bar | C | |
| Spellbook | SPELLBOOK or the hero frame | B | Start |
| Menu (pause, co-op, sound, back to the main menu) | MENU | Esc | |

**AUTO MOVE** walks the hero for you; you still dodge, and dragging takes over for a moment. **AUTOPILOT** walks and dodges by itself: it steps out of telegraphed slams, sidesteps shots about to land and breaks out when surrounded and badly hurt. **AUTO SPELLS** casts your spells for you. The spell buttons always work: tapping one fires it at once, whatever MOVEMENT and SPELLS are set to. If you don't touch anything for 10 seconds during a fight, autopilot with auto spells takes over until you do. MENU pauses a solo game; in co-op the fight goes on.

Tap once for sound. On Android the game also goes fullscreen and big hits vibrate.

## Co-op (up to 4 heroes)
Choose **HOST CO-OP** on the menu to open **The Cellar Door**, the lobby: a 4-letter room code, **SEND INVITE LINK**, and four seats that fill as friends arrive, each showing the hero that player picked. Friends tap the invite link, or **JOIN CO-OP** and type the code on the letter pad. When everyone is ready the host taps **DESCEND**; each player then picks a basic attack and a first spell. Friends who arrive later drop straight into the fight. A room can also be opened mid-run from **MENU → PLAY TOGETHER**.

- XP and levels are shared; each player makes their own picks after every floor and boss, and picking never pauses the fight.
- A fallen hero comes back after 9 seconds while anyone is still standing.
- If a guest's connection drops, their hero fights on by itself and they get it back when the page reconnects. The host's phone runs the game, so it must stay open in the foreground.
- The connection indicator under the top bar shows round trip, packet loss and sync state; tap it for details.
- Matchmaking uses the free public PeerJS server; phones then talk directly, or through a relay when a network blocks direct connections. Co-op runs on the GitHub Pages / Home Screen version, not inside claude.ai.

## Run it
Open `index.html` (it is self-contained), or add the GitHub Pages site to your Home Screen.

## Build
```
python3 -I tools/pack.py <extracted cellar tileset zip> <extracted creature packs> .
python3 -I tools/recolor.py   # vampire, vampire lord, priest, archpriest, tidecaller and angel sprites (palette swaps)
node tools/build.js
```
`src/*.js` is concatenated into `index.html` (Pages / Home Screen) and `dist/artifact.html`.
Checks: `node tools/shots.js`, `node tools/scenes.js`, `node tools/soak.js` against a local server on port 8787.

Art: Farm Game Dungeon Cellar tileset (rooms and props) and the earlier creature packs (heroes and monsters).
