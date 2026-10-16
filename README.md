# Emberkin

**A browser god-colony simulator** where a living people invent tools, form nations, fall in love, wage wars, and climb from the Stone Age toward nuclear fire — while you watch from the sky, or reach down when you choose.

No downloads. No image packs. Pure HTML5 Canvas + ES6, procedural pixel art, runs in the browser on desktop and phone.

**Play live:** [https://szaielamri.github.io/pixel-colony-sim/](https://szaielamri.github.io/pixel-colony-sim/)

---

## What is this game?

You are not a city builder clicking every hut. You are the **sky** — a distant presence over a small world of autonomous villagers.

By default the civilization **runs itself**: people hunt, chop, farm, sleep, talk, argue, pray, pair up, raise children, found religions, invent technologies, form nations, and sometimes go to war. You can **spectate** and let history write itself, or **intervene** with divine powers, possess a single soul, reshape the land, or whisper into someone’s heart.

Think: *tiny procedural civ sim × gentle god game × living soap opera*, all in chunky pixels.

---

## Highlights

- **Fully autonomous AI villagers** — wants, thoughts, speech, jobs, moods, skills, bonds, and free-will decisions
- **Ages of progress** — Stone → Bronze → Medieval → Industrial → Nuclear
- **Research tree** — insight fields (food, tools, shelter, fire, culture, faith) unlock dozens of technologies
- **Economy** — food, wood, stone, gold, gas; mines, farms, storage, gas wells, reactors
- **Nations & politics** — tribes, elders/presidents, wars between peoples
- **Faith** — nature cults, storm worship, divine cults oriented toward you or the wild
- **Wildlife** — 15 animal kinds with predators, prey, and domestic livestock
- **Possess mode** — walk as one villager (WASD / mobile D-pad)
- **Spectate by default** — intervene only when you want
- **Day/night, seasons, weather** — rain, hurricanes, wildfire, quakes, festivals
- **Genetics & family** — lineages, houses, pregnancy, children, hereditary traits
- **Mobile-friendly HUD** — compact bars, larger taps, map-focus toggle, chronicle sheet
- **Saves** — local auto-save, export/import codes, optional JSONBin cloud

> **Note:** Opening the same link does **not** share one live world. Each browser gets its own colony (unless you export a save code or use the same cloud room).

---

## How to play (quick start)

1. Open the live link (or run locally — see below).
2. Leave **Spectate / Auto** on and watch the first camp wake up.
3. Tap a villager (**Watch**) to open their life: hunger, energy, thoughts, family, bonds.
4. When you want to meddle, pick a power from the bottom bar.
5. Try **Possess** on someone and walk them with **WASD** (or the on-screen pad on phone).
6. Check **Chronicle** for goals, studies, and the log of ages.

### Goals (starter checklist)

| Goal | What it means |
| --- | --- |
| Grow to 12 living souls | Population milestone |
| Enter the Bronze Age | Unlock bronze-era tech path |
| Found a religion | Faith takes a name |
| Hold a festival | High morale + food celebration |
| Reach Year 5 | Survive the early ages |

---

## Controls

### Camera & world

| Input | Action |
| --- | --- |
| Drag | Pan the map |
| Scroll / pinch | Zoom |
| Minimap | Tap to jump the camera |
| Space | Pause / resume (also Act while possessing) |
| 1× / 2× / 3× | Simulation speed |

### God powers

| Key | Power | What it does |
| --- | --- | --- |
| `1` | **Watch** | Inspect villagers; hold to lift/carry |
| `0` / `P` | **Possess** | Enter a body; WASD move; Space acts; Esc frees |
| `2` | **Bless** | Favor a soul (or shrine offerings) |
| `3` | **Inspire** | Strike someone with an idea / insight |
| `9` | **Whisper** | Divine command menu (see below) |
| `4` | **Manna** | Drop food on the land |
| `5` | **Bolt** | Lightning strike |
| `6` | **Storm** | Place a hurricane eye |
| `7` | **Fire** | Kindle wildfire |
| `8` | **Rain** | Cool fires, feed farms, lift faith |
| `Q` | **Quake** | Crack earth, damage structures |

**Whisper options:** Inspire Innovation · Pardon Rival · Seek Love · Explore Wilderness · Pray for Rain  
Devout minds often obey; rebellious ones may refuse.

### Build & land tools

**Build bar:** campfire · hut · storage · research table · well  
**Land brushes:** raise land · dig water · plant trees · spawn wildlife  

Place blueprints when the nearest camp has the materials. Later ages unlock mines, gas wells, reactors, and more via tech/AI.

### Mobile

- Pinch zoom, drag pan, larger villager hitboxes  
- **☰** — map focus (hide clutter)  
- **📜** — chronicle sheet  
- Swipeable power strip, safe-area padding for notched phones  
- D-pad + **Act** appear while **Possessing**

---

## What’s in the simulation

### Villagers (the heart of the game)

Each person is a small AI with:

- **Needs** — hunger, rest/energy, social, safety, health  
- **Mind** — wants, thoughts, spoken lines, moods, emotes  
- **Personality** — traits, empathy / boldness / peacefulness / god-alignment  
- **Skills** — improve through work (foraging, building, fighting, study…)  
- **Relationships** — affinity, love, rivalry, student bonds  
- **Life stages** — infant → child → youth → adult → mature → elder  
- **Body** — injuries, illness, sleep debt, temperature, prosthetics (with carpentry)  
- **Family** — partners, pregnancy, children, surnames / founder houses, genetics  
- **Dilemmas** — moral choices; you can guide them when a **❓** appears  

They decide jobs on their own: gather, chop, mine, farm, build, research, sleep, talk, mourn, flee predators, celebrate festivals, and more.

### Tribes, nations & war

- Multiple peoples can split and settle  
- Leaders / elders / presidents  
- Shared stores (food, wood, stone…)  
- Nations form over time; wars can break out between peoples  

### Ages & technology

Progress is driven by **insight** in six fields. Discoveries unlock eras:

1. **Stone Age** — speech, foraging, campfire, stone tools, mud huts, farming, nature worship  
2. **Bronze Age** — weaving, irrigation, writing, kiln, bronze, storm worship, carpentry…  
3. **Medieval** — iron, walls, crop rotation, laws, divine cult, armor, sanitation…  
4. **Industrial** — steam, factories, filtration (and pollution)  
5. **Nuclear** — atomic energy, reactors (power — and risk)

Clothing and looks shift with the era. The chronicle tracks active studies and percent progress.

### Resources & structures

| Resource | Role |
| --- | --- |
| Food | Survival, festivals, livestock yields |
| Wood | Building, fuel, tools chain |
| Stone | Heavier builds, forges, walls |
| Gold | Personal / tribal wealth (mines) |
| Gas | Later-age industry (gas wells) |

Structures include campfires, huts, storage, research tables, wells, forges, farms, mines, factories, reactors, shrines, and graves of the remembered dead.

### Wildlife

Fifteen kinds roam the map:

`deer` · `wolf` · `boar` · `cattle` · `fox` · `rabbit` · `bear` · `sheep` · `goat` · `chicken` · `horse` · `snake` · `beaver` · `moose` · `pig`

- Predators (wolf, bear, snake) can attack people and prey  
- Livestock can become domestic and feed nearby tribes  
- Beavers favor water and may encourage brush growth  
- Land brush **🦌** spawns more game  

### Faith, disasters & ambient world

- Religions form and name themselves; belief leans toward **you** or the **wild**  
- Prayers and offerings appear in the notice bar  
- Day / night cycle with campfire light pools  
- Seasons (spring–winter), temperature, moon phase  
- Rain, hurricanes, wildfire, earthquakes, disease, pollution / fallout in late ages  
- Festivals when morale and food are high  

### You, the god

- **Spectate** — civilization is autonomous; powers dim until you intervene  
- **Possess** — live one life at a time (golden aura)  
- **Hold / lift** — long-press a villager in Watch mode to carry them  
- **Rest** — send weary / selected people to sleep  
- Cooldowns on powers; chronicle logs every age-turning event  

---

## Saves & sharing

| Method | Shared across devices? | Notes |
| --- | --- | --- |
| **Local auto-save** | No | `localStorage`, every ~60s and when the tab hides |
| **Export / Import code** | Yes (manual) | Copy the code from Save → paste on phone/PC |
| **JSONBin cloud** | Yes (manual setup) | Free API key at [jsonbin.io](https://jsonbin.io); key stays on that device; same Room ID on both ends |

Same URL ≠ same save. Friends who open the link get a **fresh world** of their own.

---

## Run locally

ES modules need a local server (`file://` will not work).

```bash
# from the project root
npx --yes serve .
```

Then open the URL it prints (usually `http://localhost:3000`).

Or use any static host: GitHub Pages, Netlify, Cloudflare Pages, etc. Point it at the repo root (`index.html`).

---

## Project structure

```text
.
├── index.html          # Shell, HUD markup, power bar, overlays
├── styles.css          # Glass UI, mobile layout, safe areas
├── README.md
├── publish.ps1         # Optional publish helper
└── src/
    ├── main.js         # Loop, input, HUD, save/cloud, mobile chrome
    ├── simulation.js   # World, eras, tech, tribes, wars, animals, powers
    ├── villager.js     # Traits, needs, AI mind, jobs, pathing, speech
    └── renderer.js     # Procedural pixel sprites, terrain cache, weather
```

**Stack:** vanilla JS (ES modules) · HTML5 Canvas · CSS · no framework · no external art assets  
**Audio:** tiny Web Audio beeps (muteable)

---

## Design notes

- Default stance is **spectate**: the fun is watching a civilization invent itself.  
- Intervention is optional and powerful — lightning and storms can feed myths… or trauma.  
- Performance: staggered AI ticks, view culling, chunky pixel buffer on high-DPI / phones.  
- Tone: lyrical chronicle lines, soft glass HUD, intentional pixel scale (not a 3D engine).

---

## Roadmap ideas (not promises)

- Deeper diplomacy UI between nations  
- More late-game buildings & disasters  
- Shared spectator rooms / true multiplayer saves  
- Optional true 3D or isometric view  
- Richer tutorial & accessibility options  

---

## License

Add your preferred license here (e.g. MIT). Until then, treat the repo author’s rights as reserved if none is declared.

---

## Credits

**Emberkin** — a procedural god-colony toy built for the browser.  
Live build: [szaielamri.github.io/pixel-colony-sim](https://szaielamri.github.io/pixel-colony-sim/)

*You are the sky. The land keeps whatever it learns.*
