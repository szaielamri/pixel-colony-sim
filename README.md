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
Watch · Bless · Inspire · **Whisper** · Manna · Lightning · Storm · Fire · Hut

**Whisper** opens a menu (innovation, pardon, love, explore, rain). Devout minds usually obey; rebellious ones may defy.

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
