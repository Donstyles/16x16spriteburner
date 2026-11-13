# Cellar of Ruin

One hero fights down an endless cellar, floor by floor. Steer it yourself, hand parts of the job to the hero, or bring up to three friends.

The main menu offers **PLAY SOLO**, **HOST CO-OP** and **JOIN CO-OP**, plus **HOW TO PLAY** and **CONTROLS**. Your first solo game starts with a short hands-on tutorial (move, automatic attacks, casting, dodging, growing stronger); each step ends when you do it, SKIP ends it at any time, and HOW TO PLAY replays it. Enemies take it easy on you while the tutorial runs.

## Spells and progression
- **Before the first wave** you pick a hero, its basic attack (it fires by itself at the nearest foe) and a first spell (three random Low spells). Mossa and Seraphine also start with a heal on button 1.
- **After every floor** (on boss floors: after the boss) you pick one of three cards: usually two new spells and one upgrade. Unpicked cards pick themselves after 18 seconds.
- **Levels** give no cards. Each level heals 35% and raises health and damage; at levels 2, 5, 9 and 12 the Low, Medium, High and Ultimate spells join the card pool. Most heroes evolve at level 10 (Voltaire at 12).
- **Four buttons plus an ultimate.** When all four are full, a new spell replaces the weakest one (the card names it); its upgrades are kept in case you learn it again.
- **Upgrades:** three per spell, basic attacks included. Damage, size and duration upgrades multiply; extra projectiles or targets add up.
- **Ultimate:** a card from level 12; once learned its ring fills as you fight, and a full ring casts it.
- The SPELLBOOK (button, the hero frame, or B) shows every skill you know and its upgrades; the battle pauses while it is open.

| Hero | Basic attacks (pick one) | Low (level 2+) | Medium (5+) | High (9+) | Ultimate (12+) |
|---|---|---|---|---|---|
| Brandt, steel, melee | Slash, Cleave, Quick Stab | Shield Bash, Lunge, Rising Slash | Blade Flurry, Sword Wave, Ground Pound, Charge | Whirlwind, Thousand Cuts | CATACLYSM |
| Ignis, fire, ranged | Ember Bolt, Fire Orb, Flame Jet | Cinder Spray, Immolate, Blazing Darts | Flame Wall, Heat Ray, Fire Serpents, Magma Pools | Fireball, Flame Nova | METEOR STORM |
| Voltaire, lightning, ranged | Spark, Arc Whip, Storm Bolt | Static Charge, Shock Orb, Gust | Lightning Lance, Tesla Coil, Arc Field | Chain Lightning, Ball Lightning, Arc Cannon | THUNDERSTORM |
| Mossa, earth, support | Pebble, Thorn Dart, Mud Ball | Mend, Thorn Lash, Rejuvenate, Entangle | Stone Fist, Insect Swarm, Boulder Roll | Stone Spikes, Mass Heal, Resurrection | EARTHQUAKE |
| Kazimir, blood, hit and run, heals from every hit | Claw, Blood Whip, Bat Bite | Bat Swarm, Hemorrhage, Shadow Step, Blood Mist | Crimson Lance, Blood Nova, Bat Cloud, Drain Life | Abduction, Vampiric Frenzy, Night Wings, Exsanguinate | CRIMSON MOON |
| Seraphine, holy, support | Smite, Holy Bolt, Censer | Lay On Hands, Blessing, Consecrate, Radiant Spear | Holy Nova, Guardian Angel, Chains Of Light, Sacred Flame | Divine Beam, Sanctuary, Miracle | JUDGMENT |

Every fourth floor a boss rises. When a floor is cleared it collapses and the hero drops to the next one. If the hero falls, the floor starts over.

## Controls
The game is always landscape. On a phone held upright it is drawn sideways, so just turn the phone (this works with rotation lock on).

| | Touch | Keyboard | Gamepad |
|---|---|---|---|
| Move | depends on CONTROLS: **drag anywhere** (invisible stick), **tap to move** (tap a spot, hold and drag to steer) or a **fixed stick** at the bottom left | WASD / arrows (or click to move) | left stick |
| Dodge (untouchable mid-dodge) | » button: three charges, each refills in 1.6 s | Space / Shift | A |
| Skills 1-4 | the four round buttons | 1-4 | X, Y, B, RB |
| Ultimate (when the ring is full) | big corner button | R or Q | RT / LB |
| MOVEMENT: MANUAL / AUTO MOVE / AUTOPILOT | top bar | T | Select |
| SPELLS: MANUAL / AUTO | top bar | G | L3 |
| CONTROLS: DRAG / TAP TO MOVE / STICK | top bar or main menu | C | |
| Spellbook | SPELLBOOK or the hero frame | B | Start |
| Menu (pause, co-op, sound, back to the main menu) | MENU | Esc | |

**AUTO MOVE** walks the hero for you; you still dodge, and dragging takes over for a moment. **AUTOPILOT** walks and dodges by itself: it steps out of telegraphed slams, sidesteps shots about to land and breaks out when surrounded and badly hurt. **AUTO SPELLS** casts your skills for you; tapping one still fires it at once. If you don't touch anything for 10 seconds during a fight, autopilot with auto spells takes over until you do. MENU pauses a solo game; in co-op the fight goes on.

Tap once for sound. On Android the game also goes fullscreen and big hits vibrate.

## Co-op (up to 4 heroes)
Choose **HOST CO-OP** on the menu to open **The Cellar Door**, the lobby: a 4-letter room code, **SEND INVITE LINK**, and four seats that fill as friends arrive, each showing the hero that player picked. Friends tap the invite link, or **JOIN CO-OP** and type the code on the letter pad. When everyone is ready the host taps **DESCEND**; each player then picks a basic attack and a first spell. Friends who arrive later drop straight into the fight. A room can also be opened mid-run from **MENU → PLAY TOGETHER**.

- XP and levels are shared; each player gets their own cards after every floor and boss, and picking never pauses the fight.
- A fallen hero comes back after 9 seconds while anyone is still standing.
- If a guest's connection drops, their hero fights on by itself and they get it back when the page reconnects. The host's phone runs the game, so it must stay open in the foreground.
- The connection indicator under the top bar shows round trip, packet loss and sync state; tap it for details.
- Matchmaking uses the free public PeerJS server; phones then talk directly, or through a relay when a network blocks direct connections. Co-op runs on the GitHub Pages / Home Screen version, not inside claude.ai.

## Run it
Open `index.html` (it is self-contained), or add the GitHub Pages site to your Home Screen.

## Build
```
python3 -I tools/pack.py <extracted cellar tileset zip> <extracted creature packs> .
python3 -I tools/recolor.py   # vampire, vampire lord, priest, archpriest and angel sprites (palette swaps)
node tools/build.js
```
`src/*.js` is concatenated into `index.html` (Pages / Home Screen) and `dist/artifact.html`.
Checks: `node tools/shots.js`, `node tools/scenes.js`, `node tools/soak.js` against a local server on port 8787.

Art: Farm Game Dungeon Cellar tileset (rooms and props) and the earlier creature packs (heroes and monsters).
