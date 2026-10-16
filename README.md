# Emberkin

A procedural 2D colony / god game that runs entirely in the browser — no image assets, pure HTML5 Canvas + ES6 modules.

## Play

**Live (GitHub Pages):** https://szaielamri.github.io/pixel-colony-sim/

Or open `index.html` via any static file server (modules require `http://`, not `file://`).

```bash
npx --yes serve .
```

## Controls

| Input | Action |
| --- | --- |
| Drag | Pan camera |
| Scroll / pinch | Zoom |
| Tap villager | Inspect (Watch) |
| 1–9 / power bar | God powers |
| Space | Pause |
| Save button | Local / export / JSONBin cloud |

### God powers
Watch · **Possess (0)** · Bless · Inspire · **Whisper** · Manna · Lightning · Storm · Fire · Hut

**Possess:** click a villager, then WASD/arrows to move and Space to chop/build. Esc frees them (golden aura while possessed).

**Whisper** opens a menu (innovation, pardon, love, explore, rain). Devout minds usually obey; rebellious ones may defy.

**Rain (8)** cools fires and feeds farms. **Quake (Q)** cracks the land and shakes buildings.

**Build / Land bars:** campfire, hut, storage, research, well; brushes raise land, dig water, plant trees, spawn wildlife.

**Goals** in the chronicle (population, Bronze Age, religion, festival, Year 5). Festivals start when morale and food are high.

Tap a **❓** above a villager during a dilemma to guide them.

## Saves
- Auto-saves to `localStorage` every 60s and on tab hide
- Export/import Base64 save codes for phone ↔ PC
- Optional [JSONBin.io](https://jsonbin.io) cloud: paste your API key in the Save panel (stored only on that device)

## Mobile
- Pointer + pinch zoom
- Compact power grid, inspector docks above the toolbar
- Touch-friendly notice bar for refugees and prayers

## Stack
`index.html` · `styles.css` · `src/main.js` · `src/simulation.js` · `src/villager.js` · `src/renderer.js`
